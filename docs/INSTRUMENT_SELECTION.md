# Validated instrument selection

## Decision

Called should replace its custom aptitude score with an established instrument rather than present a new set of puzzles as validated. The current custom puzzles remain practice prompts and do not influence career ranking.

The leading open candidate is the Open Matrices Item Bank (OMIB). It is a published figural-matrix item bank with item-response modeling, reliability analysis, and a stated GPLv3 license. It is a measure of figural or fluid reasoning—not a career-fit test. A production integration must preserve the published item materials, response format, answer key, administration instructions, attribution, and license. It must not convert a raw reasoning result into a job recommendation without a separate occupational-outcome rationale.

The International Cognitive Ability Resource (ICAR) is a strong second candidate. It has a public-domain origin and several validation studies, including a mobile/web implementation study. The exact ICAR-16 form, registration path, scoring materials, and production distribution rights still need confirmation before Called ships the items.

## Candidate review

| Instrument | What it measures | Evidence | Production decision |
| --- | --- | --- | --- |
| [Open Matrices Item Bank](https://doi.org/10.3390/jintelligence10030041) | Figural matrices / fluid reasoning | 220 items, IRT and reliability analysis in 2,561 medical-school applicants; the paper reports no predictive or occupational criterion validity yet | Best open candidate for a controlled pilot; not yet a career-ranking input |
| [ICAR](https://doi.org/10.1016/j.intell.2014.01.004) | General cognitive ability, fluid reasoning, and visual-spatial ability | Initial validation plus later reliability, test-retest, convergent-validity, and mobile/web studies | Confirm exact form, registration, scoring, and rights before integration |
| [O*NET Ability Profiler archive](https://www.onetcenter.org/reports/AP_Archive.html) | Career-exploration abilities, including verbal, numerical, spatial, and psychomotor ability | Official career-exploration battery with administration and scoring materials | Retired; official archive says research use only and no technical support; do not embed as a new web quiz |
| [MaRs-IB](https://doi.org/10.1098/rsos.190232) | Non-verbal reasoning | Reliability and later IRT evidence; authors caution that it is not yet a normative intelligence measure | Academic/non-commercial reuse terms make it unsuitable for the production site |
| [O*NET Interest Profiler](https://www.onetcenter.org/IP.html) | RIASEC vocational interests | Official reliability/validity documentation, web widget, API, and licensing path | Strong adjacent replacement for custom interest prompts; it is not an aptitude test |

## What “apply the test” means

Using a validated test requires more than copying the question text. Called must preserve:

- the exact released items and answer key;
- the tested response format and instructions;
- the intended timing or no-time-limit rule;
- the population and interpretation limits;
- the published scoring method and uncertainty;
- attribution, license, and modification notices; and
- a clear statement that the result measures the named construct, not destiny or occupational fit.

For OMIB specifically, the validation study used 28 figural-matrix tasks without a time limit. Responses were built from 20 construction elements and scored against the published item solution. A shorter or differently timed Called version would be a new form and would need its own validation evidence before being described as the validated OMIB.

## Score contract before activation

Before a replacement score can affect matching, Called needs a written score contract:

1. Name the instrument and exact version.
2. Name the construct the score represents.
3. State the population for which evidence exists.
4. State the raw and standardized scoring rules.
5. State what the score is allowed to influence.
6. State what it cannot predict.
7. Publish reliability, uncertainty, fairness, and missing-data behavior.
8. Keep career-fit ranking separate unless the same instrument has evidence for that outcome or the model is explicitly framed as a transparent exploration heuristic.

Until that contract is approved, the score can be shown as a research-backed reasoning result or used to invite a real-world experiment. It should not silently re-enter the existing five-domain aptitude matcher, because those career fields currently expect numerical, verbal, logical, detail, and spatial subscores that OMIB and ICAR do not establish in the same way.

## Current site pilot

The site now includes a ten-item OMIB pilot at `/discover/validated-aptitude`. It uses the released OMIB item codes, solution strings, and construction-element response format. It is intentionally labeled a pilot rather than the published 28-item OMIB form: a short local form has not been normed or validated by the OMIB authors. The result is stored locally as an additional reasoning result and is available for testing alongside the open career journey; it does not replace the existing career evidence or silently change career weights.

The pilot records only the number of exact solution matches and a completion timestamp. It does not upload responses or claim an IQ, percentile, occupation fit, or hiring prediction.
