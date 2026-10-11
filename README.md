# 1) scraper
pip install -r requirements.txt
export LLM_API_KEY=...          # any OpenAI-compatible API (optional: LLM_BASE_URL, LLM_MODEL)
python scraper.py               # writes public/bonuses.json

# 2) page
npm install
npm run dev                     # http://localhost:5173
npm run build                   # static site in dist/