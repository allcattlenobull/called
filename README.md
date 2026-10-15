# Called

**Discover what you’ve been given. Explore where it can take you.**

Called is a free, private career-discovery and purpose platform for anyone working out what to do next: students choosing a first direction, people rethinking a major, and adults changing careers. It helps people understand who they are, what they’re good at, what they value, what work is really like, and what to try next, without pretending there is only one right path.

> We are not trying to tell people what they should become. We are helping them become wise enough to choose.

Live site: `https://allcattlenobull.github.io/called/`

---

## Contents

- [Mission and philosophy](#mission-and-philosophy)
- [What’s in version 1](#whats-in-version-1)
- [Tech stack and architecture](#tech-stack-and-architecture)
- [Local development](#local-development)
- [Deployment to GitHub Pages](#deployment-to-github-pages)
- [Data sources](#data-sources)
- [Privacy model](#privacy-model)
- [Recommendation methodology](#recommendation-methodology)
- [Research and trust audit](docs/RESEARCH.md)
- [Instrument selection and validation pilot](docs/INSTRUMENT_SELECTION.md)
- [Simulation validation protocol](docs/VALIDATION_PROTOCOL.md)
- [Usability and trust study](docs/USABILITY_STUDY.md)
- [Project structure](#project-structure)
- [Testing](#testing)
- [Future roadmap](#future-roadmap)
- [Contributing](#contributing)

Related documents: [BRAND.md](BRAND.md) (brand system; the designed PDF is generated with `scripts/brand-pdf.mjs`), [PRODUCT.md](PRODUCT.md) (product design), [docs/RECOMMENDATIONS.md](docs/RECOMMENDATIONS.md) (scoring), [docs/DATA.md](docs/DATA.md) (data and updates), [server/sync-worker/README.md](server/sync-worker/README.md) (journey sync).

---

## Mission and philosophy

Most career tools try to answer **“What should I be?”** Called is built around a better question: **“What should I explore next?”**

The journey moves through:

```
DISCOVER → PURPOSE → EXPLORE → EXPERIENCE → REFLECT → COMPARE → PLAN → ACT → REASSESS
```

Called is built on Christian principles: stewardship, service, wisdom, diligence, gifts, good work, calling and purpose. Faith shapes the philosophy and appears in optional reflection prompts; it never shows up as decoration, and Called never presents a career recommendation as a message from God. The faith lens can be turned off for classrooms.

## What’s in version 1

| Area | What it does |
| --- | --- |
| **Onboarding** | Explains that Called collects evidence rather than handing down answers. A private account is created without requiring email; the journey code is its access key. Start exploring or build a Purpose Compass. |
| **Discover** | Six exploration activities: interests, self-rated skills, unscored reasoning practice plus a separate OMIB pilot, work style, values and lifestyle. Every activity links to its evidence status and limits. |
| **Purpose Compass** | A living profile with 11 dimensions (including explicitly labeled reasoning practice), each with a strength and an evidence level, drawn as a signature “bloom”. |
| **Purpose** | Guided reflections: gifts, problems I care about, who I want to help, experiences, what others see in me, biblical principles, a private journal, and a versioned *current* purpose statement. |
| **Career Explorer** | 178 careers across 15 families and every training level (none, certificate, apprenticeship, associate, bachelor’s, master’s, doctoral). Search plus 11 filters and 5 sorts. |
| **Career pages** | Explainable match on 8 visible dimensions, reasons, potential conflicts, a reality check (“what people imagine” vs. “what the work looks like”), day-to-day, pay range, outlook, training routes, working conditions, related careers, sources. |
| **Try It** | 20 searchable and filterable career simulations across six work categories. Versioned evidence labels are public; reflections update recommendations while unvalidated response scoring stays in a consent-only shadow validation stream. |
| **Purpose experiments** | 12 real-world experiments (teach a skill, interview a professional, volunteer, fix something…) with return questions. |
| **Compare** | Up to three careers side by side across fit, money, education and work-life, with the standout in each row called out. |
| **Education ROI** | A transparent model of cost, opportunity cost, loan payments, break-even and 10-year net, with every assumption editable. Covers college, community college, certifications, trade school, apprenticeships, military, entrepreneurship and direct-to-work. |
| **My Path** | Decision support for the paths you’re testing: evidence level and checklist, why it fits, unanswered questions, the next best step and why, decision gates, leading paths, stage-aware roadmaps (Now, 6 months, 12 months) that check themselves off, and what you’ve learned about yourself. |
| **My Called report** | A shareable summary for parents and counselors. The user chooses what’s included; the journal is never included. Print, save as PDF, download, copy, or create a client-encrypted seven-day link. |
| **Individual account** | First and last name, stable public member ID, results snapshot, progress, top possibilities, account access, backups and counselor-sharing history in one place. |
| **Counselor accounts** | Counselors receive their own ID and private access key. People share named, limited reports directly to that account; reports are encrypted in the person’s browser to the counselor and exclude journey codes, journals and item-level responses. A local packet workspace remains available when the account service is not configured. |
| **How AI is changing this work** | On every career: exposure to AI (low, moderate, high) from peer-reviewed research, the real tasks AI tools could speed up and the ones that stay human, and what that means for someone considering the work. Filter and sort careers by it; compare it side by side. |
| **Achievements** | Your career evidence (self-understanding, career exposure, real-world experience, decision readiness) first; levels, 20 insight-led badges, weekly quests and evidence points underneath. |
| **Journey codes** | Every journey has a code like `CALL-7KQ2-M9XD-4HPA-R2TW`. Enter it to return to a journey on a shared device or, with the optional sync service, on any device. |
| **Resume** | Half-finished assessments and simulations are saved; the dashboard offers to pick them back up. |
| **Your data** | Export, import, switch and delete journeys. Research and analytics are separate explicit opt-ins with withdrawal/deletion controls. Includes auto/light/dark themes, plain reading mode, faith-lens and backup settings. |

Career and simulation search is typo-tolerant and synonym-aware: close spellings and common related terms are ranked by relevance instead of requiring an exact substring.

## Tech stack and architecture

- **React 19 + TypeScript + Vite 7**, static-first, deployable anywhere static files are served.
- **React Router** with lazy-loaded routes (each page is its own chunk).
- **No UI framework.** Plain CSS with design tokens (`src/styles/tokens.css`), so the brand stays distinctive and the bundle stays small.
- **Self-hosted fonts** via Fontsource (Bricolage Grotesque, Atkinson Hyperlegible). No third-party requests.
- **Local-first persistence:** IndexedDB with a localStorage fallback (`src/lib/storage.ts`), plus an optional end-to-end-encrypted backup keyed by the journey code (`src/lib/sync.ts`, `server/sync-worker/`).
- **End-to-end-encrypted counselor sharing:** the browser creates an RSA-OAEP key pair for each counselor. The public key encrypts shared reports; the private key is wrapped with the counselor’s high-entropy access key before storage.
- **No paid AI dependency.** The recommendation engine is a documented rules system. The data model is structured so AI assistance can be added later (see the roadmap).
- Runtime dependencies: `react`, `react-dom`, `react-router-dom` and two font packages. That’s all.

```
UI (pages, components)
   │ reads/writes
   ▼
Store (React context) ── debounced save ──► IndexedDB / localStorage (this device only)
   │
   ▼
Engine (pure functions in src/lib)
   signals.ts   raw answers → normalized signals
   compass.ts   11-dimension Purpose Compass
   matching.ts  8-dimension explainable career match
   roi.ts       education ROI model
   path.ts      My Path engine: evidence, next best action, gates, stage-aware roadmaps, insights
   │
   ▼
Data (typed modules in src/data, plus JSON overrides written by automation)
```

## Local development

Requires Node.js 20.19 or newer.

```bash
npm install
npm run dev          # http://localhost:5173/called/
npm test             # unit tests (Vitest)
npm run typecheck
npm run build        # production build in dist/
npm run preview      # serve the build at http://localhost:4173/called/
npm run test:e2e     # Playwright end-to-end + axe accessibility tests (run `npx playwright install chromium` once)
```

The repository includes `.npmrc` with `legacy-peer-deps=true` to avoid an npm peer-resolution bug with the current test tooling.

## Deployment to GitHub Pages

Deployment is automatic through `.github/workflows/deploy.yml` on every push to `main`.

**One-time setup:** in the repository, go to **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**. The next push to `main` (or a manual run of the *Deploy to GitHub Pages* workflow) publishes the site at `https://<username>.github.io/called/`.

How routing works on Pages: GitHub Pages has no single-page-app fallback, so `scripts/postbuild.mjs` copies `index.html` to `404.html`. A deep link like `/called/careers/electrician` loads the app, and the router renders the right page. The router’s basename comes from Vite’s `base`, so the same build logic works at a subpath or the domain root.

**Accounts and cross-device journey codes:** deploy the small Cloudflare Worker in [`server/sync-worker/`](server/sync-worker/README.md) (free tier), then add a repository variable `SYNC_URL` with its URL and re-run the deploy workflow. Without it, individual accounts and journey codes work on the same device, Export/Import moves journeys between devices, and counselors can use the local packet workspace. Connected counselor accounts and direct account-to-account sharing require the Worker.

**Custom domain:**

1. Add repository variables (**Settings → Secrets and variables → Actions → Variables**): `BASE_PATH` = `/` and `CUSTOM_DOMAIN` = `your.domain`.
2. Point DNS at GitHub Pages and set the domain under **Settings → Pages**.
3. Re-run the deploy workflow. The build writes a `CNAME` file and serves from the root.

## Data sources

| Data | Source | How it’s used |
| --- | --- | --- |
| Median pay, 10th and 90th percentiles | U.S. Bureau of Labor Statistics, OEWS / Occupational Outlook Handbook (May 2024) | Rounded, entered by hand for V1; refreshable through the BLS API |
| Job outlook | BLS Employment Projections 2023 to 2033 | Shown as categories, not exact percentages |
| Occupation codes | Standard Occupational Classification (SOC) | Each career links to O*NET OnLine and BLS |
| Tasks, reality checks, day in the life | Written by Called, informed by O*NET task and work-context data | Plain-language summaries anyone can follow |
| Tuition | College Board, *Trends in College Pricing* | Starting assumptions in the ROI tool |

Called may use official APIs, bulk downloads, feeds, and responsible public web extraction when the source’s terms, access controls, copyright or license, and applicable law permit it. It never bypasses authentication, paywalls, CAPTCHAs, rate limits, or other technical controls. O*NET is a trademark of the U.S. Department of Labor, Employment and Training Administration; Called is not affiliated with or endorsed by any agency. See [docs/DATA.md](docs/DATA.md) for the update process and attribution.

## Privacy model

Many people using Called are still in school, so privacy is a design constraint, not a feature.

- **No email identity required for individual accounts.** Each person receives a stable member ID and a separate high-entropy journey code that unlocks the account.
- **Stored on this device.** All profile data lives in the browser (IndexedDB, with localStorage as a fallback).
- **Optional encrypted backup.** If the sync worker is deployed, the journey is encrypted in the browser with a key derived from the journey code (PBKDF2 then AES-256-GCM) before upload. The server stores only ciphertext under a hash of the code and cannot read anything. Users can turn backups off; deleting data also deletes the backup.
- **No default analytics, ads or third-party scripts.** Fonts are bundled. Minimal page analytics and validation events are separate explicit opt-ins using a random research ID.
- **User control.** Export my journey, Import my journey, and Delete my data are on the *Your data* page.
- **Email is user-controlled.** Called can open an email draft for a code or readable report and can hand a backup file to the device share sheet. Called does not collect the recipient address or send email itself.
- **Reports are built in the browser.** Downloads stay local. Optional seven-day links upload only browser-encrypted report text; the decryption key stays in the URL fragment. The journal is never included.
- **Counselor sharing is explicit and limited.** A counselor sees first and last name, member ID and the limited report only after the person confirms sharing. The report is encrypted to that counselor’s public key; there is no automatic school roster or backdoor into a journey.

## Recommendation methodology

Each career can receive seven decision-support scores (0 to 100, or empty when evidence is missing): **Interest, Skills, Values, Lifestyle, Purpose, Education fit, Financial fit**. Aptitude is reserved and excluded until an exact instrument is validated for this use. The overall score is the weighted average of the components that exist, adjusted by reflection and experience, capped at +20 / −30.

Every result shows its components, the reasons it appeared, potential conflicts, and an evidence label (*Early signal*, *Growing evidence*, *Solid evidence*). The rules are written by people and are not a validated psychometric instrument; the UI says so. Full details and weights: [docs/RECOMMENDATIONS.md](docs/RECOMMENDATIONS.md).

## Project structure

```
called/
├── BRAND.md, PRODUCT.md, README.md
├── docs/                    DATA.md, RECOMMENDATIONS.md
├── public/                  favicon, manifest, brand/ logo files
├── scripts/
│   ├── postbuild.mjs        route shells, sitemap, robots, 404 + .nojekyll for GitHub Pages
│   ├── update-career-data.mjs  BLS wage refresh
│   └── brand-pdf.mjs        renders the internal brand page to a PDF
├── server/sync-worker/      optional encrypted journey sync (Cloudflare Worker)
├── src/
│   ├── App.tsx, main.tsx    routes and entry
│   ├── types.ts             every domain type
│   ├── components/          Layout, Icon, CompassBloom, Match, CareerCard, ui
│   ├── data/
│   │   ├── careers/         one file per family + index + overrides/wages.json
│   │   ├── assessments/     interest items, puzzles, work style, lifestyle
│   │   ├── simulations/     the 20 simulations
│   │   ├── purpose-experiments/
│   │   ├── scripture/       principles and passages
│   │   ├── purpose/         journal prompts, purpose sections
│   │   ├── education/       routes and ROI assumptions
│   │   └── vocab.ts         skills, values, gifts, interests and other vocabularies
│   ├── lib/                 engine: signals, compass, matching, roi, path, storage
│   ├── pages/               one folder per section
│   ├── state/store.tsx      profile store and persistence
│   └── styles/              tokens.css, base.css, components.css, pages.css
├── tests/                   Vitest unit tests + tests/e2e Playwright specs
└── .github/workflows/       deploy, ci, update-career-data
```

**Adding a career:** add a `define({...})` entry to one of the `more-*.ts` files in `src/data/careers/` (or a full object in a family file). Types enforce every field, and `npm test` checks references, pay ranges and reality-check content. Nothing else needs editing. The structure is designed to grow to hundreds or thousands of careers, including generating files from O*NET in the future.

**Adding a simulation:** add an entry to `src/data/simulations/index.ts` using the `choice`, `multi` and `text` step types, and set `simulationId` on related careers.

## Testing

- **Unit (Vitest):** data integrity, brand rules (including an automated check that no warm or beige neutral enters the palette), the matching engine, ROI math, the My Path engine (evidence, next best action, gates, stage-aware roadmaps, insights), and IndexedDB storage.
- **End-to-end (Playwright):** every route on desktop and mobile with no console errors, no serious axe accessibility violations, and no horizontal scroll; dark-mode contrast; a full journey from onboarding through an assessment, a reality check, a simulation, exploring a path with a decision gate and reflection, and the report; export, delete and import; compare and ROI; deep links.

## Future roadmap

- Generate the career catalog from the O*NET database and BLS projections, scaling to hundreds of occupations with state-level pay.
- Occupation-expert review and pre-registered validation of versioned simulations before any response score influences matching.
- Optional AI assistance, kept off the critical path: reflection prompts, purpose-statement drafting, career explanations, roadmap generation and mentor-interview preparation. The engine’s structured inputs and reasons are designed to ground such features.
- Organization-level counselor administration, invitations and verified school domains, while preserving person-controlled sharing.
- Spanish and other languages, following the translation and instrument-validation gates in `docs/LOCALIZATION.md`.
- College Scorecard integration for program-level cost and earnings.

## Contributing

Contributions are welcome.

1. Open an issue describing the change, especially for new careers, simulations or scoring changes.
2. Keep the voice: warm, grounded, never deterministic (see BRAND.md).
3. Follow the brand system. **Beige and beige-adjacent colors are prohibited**; the test suite will fail if a warm neutral is added to the tokens.
4. Run `npm run typecheck`, `npm test` and, for UI changes, `npm run test:e2e` before opening a pull request. CI runs all three.
5. For career data, cite sources in the pull request and never scrape sites in violation of their terms.
6. Never commit secrets. API keys belong in GitHub Actions secrets.

No license has been chosen yet. Until one is added, all rights are reserved by the repository owner.
