# How Called scores careers

Source: [`src/lib/matching.ts`](../src/lib/matching.ts), [`src/lib/signals.ts`](../src/lib/signals.ts). Tests: [`tests/matching.test.ts`](../tests/matching.test.ts).

The engine is a transparent set of rules written by people. It is **not** a validated psychological instrument, and it does not predict anyone’s future. It organizes the evidence a user has given so they can think clearly, and the interface says so wherever a score appears.

## Inputs

| Input | Collected in |
| --- | --- |
| Interests (6 families, 30 items) | Discover › Interests |
| Skills (14, self-rated 0 to 3) | Discover › Skills |
| Aptitudes (5 kinds, 3 puzzles each) | Discover › Aptitudes |
| Work style (6 axes, −2 to +2) | Discover › Work style |
| Values (14, in four tiers) | Discover › Values |
| Lifestyle (11 priorities) | Discover › Lifestyle |
| Gifts, service, problems | Purpose |
| Feedback from others | Purpose › What others see in me |
| Experiences | Purpose › My experiences |
| Simulation reflections | Try It |
| Purpose experiment results | Try It › Purpose experiments |
| Reality-check answers, career statuses | Career pages |

## Signals

Raw answers become normalized signals in `signals.ts`:

- **Interests:** for each family, `(sum of answers + n) / 2n`, where answers are −1, 0 or 1. Then nudged by evidence: an experience rated 4 or 5 adds 0.06 to its interest families (2 or below subtracts 0.06); an enjoyed simulation aspect adds 0.05 (frustrating subtracts 0.05); a completed experiment averaging 4+ adds 0.07.
- **Skills:** level ÷ 3. Simulation response keys do not create a skill score; simulations contribute reflection and interest evidence until a scored version is validated.
- **Aptitudes:** correct ÷ total for each kind.
- **Values:** tier weights: essential 3, important 2, somewhat 1, not a priority 0.
- **Gifts:** the user’s chosen gifts plus gifts named in feedback (1 per mention) and gifts linked to well-rated experiments (0.5).

## The eight components

Each component returns a score from 0 to 100, or **null** when there’s no evidence. Null components are drawn as dashed tracks and excluded from the overall score.

| Component | Weight | Rule |
| --- | --- | --- |
| Interest | 1.5 | Weighted by the career’s interest weights (0 to 3). Each interest contributes `0.6 × absolute + 0.4 × relative`, where relative rewards interests that stand out against the user’s own average. |
| Skills | 0.75 | Mean of the user’s level for the career’s key skills (unrated skills count as 0.2). Lower weight because skills are learnable. |
| Aptitude | 0.75 | `25 + 75 × mean accuracy` across the career’s aptitudes the user has tried. Lower weight because the sample is small. |
| Values | 1.25 | For each value the user weighted, credit 1 if the career supports it, 0.5 if neutral, 0 if it strains it; weighted average. |
| Lifestyle | 1.0 | Average of lookup-table fits for schedule, remote, physical demands, travel, stress vs. balance, business ownership, income stability and location, plus work-style axis similarity `1 − |user − career| / 4`. |
| Purpose | 1.25 | Average of available parts: gift overlap, service overlap, problem overlap. Each part is `0.15 + 0.85 × min(1, overlap ÷ 2)` (problems ÷ 1.5). |
| Education fit | 1.0 | 1 if typical years ≤ what the user will do; otherwise −0.18 per extra year (floor 0.1). Paid apprenticeships get a floor of 0.7. |
| Financial fit | 1.0 | Income: 1 if the market median ≥ target, else `(median ÷ target)²`. The market layer uses a reviewed state median when available and otherwise the national median, without penalizing missing state data. Debt: 1 if estimated tuition ≤ the user’s comfort limit, else `limit ÷ cost` (floor 0.1). |

Income targets: modest $40k, comfortable $60k, high $90k, very high $130k. Debt limits: avoid $5k, small $20k, moderate $50k, comfortable $150k. Tuition estimates use the starting assumptions in `src/data/education/routes.ts`.

## Overall score

```
overall = Σ(weight × score) ÷ Σ(weight)   over components that have a score
        + experience adjustment            (clamped to −30 … +20)
```

### Experience adjustment

| Signal | Effect |
| --- | --- |
| Reality check | Definitely +8, Maybe +3, Unsure 0, Probably not −12 |
| Career status | Strong interest +8, Exploring +4, Curious +2, Not for me −25 |
| Simulation | `(enjoyment − 3) × 4`, plus +4 if “would do regularly” is yes or −6 if no. Full weight for the career’s own simulation, half for related careers listed on the simulation |
| Purpose experiment | `(average answer − 3) × 3` for careers that list the experiment |

## Confidence labels

| Label | Rule |
| --- | --- |
| Early signal | Fewer than 3 components have evidence |
| Growing evidence | 3 to 5 components |
| Solid evidence | 6 or more components **and** at least one experience signal |

## Reasons and conflicts

Each component adds plain-language reasons when something lines up (“It tends to support helping people and stability, which you ranked highly”). Conflicts are raised when:

- an essential or important value is one the career strains;
- a lifestyle or work-style fit is very low (for example, wanting regular hours for a shift-based career);
- training runs two or more years beyond what the user will do (unless paid);
- pay is well below the income goal and even the top earners don’t reach it;
- estimated tuition is more than twice the user’s debt comfort;
- the user said *Probably not*, marked *Not for me*, or disliked a related simulation.

The explanation sentence lists up to five drivers: the career’s strongest interests the user also scored highly, values it supports that the user weighted, matching service and gifts.

## Known limitations

- Career attributes (interest weights, work style, values supported) are editorial judgments informed by O*NET, not measured data.
- Fifteen aptitude puzzles are a small sample.
- Self-report is noisy, which is why experience is weighted in over time.
- Pay is national and rounded; location matters a lot.

Changes to weights or rules should update this document and the tests in the same pull request.
