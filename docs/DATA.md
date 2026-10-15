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

“Small business owner” has no SOC wage series; its pay is a labeled rough estimate.

### Attribution

- Pay and outlook data: U.S. Bureau of Labor Statistics (public domain U.S. government work).
- O*NET® is a trademark of the U.S. Department of Labor, Employment and Training Administration. Called links to O*NET OnLine and uses O*NET information as a reference under its terms; Called is not affiliated with or endorsed by USDOL/ETA.
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

The BLS API works without a key at lower request limits. This repository uses a key stored as the repository secret `BLS_GOV` (**Settings → Secrets and variables → Actions**); the workflow passes it to the script as `BLS_API_KEY`. Never commit keys to the repository.

For the workflow to open its pull request, enable **Settings → Actions → General → Workflow permissions → Allow GitHub Actions to create and approve pull requests**.

### Local market lookup

`src/lib/market.ts` is the single market-data abstraction. Its future lookup order is metro → state → national; the current implementation has a state slot and a national fallback. Career Detail, Financial Fit, and future cost-of-living work all consume `marketFor(career, profile)` instead of reading geography-specific fields directly.

The optional `src/data/market/state-market.json` snapshot is keyed by state abbreviation and SOC. It may contain `pay.median` and/or an `outlook` object with `growth`, `annualOpenings`, `baseYear`, and `projectionYear`. Missing state pay is never treated as zero. The UI explicitly says “U.S. median pay” or “State median pay.”

`npm run data:update:market` imports a reviewed JSON export from `STATE_MARKET_DATA_URL`, validates it, and leaves the existing snapshot untouched on failure. Configure that URL only when it points to an official/state or Projections Central export transformed to the documented shape. The workflow will use it when the repository secret `STATE_MARKET_DATA_URL` is configured. The existing `BLS_GOV` secret continues to serve the national BLS updater.

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
