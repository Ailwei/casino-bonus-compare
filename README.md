# Casino bonus terms: scraper + React page

Compares the welcome-bonus terms (bonus, wagering requirement, minimum deposit) of three
South Africa-facing casinos: 10bet, Mzansibet and Easybet.

Python scraper -> `public/bonuses.json` -> React (Vite) page, hosted on Vercel.
Live site (branded "BonusIndex"): https://casino-bonus-compare.vercel.app

> Informational only. Figures are extracted automatically from a single third-party source and
> may be wrong or out of date, so always check the terms on the operator's own site.
> Gambling is for adults (18+). Please gamble responsibly.

## Install and run

```
# 1) scraper
pip install -r requirements.txt
export LLM_API_KEY=...          # any OpenAI-compatible API (optional: LLM_BASE_URL, LLM_MODEL)
python scraper.py               # writes public/bonuses.json

# 2) page
npm install
npm run dev                     # http://localhost:5173
npm run build                   # static site in dist/
```

Before running the scraper for real, set a real contact address in `USER_AGENT` in `scraper.py`.
You can also put the variables above in a local `.env` file (real environment variables win).

Tests: `pytest -q` (extraction validation) and `npm test` (formatting helpers).

## Source

One public source: casino.org South Africa review pages for 10bet, Mzansibet and Easybet
(URLs in `SOURCES` in `scraper.py`). robots.txt was checked on 2026-10-11 and allows these paths;
the scraper also re-checks robots.txt on every run and skips any blocked page (or all pages, if
robots.txt can't be fetched). It does not follow the site's affiliate links (`/casinos/`,
disallowed by robots.txt).

## How it runs

The GitHub Actions workflow "Scrape and build" (`.github/workflows`) runs on every push to
`main`, daily at 05:17 UTC, and on demand (Actions tab -> Run workflow).

| Trigger | Steps |
| --- | --- |
| Push to `main` | `pytest` -> `npm test` -> `npm run build` |
| Daily schedule / manual run | `pytest` -> scrape -> commit `public/bonuses.json` if changed -> `npm test` -> `npm run build` |

The scrape step needs the repository secret `LLM_API_KEY`. Optional repository variables
`LLM_BASE_URL` and `LLM_MODEL` default to OpenAI and `gpt-4o-mini`. A failed run is reported by
GitHub's standard failure notifications.

## Deployment

The site is hosted on Vercel, connected to this repository. Vercel rebuilds and deploys on each
push to `main`, including the bot's `Update bonuses.json` commit, so fresh data goes live
without a separate deploy step in the workflow. The workflow only checks that the site builds.

## Design decisions

- `requests` + BeautifulSoup: terms are static HTML. Pages that need JS (under 200 characters of
  extracted text) are skipped, not worked around.
- The LLM only converts free text to fields (temperature 0, JSON output).
- Unknown/ambiguous = `null`. The prompt tells the model to null conflicting figures and to use
  the first-deposit welcome offer.
- Each of `welcome_bonus`, `wagering_requirement` and `min_deposit` needs a verbatim evidence
  snippet that appears in the page text, otherwise it is nulled. Types and ranges are validated
  (wagering must be > 0 and <= 200, minimum deposit >= 0).
- Currency is the exception: if the model returns none and the page contains a rand amount
  (e.g. `R20`), it is set to `ZAR`. This is a fallback, not extracted evidence.
- All-or-nothing: if any source fails or is skipped, the run exits non-zero and does NOT
  overwrite the existing `bonuses.json`.
- The React page renders everything from the JSON (offer count, update time and values; nothing typed in),
  shows "Not stated" for every null field, only links `http(s)` source URLs, and shows no currency
  rather than guessing one when the JSON has none.
- Evidence snippets are stored in the JSON but not yet shown on the page.

## Known limits

- The evidence check confirms the snippet exists on the page, not that it supports the value.
- Long pages are reduced to keyword-matching sentences and capped at 12,000 characters, so some
  context can be dropped.
- JS-rendered sources aren't supported. Multi-part offers get `null` for fields that differ per part.
- Python's robots parser ignores `*` wildcards in paths (fine for these URLs; use a wildcard-aware
  parser at scale).