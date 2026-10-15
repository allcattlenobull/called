# Called product design

## The principle

Do not optimize Called around answering “What should I be?” Optimize it around teaching someone how to answer **“What should I explore next?”**

Every screen ends with a next step worth exploring. Every score shows its reasoning. Every conclusion is labeled with how much evidence supports it.

---

## Target users

**Primary: people choosing or changing direction.** High school students, students unsure about college, college students questioning their major, people entering the workforce, and working adults considering a career change. Our core audience is people early in their working lives, but Called never assumes an age: the language, plans and examples work for a first-time explorer and for someone with years of experience. The interface has to be clear enough for a high school student and respectful enough for a mid-career professional.

**Secondary: parents, school counselors, teachers, mentors, pastors and youth leaders.** They mostly meet Called through the *My Called report* the person chooses to share, and through the About page’s guidance on asking good questions.

Called adapts language and next steps to stage of life—high school, recently graduated, college or training, working or changing careers, or other—not to a separate age-based scoring system. Exact age appears only when a career page needs to state a legal requirement.

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
| Decide | `/path` | Paths being tested side by side: evidence level, why it fits, open questions, the next best step, decision gates, and a stage-aware roadmap (now, 6 months, 12 months) |
| Act | roadmap steps, experiments | Do real things; mark progress |
| Reassess | dashboard, retaking assessments | Recommendations shift as evidence accumulates |

Nobody has to follow this order. Onboarding offers two doors: **Build my Purpose Compass** or **Start exploring now**, and nothing requires a long questionnaire up front.

## Feature architecture

```
Profile (one object, stored locally)
├── Self-report: interests, skills, aptitudes, workStyle, values, lifestyle
├── Purpose: gifts, serves, problems, experiences, feedback, journal, statements, principleNotes
├── Experience: simulations, experiments, reality responses, career statuses
├── Local evidence: optional location context and career-specific conversations
└── Planning: saved, compare, roadmaps, counters

Engine (pure functions)
├── signals   normalize raw answers, blend in experience
├── compass   11 dimensions × (strength, evidence, summary)
├── matching  8 dimensions × (score | null, reasons) + conflicts + confidence + explanation
├── roi       cost, opportunity cost, payments, break-even
├── path      evidence, next best action, decision gates, stage-aware roadmaps, learned insights
└── next      the next three most useful actions
```

The market layer is one shared abstraction: `marketFor(career, profile)` resolves future metro data first, then reviewed state data, then national data. It returns scope and source labels so local context never masquerades as local certainty.

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

## Progress and the game layer

**The game is gathering evidence about yourself, not earning points.** Points are the motivational layer underneath and always secondary. The feeling Called reinforces is “I’m one experience closer to understanding what fits me,” never “I need 80 more points.” Exploring should feel rewarding without trivializing life direction, and never feel childish to an adult changing careers.

- **Your career evidence** is the headline: four meters built only from what the user has done.
  - *Self-understanding:* assessments, gifts, who and what you care about, what others see in you, reflections.
  - *Career exposure:* careers explored, reality checks, simulations, comparisons.
  - *Real-world experience:* interviews, real-world experiments, experiences reflected on.
  - *Decision readiness:* paths being tested, evidence on the strongest path, interest check-ins, careers ruled out, training costs checked.
  Each meter shows a plain band (Not started, Just starting, Building, Solid, Strong) and the one step that would add the most evidence.
- **Evidence points** are derived from the profile, so they always match real activity: assessments (60), simulations (80), purpose experiments (100), feedback from others (30), reflections, reality checks, roadmap steps and more. Repetitive actions are capped so points can’t be farmed. The header shows the level, not the point total.
- **Levels:** Curious, Explorer, Seeker, Pathfinder, Builder, Steward, Wayfinder. “Called” is the name of the platform, never a level, so no one is told they’ve arrived at their calling.
- **Badges:** 20, each tied to a kind of evidence and to an insight. Earning one leads with what it means (“You tested the work instead of guessing.”), then names the badge. Names avoid religiously coded language; the values underneath (faithfulness, diligence, stewardship) show up as *Follow through*, *Steady* and *Honest no*.
- **Weekly quests:** three suggestions each Monday, each labeled with the kind of evidence it builds.
- **Streaks are weekly,** so missing a day never breaks anything.
- **Celebrations** appear once per new badge or level.

The *Achievements* page shows the evidence meters first, then levels, badges and exactly where every point came from.

## Coming back

- Half-finished assessments, puzzle sets and simulations are saved as drafts. The dashboard opens with **Pick up where you left off**.
- Every journey has a **journey code**. On a shared device, several people can keep separate journeys and switch with their codes. With the optional sync service, the code restores a journey on any device; the data is encrypted with the code before upload.
- The app asks the browser for persistent storage so data isn’t evicted.
- Optional city, state, ZIP and up to three considered places stay in the same private profile. No GPS coordinates, birthdate or public networking notes are collected.

## Privacy philosophy

No one deserves a tool that harvests them, least of all people still in school. Individual accounts require no email identity: a public member ID identifies the account, while a separate high-entropy journey code unlocks it. The profile remains local-first; the user can export, import, switch and delete journeys. Optional cross-device backup is end-to-end encrypted with the journey code. Counselor reports are encrypted to the selected counselor’s public key and never include the journey code, journal or item-level answers. Reports are built locally. Analytics and validation research remain separate opt-ins.

