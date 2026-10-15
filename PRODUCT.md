# Called product design

## The principle

Do not optimize Called around answering “What should I be?” Optimize it around teaching someone how to answer **“What should I explore next?”**

Every screen ends with a next step worth exploring. Every score shows its reasoning. Every conclusion is labeled with how much evidence supports it.

---

## Target users

**Primary: ages 14 to 24.** High school students, students unsure about college, college students questioning their major, young adults reconsidering direction or entering the workforce. The interface has to be mature enough that a 22-year-old will use it and clear enough for a 14-year-old.

**Secondary: parents, school counselors, teachers, mentors, pastors and youth leaders.** They mostly meet Called through the *My Called report* the young person chooses to share, and through the About page’s guidance on asking good questions.

## User journey

```
DISCOVER → PURPOSE → EXPLORE → EXPERIENCE → REFLECT → COMPARE → PLAN → ACT → REASSESS
```

| Stage | Where it lives | What the user does |
| --- | --- | --- |
| Discover | `/discover` | Interests, skills, aptitudes, work style, values, lifestyle |
| Purpose | `/purpose` | Gifts, service, problems, experiences, feedback, principles, journal, purpose statement |
| Explore | `/careers` | Browse, filter, read reality checks, see explainable matches |
| Experience | `/try` | Career simulations and real-world purpose experiments |
| Reflect | after every simulation and experiment; journal | Record enjoyment, energy, frustration, what felt natural |
| Compare | `/compare`, `/compare/education` | Side-by-side tradeoffs; education ROI |
| Plan | `/path` | Editable roadmap: now, 6 months, 12 months |
| Act | roadmap steps, experiments | Do real things; mark progress |
| Reassess | dashboard, retaking assessments | Recommendations shift as evidence accumulates |

Nobody has to follow this order. Onboarding offers two doors: **Build my Purpose Compass** or **Start exploring now**, and nothing requires a long questionnaire up front.

## Feature architecture

```
Profile (one object, stored locally)
├── Self-report: interests, skills, aptitudes, workStyle, values, lifestyle
├── Purpose: gifts, serves, problems, experiences, feedback, journal, statements, principleNotes
├── Experience: simulations, experiments, reality responses, career statuses
└── Planning: saved, compare, roadmaps, counters

Engine (pure functions)
├── signals   normalize raw answers, blend in experience
├── compass   11 dimensions × (strength, evidence, summary)
├── matching  8 dimensions × (score | null, reasons) + conflicts + confidence + explanation
├── roi       cost, opportunity cost, payments, break-even
├── roadmap   starter steps by career or training route
└── next      the next three most useful actions
```

Because every feature reads and writes the same profile, the product behaves as one system: finishing a simulation changes the compass, the career scores, the dashboard’s suggestions and the report.

## The Purpose Compass

Eleven dimensions in three families:

| Family | Dimensions | Question |
| --- | --- | --- |
| Self | Interests, Skills, Aptitudes, Work style | Who am I and what can I do? |
| Life | Values, Lifestyle, Experience, Feedback | What life am I building, and what has reality shown me? |
| Purpose | Gifts, Service, Problems | Where might my gifts meet real needs? |

Each dimension has a **strength** (how pronounced the signal is) and an **evidence level** (how much backs it). The compass is drawn as a bloom: petal length is strength, depth of color is evidence, and unexplored dimensions are dashed outlines that invite action. Experience and Feedback dimensions are deliberately fed by behavior and by other people, so the profile becomes more evidence-based over time.

## Recommendation methodology

Summarized here; full detail in [docs/RECOMMENDATIONS.md](docs/RECOMMENDATIONS.md).

- Eight visible component scores: Interest, Skills, Aptitude, Values, Lifestyle, Purpose, Education fit, Financial fit.
- Components without evidence are empty (dashed), never zero.
- Overall = weighted average of available components + experience adjustment.
- Every career shows a one-sentence explanation (“Financial planning appeared because you consistently prioritized…”), specific reasons, and **potential conflicts** (“You indicated that avoiding debt is very important. This path often costs…”).
- Evidence labels: Early signal, Growing evidence, Solid evidence.
- Marking a career *Not for me* drops it sharply and removes it from suggestions.

## Career reality checks

Every career pairs **What people imagine** with **What the work actually looks like**, plus common frustrations and emotional demands. Then it asks: **Does this still sound interesting?** (Definitely, Maybe, Unsure, Probably not). The answer is stored and adjusts the match.

## Career simulations

Eleven short simulations, each 7 to 8 minutes, with three step types:

- **Choice:** one decision, with feedback on how professionals tend to think about each option.
- **Multi:** pick two, then see the reasoning.
- **Text:** write a real work product (a memo, a handoff note, an explanation to a child), then compare it to what a professional would include.

There’s no grade. A quality share is recorded as a hint about what may come naturally. After every simulation the user answers: Did you enjoy this? What did you enjoy? What frustrated you? Would you want to do this regularly? What part felt natural? Enjoyed aspects feed interest and skill signals; enjoyment and “regularly” adjust related careers (full weight for the career’s own simulation, half for related ones). Then the user sees a before-and-after table of how their matches moved.

Safety: simulations never give medical diagnosis or legal advice. The healthcare simulation is explicitly about patient service and escalation; the trades simulation is about troubleshooting logic and communication, not repair instructions.

## Purpose experiments

Twelve real-world activities, each framed as a hypothesis (“You think you might enjoy teaching”), with steps, time required, safety notes where relevant, and return questions on a five-point scale. Completed experiments adjust interests, gifts and the careers that list the experiment.

## Education and money

The **Education ROI** tool models tuition, years of training, living costs, alternative earnings, borrowed share and loan rate, and reports cost, opportunity cost, monthly payment, payment as a share of starting pay, break-even years and 10-year net. It treats paid training (apprenticeships, military) differently, and it lists every route: college, community college, certification, trade school, apprenticeship, military, entrepreneurship and straight to work. It never concludes that college is good or bad.

## Progress

Countable and calm: assessments completed, careers explored, simulations, interviews, experiments, saved careers, comparisons and reflections. No streaks, levels, badges or confetti.

## Privacy philosophy

Teenagers deserve tools that don’t harvest them. V1 has no accounts and no server. Everything lives on the device; the user can export, import and delete it. Reports are built locally and the journal is never included. No analytics or third-party scripts are loaded.

## Future features

- O*NET-generated catalog with hundreds of careers and state-level wages
- Branching simulations and more fields
- Optional AI assistance for reflection, purpose statements, explanations, roadmaps and interview prep, grounded in the engine’s structured reasons and never required
- Optional encrypted sync
- Counselor tools that keep the student in control of what’s shared
- Mentor matching and interview scheduling
- Translations
