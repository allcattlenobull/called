# Career data: sources, updates and attribution

## What’s in the dataset

Careers live in typed TypeScript modules, one per family, under [`src/data/careers/`](../src/data/careers/). Each career includes its SOC code, pay (median, ~10th and ~90th percentile), outlook category, education and routes, working conditions, interest, skill, aptitude, value, gift, service and problem tags, plain-language responsibilities, a day in the life, a reality check, related careers and alternative routes.

The catalog contains 178 careers across 15 families and every training level. Careers added in the second release use the compact `define()` format in `src/data/careers/build.ts`.

## Sources

| Field | Source | Notes |
| --- | --- | --- |
| Pay | U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics (OEWS) | National, rounded estimates entered by hand, replaced by official API figures when the update workflow runs |
| State pay | Official BLS OEWS state estimates, when a reviewed snapshot is configured | Matched by state + SOC; missing records fall back to national and are labeled |
| State outlook | Official state occupational projections or Projections Central, when a reviewed snapshot is configured | Matched by state + SOC; no local growth value is invented |
| Outlook | BLS Employment Projections, 2023 to 2033 | Categories: declining, little change, average, faster, much faster |
| SOC codes | 2018 Standard Occupational Classification | Used to link to O*NET and BLS |
| Tasks, conditions, reality checks | Written by Called, informed by O*NET OnLine task and work-context data | Rewritten in plain language anyone can follow |
| Tuition assumptions | College Board, *Trends in College Pricing* | Published tuition and fees before aid |
| How AI is changing each career | Eloundou, Manning, Mishkin & Rock, “GPTs are GPTs: Labor market impact potential of LLMs,” *Science* 384 (2024); data from [openai/GPTs-are-GPTs](https://github.com/openai/GPTs-are-GPTs) (MIT license) | Human annotators’ ratings of O*NET task statements; “what this means” guidance written by Called |

“Small business owner” has no SOC wage series; its pay is a labeled rough estimate.

## How AI is changing each career

Every career page has a **How AI is changing this work** section, built by [`scripts/build-ai-impact.mjs`](../scripts/build-ai-impact.mjs):

- **Exposure** is the study’s human-rated β score: the share of an occupation’s O*NET tasks that an AI language tool could do at least twice as fast with the same quality (E1), plus half of those that would need extra software built on top (E2). Bands split the study’s 900+ occupations into rough thirds: low (under 0.20), moderate (0.20 to 0.40), high (0.40 and up).
- **Tasks AI tools could speed up** and **tasks that stay human** are real O*NET task statements rated E1/E2 and E0, chosen to best match Called’s own description of the work.
- **Assistant vs. doing the work:** the share of exposed tasks the study rated as largely automatable (T3 or T4) decides whether Called says AI mostly assists or could do parts of the work itself.
- **What this means for you** combines a band explanation with guidance for each career family, written by Called.
- Six careers without a single matching occupation in the study’s O*NET version use a documented blend (`ALIASES` in the script), and the page says so.

Limits, shown on every page: the ratings describe what AI language tools *could* speed up, not whether jobs will disappear; they were made with 2023-era tools; and they don’t cover robotics. To rebuild:

```bash
git clone --depth 1 https://github.com/openai/GPTs-are-GPTs /tmp/gpts
node scripts/build-ai-impact.mjs /tmp/gpts/data
npm run data:validate
```

### Attribution

- Pay and outlook data: U.S. Bureau of Labor Statistics (public domain U.S. government work).
- O*NET® is a trademark of the U.S. Department of Labor, Employment and Training Administration. Called links to O*NET OnLine and uses O*NET information as a reference under its terms; Called is not affiliated with or endorsed by USDOL/ETA.
- AI exposure data: © 2024 OpenAI, MIT license; task statements from O*NET by USDOL/ETA, used under CC BY 4.0.
- The app shows source attribution on every career page and on the About page.

Called may use official APIs, bulk downloads, feeds, and responsible web extraction when the source’s terms, robots/access controls, copyright or license, and applicable law permit it. Prefer stable official APIs or downloads when they exist. Do not bypass authentication, paywalls, CAPTCHAs, rate limits, or other technical access controls.

## Automatic updates

The app never depends on automation running; the committed data is always complete.

`.github/workflows/update-career-data.yml` runs monthly (and on demand):

1. `npm run data:update` runs [`scripts/update-career-data.mjs`](../scripts/update-career-data.mjs). It collects every SOC code from the career files and requests annual 10th percentile, median and 90th percentile wages from the BLS public API (series `OEUN0000000000000{SOC}{11|13|15}`).
2. Results are written to [`src/data/careers/overrides/wages.json`](../src/data/careers/overrides/wages.json), keyed by SOC code, with an `asOf` label. `src/data/careers/index.ts` merges these over the hand-entered figures at build time.
3. `npm run data:validate` runs the data integrity tests.
4. If anything changed, the workflow opens a pull request for a human to review. Nothing is merged automatically.

### Secrets

Keys live in **Settings → Secrets and variables → Actions → Repository secrets**, never in the code and never in a `VITE_` variable (those are baked into the public site).

| Secret | Used for | Status |
| --- | --- | --- |
| `BLS_API_KEY` | National wages (monthly) and state and metro wages (quarterly) | In use |
| `BEA_API_KEY` | Cost of living by state and metro | In use (location data) |
| `CAREERONESTOP_USER_ID`, `CAREERONESTOP_TOKEN` | Professional associations, apprenticeships, job centers | Checked monthly; ready for networking features |
| `COLLEGE_SCORECARD_API_KEY` | Public college costs by state | In use (location data) |
| `ONET_API_KEY` | O*NET Web Services (v2) | Checked monthly; ready for task and skills refreshes |

Each monthly run starts with `scripts/check-data-keys.mjs`, which reports in the run summary whether every key is present and accepted, without ever printing a key and without failing the run. To check right away, open **Actions → Update career data → Run workflow**.

For the workflow to open its pull request, enable **Settings → Actions → General → Workflow permissions → Allow GitHub Actions to create and approve pull requests**.

### Location data: cost of living, college costs, local pay

`.github/workflows/update-location-data.yml` (quarterly, or **Actions → Update location data → Run workflow**) runs [`scripts/update-location-data.mjs`](../scripts/update-location-data.mjs):

| File | Contents | Source |
| --- | --- | --- |
| `src/data/market/places.json` | Every state and ~390 metro areas: overall price level and housing price level (100 = U.S. average); for each state, median published tuition and fees at public universities (in and out of state) and community colleges, plus on-campus room and board | BEA Regional Price Parities (`BEA_API_KEY`); College Scorecard (`COLLEGE_SCORECARD_API_KEY`) |
| `src/data/market/local-wages.json` | Annual median pay for every Called occupation in every state and ~80 large metro areas, stored compactly as one array per area aligned with `socs` | BLS OEWS (`BLS_API_KEY`) |

The BLS API allows about 500 requests a day, so scheduled runs alternate (states in January and July, metros in April and October); a manual run can choose. Results are pushed to a `data/location-YYYY-MM-DD` branch (and a pull request if Actions may open one) for review. Each source is independent: a failure keeps the previous values and is reported as an annotation on the run.

How the app uses it (`src/lib/places.ts`): a person’s home place and up to three places they’d consider (Places page) resolve to a metro area or state. Pay uses the metro median, then the state median, then the U.S. median, and always says which. “What it buys” divides pay by the price level, so places compare fairly. The training cost tool prices tuition by the state of study (out-of-state when it isn’t home), adds that state’s room and board when living away, and uses pay where the person expects to work.

### Local market lookup

`src/lib/market.ts` is the single market-data abstraction. Its future lookup order is metro → state → national; the current implementation has a state slot and a national fallback. Career Detail, Financial Fit, and future cost-of-living work all consume `marketFor(career, profile)` instead of reading geography-specific fields directly.

The optional `src/data/market/state-market.json` snapshot is keyed by state abbreviation and SOC. It may contain `pay.median` and/or an `outlook` object with `growth`, `annualOpenings`, `baseYear`, and `projectionYear`. Missing state pay is never treated as zero. The UI explicitly says “U.S. median pay” or “State median pay.”

`npm run data:update:market` imports a reviewed JSON export from `STATE_MARKET_DATA_URL`, validates it, and leaves the existing snapshot untouched on failure. Configure that URL only when it points to an official/state or Projections Central export transformed to the documented shape. The workflow will use it when the repository secret `STATE_MARKET_DATA_URL` is configured. The `BLS_API_KEY` secret continues to serve the national BLS updater. `marketFor` now prefers the generated metro and state medians from `local-wages.json` before this optional snapshot.

Cost of living is intentionally not fabricated. The market model leaves room for a future BEA Regional Price Parities layer so nominal salary and local purchasing power remain separate values.

### Running it locally

```bash
BLS_API_KEY=your-key npm run data:update   # key optional
npm run data:validate
git diff src/data/careers/overrides/wages.json
```

If the API call fails, the script exits with an error and leaves the existing data untouched.

## Future automation

- **O*NET database import:** generate career skeletons (tasks, work context, interest codes, job zones) from the O*NET database download, then add Called’s plain-language content by hand. The `Career` type already maps onto O*NET concepts (interests ↔ RIASEC, education years ↔ job zones).
- **Projections:** pull the BLS Employment Projections table to refresh outlook categories.
- **CareerOneStop:** local associations, workforce centers, and training providers. Use an official API or permitted export if state wage data is added later.
- **College Scorecard:** program-level cost and earnings for the ROI tool (requires an API key stored as a secret).

Each new source should add a section here, a validation test, and a review step before data reaches `main`.
