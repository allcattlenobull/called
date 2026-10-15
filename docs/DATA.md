# Career data: sources, updates and attribution

## What’s in the dataset

Careers live in typed TypeScript modules, one per family, under [`src/data/careers/`](../src/data/careers/). Each career includes its SOC code, pay (median, ~10th and ~90th percentile), outlook category, education and routes, working conditions, interest, skill, aptitude, value, gift, service and problem tags, plain-language responsibilities, a day in the life, a reality check, related careers and alternative routes.

Version 1 contains 56 careers across 15 families and every training level.

## Sources

| Field | Source | Notes |
| --- | --- | --- |
| Pay | U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics (OEWS), via the Occupational Outlook Handbook | National, May 2024, rounded, entered by hand for V1 |
| Outlook | BLS Employment Projections, 2023 to 2033 | Categories: declining, little change, average, faster, much faster |
| SOC codes | 2018 Standard Occupational Classification | Used to link to O*NET and BLS |
| Tasks, conditions, reality checks | Written by Called, informed by O*NET OnLine task and work-context data | Rewritten in plain language for teenagers |
| Tuition assumptions | College Board, *Trends in College Pricing* | Published tuition and fees before aid |

“Small business owner” has no SOC wage series; its pay is a labeled rough estimate.

### Attribution

- Pay and outlook data: U.S. Bureau of Labor Statistics (public domain U.S. government work).
- O*NET® is a trademark of the U.S. Department of Labor, Employment and Training Administration. Called links to O*NET OnLine and uses O*NET information as a reference under its terms; Called is not affiliated with or endorsed by USDOL/ETA.
- The app shows source attribution on every career page and on the About page.

Called does not scrape websites. Any future data ingestion must use official downloads or APIs within their terms of use.

## Automatic updates

The app never depends on automation running; the committed data is always complete.

`.github/workflows/update-career-data.yml` runs monthly (and on demand):

1. `npm run data:update` runs [`scripts/update-career-data.mjs`](../scripts/update-career-data.mjs). It collects every SOC code from the career files and requests annual 10th percentile, median and 90th percentile wages from the BLS public API (series `OEUN0000000000000{SOC}{11|13|15}`).
2. Results are written to [`src/data/careers/overrides/wages.json`](../src/data/careers/overrides/wages.json), keyed by SOC code, with an `asOf` label. `src/data/careers/index.ts` merges these over the hand-entered figures at build time.
3. `npm run data:validate` runs the data integrity tests.
4. If anything changed, the workflow opens a pull request for a human to review. Nothing is merged automatically.

### Secrets

The BLS API works without a key at lower request limits. To raise them, register at <https://data.bls.gov/registrationEngine/> and add the key as a repository secret named `BLS_API_KEY` (**Settings → Secrets and variables → Actions**). Never commit keys to the repository.

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
- **CareerOneStop:** state-level wages and training providers (requires an API token stored as a secret).
- **College Scorecard:** program-level cost and earnings for the ROI tool (requires an API key stored as a secret).

Each new source should add a section here, a validation test, and a review step before data reaches `main`.
