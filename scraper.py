
"""
Scrape welcome-bonus terms for three casinos from ONE permitted public source,
have an LLM turn the free text into structured fields, write public/bonuses.json.

Run: python scraper.py
"""
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup


def load_dotenv(path=".env"):
    """Tiny .env reader: real environment variables win."""
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(
                    k.strip(), v.strip().strip('"').strip("'")
                )


load_dotenv()

SOURCES = [
    {
        "name": "10bet",
        "url": "https://www.casino.org/en-za/reviews/10bet/",
        "selector": None,
    },
    {
        "name": "Mzansibet",
        "url": "https://www.casino.org/en-za/reviews/mzansibet/",
        "selector": None,
    },
    {
        "name": "Easybet",
        "url": "https://www.casino.org/en-za/reviews/easybet/",
        "selector": None,
    },
]

BOT_TOKEN = "BonusTermsAssessmentBot"
USER_AGENT = (
    f"{BOT_TOKEN}/1.0 "
    "(coding assessment; contact: you@example.com)"
)
OUTPUT_FILE = os.path.join("public", "bonuses.json")
MAX_CHARS = 12000
REQUEST_DELAY_S = 2

LLM_BASE_URL = os.getenv(
    "LLM_BASE_URL", "https://api.openai.com/v1"
).rstrip("/")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
LLM_API_KEY = os.getenv("LLM_API_KEY")

KEYWORDS = re.compile(
    r"bonus|wager|rollover|playthrough|play-through|deposit|"
    r"free spins|match|terms",
    re.IGNORECASE,
)

SYSTEM_PROMPT = """You extract casino welcome-bonus terms from scraped web text.
Use ONLY the text provided. Never guess, infer, or use outside knowledge.
If a value is missing, ambiguous, or conflicting, return null for it.
If several welcome tiers exist, use the first-deposit welcome offer.
If the offer has several parts with different wagering or deposit figures, or the
page states two different values for the same field, return null for that field.
A general payment-method minimum is not the welcome bonus minimum deposit.
Return a single JSON object with exactly these keys:
{
  "welcome_bonus": string|null,
  "wagering_requirement": number|null,
  "min_deposit": number|null,
  "currency": string|null,
  "evidence": {
    "welcome_bonus": string|null,
    "wagering_requirement": string|null,
    "min_deposit": string|null
  }
}
Every non-null value must have a verbatim evidence snippet (max 200 chars).
Output JSON only."""


def log(msg):
    print(msg, file=sys.stderr)


def with_retries(fn, attempts=5):
    """Retry transient failures with exponential backoff."""
    for i in range(attempts):
        try:
            return fn()
        except requests.RequestException as e:
            status = getattr(
                getattr(e, "response", None), "status_code", None
            )
            transient = (
                status is None or status == 429 or status >= 500
            )
            if not transient or i == attempts - 1:
                raise
            wait = 2 ** (i + 1)
            log(f"  transient error ({e}); retrying in {wait}s")
            time.sleep(wait)


def robots_allows(url):
    """Check whether robots.txt permits our bot to fetch this URL."""
    p = urlparse(url)
    robots_url = f"{p.scheme}://{p.netloc}/robots.txt"

    try:
        r = requests.get(
            robots_url,
            headers={"User-Agent": USER_AGENT},
            timeout=15,
        )
    except requests.RequestException as e:
        log(f"  robots.txt unreachable ({e}); refusing to scrape")
        return False

    if r.status_code in (401, 403):
        return False
    if r.status_code >= 400:
        return True

    rp = RobotFileParser()
    rp.parse(r.text.splitlines())
    return rp.can_fetch(BOT_TOKEN, url)


def fetch_html(url):
    def go():
        r = requests.get(
            url, headers={"User-Agent": USER_AGENT}, timeout=20
        )
        r.raise_for_status()
        return r.text

    return with_retries(go)


def extract_text(html, selector=None):
    soup = BeautifulSoup(html, "html.parser")

    for tag in soup([
        "script", "style", "noscript", "nav", "footer", "header",
        "svg", "form", "iframe",
    ]):
        tag.decompose()

    root = soup.select_one(selector) if selector else None
    root = root or soup.body or soup
    text = re.sub(r"\s+", " ", root.get_text(" ", strip=True))

    if len(text) <= MAX_CHARS:
        return text

    sentences = re.split(r"(?<=[.!?])\s+", text)
    picked = [s for s in sentences if KEYWORDS.search(s)]
    return " ".join(picked or sentences)[:MAX_CHARS]


