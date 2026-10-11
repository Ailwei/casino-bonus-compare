# Casino bonus terms: scraper + React page

Python scraper -> `public/bonuses.json` -> React (Vite) page, deployed free on GitHub Pages.

## Install and run
```bash
# 1) scraper
pip install -r requirements.txt
export LLM_API_KEY=...          # any OpenAI-compatible API (optional: LLM_BASE_URL, LLM_MODEL)
python scraper.py               # writes public/bonuses.json

# 2) page
npm install
npm run dev                     # http://localhost:5173
npm run build                   # static site in dist/
```
Tests: `pytest -q` (extraction validation) and `npm test` (formatting helpers).

## Source
One public source: casino.org South Africa review pages for Hollywoodbets, Easybet and Betway
(URLs in `SOURCES` in `scraper.py`). robots.txt was checked on 2026-10-11 and allows these paths;
the scraper also re-checks robots.txt on every run and skips any blocked page. It does not follow
the site's affiliate links (`/casinos/`, disallowed by robots.txt).

## Publish (free)
1. Push to GitHub. Settings -> Pages -> Source: **GitHub Actions**.
2. Settings -> Secrets and variables -> Actions: secret `LLM_API_KEY`; variables `LLM_BASE_URL`, `LLM_MODEL` (if not OpenAI).
3. Run the "Scrape, build and deploy" workflow once (Actions tab -> Run workflow). It also runs daily.
Commit the generated `public/bonuses.json` too, so the repo contains the output.

## Design decisions
- `requests` + BeautifulSoup: terms are static HTML. Pages that need JS are skipped, not worked around.
- The LLM only converts free text to fields (temperature 0, JSON output).
- Unknown/ambiguous = `null`, never a guess. Each value needs a verbatim evidence snippet found in the page text,
  otherwise it is nulled. Types and ranges are validated. Prompt tells the model to null conflicting figures.
- A partial or failed run exits non-zero and does NOT overwrite the existing `bonuses.json`.
- React page renders rows from the JSON (nothing typed in), shows "Not stated" for nulls, scheme-checks links,
  stacks into labelled blocks on mobile, and supports dark mode.
- Daily GitHub Actions run: tests -> scrape -> commit data if changed -> build -> deploy. Failed runs email the owner.

## Known limits
- JS-rendered sources aren't supported. Multi-part offers get `null` for fields that differ per part.
- Python's robots parser ignores `*` wildcards in paths (fine for these URLs; use a wildcard-aware parser at scale).
