# Casino Bonus Terms — Scraper + React

A Python scraper reads three public South African casino review pages, uses a language model to convert bonus terms into structured data, and writes the results to `public/bonuses.json`. A React + Vite website displays the data in a responsive comparison interface.

**Live website:** https://casino-bonus-compare.vercel.app/

## 1. Requirements

Install the following before running the project:

- Python 3.10 or newer
- Node.js and npm
- An API key for an OpenAI-compatible language model provider

## 2. Install and run the scraper

Open a terminal in the project root directory, where `scraper.py` and `requirements.txt` are located.

Install the Python dependencies:

```bash
python -m pip install -r requirements.txt
```

On Windows, if `python` is not recognised, use:

```powershell
py -m pip install -r requirements.txt
```

### Configure environment variables

Create a file named `.env` in the project root, next to `scraper.py`.

Copy this example into `.env`:

```env
LLM_API_KEY=your_api_key_here
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

Replace the example values with valid credentials and settings from your chosen language model provider.

For example, if you use Groq, configure `LLM_BASE_URL` and `LLM_MODEL` with the endpoint and model name supported by your Groq account.

**Security notes:**

- `your_api_key_here` is a placeholder, not a working API key.
- Each tester should use their own API key or receive approved test credentials securely.
- Never commit `.env` or publish your API key on GitHub.
- The repository's `.gitignore` excludes `.env` files.
- Do not put private API keys in the React frontend or Vercel client-side environment variables.

### Run the scraper

```bash
python scraper.py
```

On Windows, you can also run:

```powershell
py scraper.py
```

The scraper reads the source pages, validates extracted values, and writes the results to:

```text
public/bonuses.json
```

If the scraper fails to retrieve or validate the required sources, it should report an error rather than replace the existing data with an incomplete result.

## 3. Run the website locally

Install the JavaScript dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed in your terminal. It is usually:

http://localhost:5173/

Create a production build:

```bash
npm run build
```

Vite writes the production files to the `dist/` directory.

## 4. Run the tests

Run the Python tests:

```bash
python -m pytest -q
```

On Windows, if necessary:

```powershell
py -m pytest -q
```

Run the JavaScript test command:

```bash
npm test
```

Build the website to check for production compilation errors:

```bash
npm run build
```

The Python tests cover the extraction validation implemented in `tests/test_scraper.py`. Confirm the actual test output before reporting a test as passed. The JavaScript test command should not be described as testing formatting helpers unless those tests have been implemented.

## 5. Data sources

The scraper uses three public South African casino review pages configured in `SOURCES` inside `scraper.py`.

The configured sources should be verified against the actual URLs in that file before submitting or changing this documentation.

The scraper checks the source site's `robots.txt` rules and skips pages that it is not allowed to fetch. It does not attempt to bypass CAPTCHAs, access restrictions, or JavaScript challenges.

Source pages and their terms can change. Extracted information should always be checked against the original source.

## 6. Output data

The generated `public/bonuses.json` file contains structured information about the reviewed casinos.

Depending on the source and validation results, the data includes fields such as:

- `welcome_bonus` — the advertised welcome offer.
- `wagering_requirement` — the wagering multiplier, when it can be established.
- `min_deposit` — the minimum deposit amount, when stated.
- `currency` — the currency associated with monetary amounts.
- `source_url` — the page from which the information was extracted.
- `evidence` — supporting quotations from the source text.

Unknown, ambiguous, or unsupported values should be represented as `null` rather than guessed. The website displays missing values as **Not stated**.

## 7. Deployment

The website is hosted on Vercel:

https://casino-bonus-compare.vercel.app/

Vercel can build and deploy the website automatically when changes are pushed to the connected GitHub repository's `main` branch.

The production build command is:

```bash
npm run build
```

The output directory is:

```text
dist
```

### Automated scraping with GitHub Actions

The GitHub Actions workflow is configured to run checks on pushes to `main`. Scheduled or manually triggered runs can also execute the scraper, depending on the workflow configuration.

For automated scraping, configure the following in your GitHub repository under **Settings → Secrets and variables → Actions**:

**Repository secret**

```text
LLM_API_KEY
```

**Repository variables**

```text
LLM_BASE_URL
LLM_MODEL
```

Use the endpoint and model appropriate for your provider.

If the workflow commits an updated `public/bonuses.json` file to `main`, that commit can trigger a new Vercel deployment through the repository integration.

The scheduled run is intended to run daily at 05:17 UTC, which is 07:17 in South Africa (SAST). Verify the active workflow file to confirm the schedule is still configured.

## 8. Design and validation decisions

- **Python extraction:** `requests` and BeautifulSoup are used to retrieve and parse static HTML.
- **Language model extraction:** the model converts free-text bonus terms into structured fields.
- **Evidence-based validation:** extracted values are checked against source evidence.
- **No guessing:** unknown or ambiguous values are represented as `null`.
- **Robots.txt compliance:** disallowed pages are skipped rather than scraped.
- **Failure handling:** failed or incomplete scraping runs should not replace the last valid dataset.
- **React interface:** the website renders its comparison data from `public/bonuses.json` rather than relying on manually entered table rows.
- **Responsive design:** the interface is designed to work on desktop and mobile screens.
- **Source transparency:** users can inspect source links and supporting evidence where provided.

## 9. Known limitations

- JavaScript-rendered pages may not expose enough text for the scraper.
- Bonus terms may differ between components of a multi-part offer. Fields that cannot be resolved consistently may be returned as `null`.
- Source pages can contain conflicting figures or outdated promotional terms.
- Wagering requirements must be interpreted in context; for example, `15x deposit` is not necessarily the same as `15x deposit plus bonus`.
- The Python standard library's robots parser does not fully implement every wildcard convention used by some `robots.txt` files.
- Scraped data is only as current and accurate as the accessible source pages and the validation process.
- A successful extraction does not guarantee that a casino still offers the same promotion on its own website.

## 10. Remaining verification before submission

Before submitting the project, verify the following:

- [ ] The source URLs in this README match `SOURCES` in `scraper.py`.
- [ ] The `.env` configuration matches the provider used by the tester.
- [ ] `.env` and real API credentials are not committed to Git.
- [ ] `python -m pytest -q` passes.
- [ ] `npm run build` completes successfully.
- [ ] The live Vercel site loads and displays the generated data.
- [ ] The GitHub Actions workflow matches the documented schedule and scraping behaviour.
- [ ] Any unfinished integration or missing end-to-end test is disclosed honestly.