def norm(s):
    return re.sub(r"\s+", " ", s).strip().lower()


def call_llm(text):
    if not LLM_API_KEY:
        sys.exit("Set LLM_API_KEY first.")

    payload = {
        "model": LLM_MODEL,
        "temperature": 0,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"TEXT:\n{text}"},
        ],
        "response_format": {"type": "json_object"},
    }

    headers = {"Authorization": f"Bearer {LLM_API_KEY}"}
    url = f"{LLM_BASE_URL}/chat/completions"

    def post():
        r = requests.post(
            url, headers=headers, json=payload, timeout=60
        )

        if r.status_code == 400 and "response_format" in payload:
            payload.pop("response_format")
            r = requests.post(
                url, headers=headers, json=payload, timeout=60
            )

        if r.status_code >= 400:
            raise requests.HTTPError(
                f"{r.status_code} from LLM API: {r.text[:300]}",
                response=r,
            )

        return r

    r = with_retries(post)
    content = r.json()["choices"][0]["message"]["content"]
    content = re.sub(
        r"^```(?:json)?|```$", "", content.strip(), flags=re.M
    ).strip()

    return json.loads(content)


def validate(raw, source_text):
    """Validate extracted values and require evidence from the page."""
    text_n = norm(source_text)
    evidence = raw.get("evidence") or {}
    out = {"evidence": {}}

    def supported(field):
        snippet = evidence.get(field)
        ok = (
            isinstance(snippet, str)
            and bool(snippet.strip())
            and norm(snippet) in text_n
        )

        if not ok:
            log(f"  dropping '{field}': evidence not found in page text")

        return snippet if ok else None

    bonus = raw.get("welcome_bonus")
    out["welcome_bonus"] = (
        bonus.strip()
        if isinstance(bonus, str) and bonus.strip()
        else None
    )

    wag = raw.get("wagering_requirement")
    out["wagering_requirement"] = (
        wag
        if isinstance(wag, (int, float))
        and not isinstance(wag, bool)
        and 0 < wag <= 200
        else None
    )

    dep = raw.get("min_deposit")
    out["min_deposit"] = (
        dep
        if isinstance(dep, (int, float))
        and not isinstance(dep, bool)
        and dep >= 0
        else None
    )

    cur = raw.get("currency")
    out["currency"] = (
        cur.upper()
        if isinstance(cur, str)
        and re.fullmatch(r"[A-Za-z]{3}", cur)
        else None
    )

    # FIX: If the model omitted currency, check the actual scraped page.
    # An explicit rand amount such as R20 or R1,500 indicates ZAR.
    if out["currency"] is None:
        if re.search(r"\bR\s*[\d,]+(?:\.\d{2})?\b", source_text):
            out["currency"] = "ZAR"
            log("  currency fallback: detected rand amount; using ZAR")

    for field in (
        "welcome_bonus",
        "wagering_requirement",
        "min_deposit",
    ):
        if out[field] is None:
            out["evidence"][field] = None
            continue

        snippet = supported(field)
        out["evidence"][field] = snippet

        if snippet is None:
            out[field] = None

    return out


def main():
    if any("REPLACE-ME" in s["url"] for s in SOURCES):
        sys.exit("Edit SOURCES in scraper.py first (see README).")

    items = []

    for i, src in enumerate(SOURCES):
        log(f"[{i + 1}/{len(SOURCES)}] {src['name']} - {src['url']}")

        if not robots_allows(src["url"]):
            log("  blocked by robots.txt; skipping")
            continue

        try:
            text = extract_text(
                fetch_html(src["url"]), src.get("selector")
            )

            if len(text) < 200:
                log("  page text too short (JS-rendered?); skipping")
                continue

            data = validate(call_llm(text), text)

        except (requests.RequestException, ValueError, KeyError) as e:
            log(f"  failed: {e}")
            continue

        items.append({
            "name": src["name"],
            "source_url": src["url"],
            **data,
        })

        time.sleep(REQUEST_DELAY_S)

    if len(items) < len(SOURCES):
        log(
            f"Only {len(items)}/{len(SOURCES)} succeeded; "
            f"keeping existing {OUTPUT_FILE} untouched."
        )
        sys.exit(1)

    result = {
        "scraped_at": datetime.now(timezone.utc).isoformat(
            timespec="seconds"
        ),
        "model": LLM_MODEL,
        "casinos": items,
    }

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    log(f"Wrote {len(items)} casino(s) to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