## Future features

- O*NET-generated catalog with hundreds of careers and state-level wages
- Metro labor-market data and BEA Regional Price Parities, keeping nominal pay separate from local purchasing power
- Branching simulations and more fields
- Optional AI assistance for reflection, purpose statements, explanations, roadmaps and interview prep, grounded in the engine’s structured reasons and never required
- Counselor tools that keep the student in control of what’s shared
- Mentor matching and interview scheduling
- Translations


## My Path: decision support, not a to-do list

My Path is the payoff of everything else in Called. Its job is to answer “What should I explore next, and why?”

- **Paths I’m testing.** Users explore several careers at once. “Explore this path” is deliberately light; exploring isn’t committing.
- **Evidence, not just progress.** Each path shows an evidence level (Early, Moderate, Strong) built from a transparent checklist: interest match, values match, aptitude or skills, lifestyle fit, the reality check, the simulation, a conversation with a professional, a real-world test, and training costs. Experience counts as much as self-report.
- **Why this path fits / Still weighing.** Reasons come straight from the matching engine, plus aptitude and simulation results. Conflicts are shown, not hidden.
- **Biggest unanswered question.** The questions only real experience can answer, most important first.
- **Next best step, with why.** A fixed priority order (missing assessments → a due check-in → reality check → simulation → interview → real-world test → training costs → roadmap) so the advice is explainable without AI.
- **Leading paths.** “Make this a leading path” unlocks only once evidence is at least Moderate and includes two kinds of real experience. It can be undone.
- **Decision gates.** After three new completed steps, Called asks “After what you’ve learned, how interested are you now?” (Stronger, About the same, Less, Rule this path out). Answers update the career’s status, can retire a path (reopenable), and feed “What you’ve learned.”
- **Smarter roadmaps.** Steps depend on stage of life (high school, college, working), the career’s training route, debt tolerance, staying close to home, and how many careers are saved. Steps that Called can verify (assessments, reality check, simulation, interview, experiments, ROI, comparing) check themselves off. “Re-tailor steps to me” refreshes suggestions while keeping finished and user-written steps.
- **What you’ve learned.** Patterns that need at least two independent signals, each with its basis shown (for example, “You consistently prefer people-centered work. Seen in your interests and your work style.”).
- **Reflection.** A quiet closing question about stewardship, with an optional Biblical reflection when the faith lens is on, and a prompt that saves to the journal.

## How AI is changing this work

Called's value is helping people gather evidence they can trust, and AI is part of that evidence now. Every career page shows its exposure to AI tools (low, moderate, high) from peer-reviewed research, the actual O*NET tasks AI could speed up and the ones that stay human, whether AI mostly assists or could do parts of the work, and plain guidance on what holds up in that kind of work. It is framed as a direction, not a forecast: exposure often means the same work gets done faster, not that jobs disappear. Users can filter and sort careers by exposure and compare it side by side, and the report includes it for paths being tested. Interviews are encouraged to ask, “How has AI changed your job in the last year?”

## Navigation

One structure, shown two ways: dropdown menus on wide screens and a single sectioned menu on phones. The groups follow the journey.

| Group | Pages |
| --- | --- |
| Discover · know yourself | Where you are now, Assessments, Purpose, Journal |
| Explore · find possibilities | Careers, Places and cost of living, Training costs and payoff, Compare careers |
| Try it · test the work | Career simulations, Real-world experiments, Talk to people near you |
| My Path · decide your next step | Paths I’m testing, My Called report, Evidence and achievements, Take your evidence to an AI |
| Account (top right) | Account, Privacy and data, For counselors |

About, research, feedback and terms stay in the footer.

## Place is part of the decision

Location shapes pay, prices and where people train, and many people stay where they study. The Places page records where someone lives and up to three places they’d consider. Career pages show median pay in each place (metro, then state, then U.S., always labeled) next to the cost of living and what that pay buys. The training cost tool prices college by the state of study, adds that state’s room and board when living away, and uses pay where the person expects to work afterward.

## Where you are now: credit for what people already have

Career changers and people with some education shouldn't be treated like they're starting from zero. The **Where you are now** page records the closest Called career to their current job, their pay, years in the work, highest education finished, field of study, licenses, and skills (the same answers as the skills assessment).

- **School still needed** (`src/lib/readiness.ts`): a finished degree counts toward degree careers. In licensed or accredited fields (healthcare, engineering, science, accounting, architecture and similar) the degree must be in a matching field; otherwise Called estimates a bridge or accelerated program, and graduate programs credit any bachelor’s plus prerequisites. Apprenticeships and certificates still need their hands-on training, with a note to ask about credit for prior learning when the current job is related.
- **“No more school than I already have”** is an option in the lifestyle assessment, a filter in the Career Explorer, and a strong signal in matching.
- **Pay compared with now:** matching and career pages compare median pay where the person lives with their current pay.
- **Next moves** (`src/lib/nextMoves.ts`) ranks careers by skills that carry over (35%), school still needed (25%), personal fit (20%) and pay change (20%), plus a bonus for curated related careers. Every card says why.
- **Training costs and payoff** uses only the tuition still ahead and the person’s current pay as the earnings they’d give up.
- **Talk to people near you** opens live map searches for training programs, professional groups, colleges and American Job Centers in every place the person lives or is considering.
