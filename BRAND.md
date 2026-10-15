# Called brand system

This document is the source of truth for how Called looks, sounds and behaves. A designed PDF version is generated from the internal brand page with `scripts/brand-pdf.mjs`; that page runs only in local development (`npm run dev`, then `/brand`) and is not part of the public site. Design tokens live in [`src/styles/tokens.css`](src/styles/tokens.css).

---

## Mission

Help young people become wise enough to choose their direction, by collecting real evidence about who they are, what they value, what they're good at, and what work is actually like.

## Brand promise

> We are not trying to tell you what to become. We are helping you become wise enough to choose.

Called never hands down a verdict. It shows its reasoning, names its uncertainty, and always points to the next thing worth exploring.

## Positioning

Called sits in its own category, where five things meet:

| Ingredient | What Called takes from it | What Called refuses |
| --- | --- | --- |
| Career discovery | Real occupations, real pay, real training paths | A database you scroll through alone |
| Life design | Treating direction as something you prototype | Pretending there is one perfect answer |
| Purpose discovery | Gifts, service, stewardship, calling | Equating purpose with a job title |
| Self-understanding | Interests, values, aptitudes, work style | A personality label that ends the conversation |
| Real-world experimentation | Simulations and experiments that produce evidence | Self-report as the only signal |

**Called is not:** LinkedIn, a college admissions site, a government career database, a personality-test site, a youth ministry site, a generic AI startup, or an HR platform.

## Messaging

**Primary line:** Discover what you've been given. Explore where it can take you.

**Supporting lines** (use one at a time, never stacked):

- You don't need your whole life figured out.
- Your career is not your purpose. It can be one way you live it out.
- Don't just choose a career. Learn how to choose well.
- Purpose is discovered through reflection, wisdom, experience, and action.
- Find direction without pretending there is only one path.

### Voice

Warm, thoughtful, intelligent, encouraging, grounded, clear. Never patronizing.

| Say | Don't say |
| --- | --- |
| Here's what the evidence suggests. | You were born to be a... |
| Here's something worth exploring. | Follow your passion and everything will work out. |
| You may want to test this. | This is your perfect career. |
| Here's what you've learned so far. | God wants you to become a nurse. |
| Your direction can change as you learn more. | Your results are in! |

Rules of thumb:

- Sentence case everywhere. No all-caps labels.
- Buttons say exactly what happens: "Save career", "Start simulation", "Export my journey".
- Name uncertainty honestly: "Early signal", "Growing evidence", "Solid evidence".
- Empty states invite an action rather than describe a mood.

### Faith foundation

Called is built on Christian principles: stewardship, service, wisdom, diligence, gifts, good work, calling and purpose. Faith shows up in the philosophy and in optional reflection prompts, not in decoration.

- Scripture is always tied to a specific principle and a reflection question. Never pasted onto a page for atmosphere.
- Quotations use the King James Version (public domain), always paired with a plain-language summary.
- Career suggestions are never presented as messages from God.
- The faith lens can be turned off in settings for classrooms or users who prefer it hidden. The underlying framework still works.

---

## Logo

### Concept: the open ring

The mark is an open circle with a single dot just beyond the opening.

- The ring reads as the letter **C**, and as a whole self: gifts, values, experience.
- The **opening** is the invitation. A call is something that reaches you from outside and asks you to respond.
- The **dot** is the person, stepping through the opening into what's next.

It reads as "C." too: a complete thought, said plainly. It avoids crosses, doves, compasses, mountains, graduation caps, bulbs and upward arrows on purpose; the faith dimension lives in the meaning, not the clip-art.

### Files

| File | Use |
| --- | --- |
| `public/brand/called-mark.svg` | Primary mark on light backgrounds (Ink ring, Cobalt dot) |
| `public/brand/called-mark-reversed.svg` | On Ink, Cobalt or photography (White ring, Spark dot) |
| `public/brand/called-app-icon.svg` | App icon, favicon, social avatar (Cobalt tile, White ring, Spark dot) |
| `public/brand/called-wordmark.svg` | Mark + lowercase "called" wordmark |

### Wordmark

Lowercase **called**, set in Bricolage Grotesque Bold at −1 tracking. Lowercase keeps it conversational and unpretentious; the weight keeps it confident.

### Usage

- Clear space: at least the diameter of the dot on every side.
- Minimum size: 16px for the mark alone, 96px wide for mark + wordmark.
- Never rotate the mark. The opening always faces right, toward what's next.
- Never fill the ring, close the gap, add a cross, or put the mark inside a shield or badge.
- The dot may be Cobalt (on light) or Spark (on dark). The ring is Ink, White or Cobalt only.

---

## Color

> **Beige and beige-adjacent colors are prohibited from the Called brand system.**
>
> That includes beige, cream, tan, sand, oatmeal, ivory, parchment, taupe, warm off-white, khaki, camel, champagne, ecru, greige and muddy brown-neutrals (for example `#F5F0E6`, `#F4EFE6`, `#EEE8DC`, `#FAF5EA`). Every neutral in the system is cool by design. Any pull request that introduces a warm neutral background will be rejected.

### Core palette

| Token | Hex | Role | Contrast on white |
| --- | --- | --- | --- |
| Ink | `#121A3D` | Text, dark surfaces | 16.9 : 1 |
| Cobalt | `#2D3FE3` | Primary action, brand, "self" dimensions | 7.2 : 1 |
| Lagoon | `#037F78` | Evidence, growth, completion, "life" dimensions | 4.9 : 1 |
| Iris | `#6B3FD4` | Purpose, reflection, faith lens, "purpose" dimensions | 6.4 : 1 |
| Spark | `#FFCB2E` | Highlight only, always with Ink text (11.2 : 1) | n/a |
| Alert | `#B3261E` | Conflicts, destructive actions | 6.5 : 1 |

### Cool neutrals

| Token | Hex | Role |
| --- | --- | --- |
| White | `#FFFFFF` | Page background. True white, never off-white. |
| Mist | `#F3F5FB` | Subtle sections, sunken panels |
| Cloud | `#E8ECF6` | Tracks, inactive bars |
| Line | `#D6DCEC` | Borders and dividers |
| Steel | `#6E7896` | Decorative or large text only (4.4 : 1) |
| Slate | `#4A5470` | Secondary text (7.5 : 1) |

### How color carries meaning

The Purpose Compass groups its eleven dimensions into three families, and each family has one color everywhere it appears (compass petals, match bars, badges, filters):

- **Self** (Cobalt): Interests, Skills, Aptitudes, Work style
- **Life** (Lagoon): Values, Lifestyle, Experience, Feedback
- **Purpose** (Iris): Gifts, Service, Problems

Color never carries meaning alone. Every colored bar has a numeric value and a text label; every status has an icon or word.

### Dark mode

Called offers Auto (follows the device), Light and Dark, switchable from the header on every page. Dark surfaces are deep indigo (`#0C1230`, `#161E47`), never neutral grey-black. Accent colors lighten to keep at least 7 : 1 contrast for text.

---

## Typography

| Role | Typeface | Why |
| --- | --- | --- |
| Display, headings, numbers | **Bricolage Grotesque** (variable) | A contemporary grotesque with a little irregularity. Confident and human without being corporate or childish. |
| Body, interface, forms | **Atkinson Hyperlegible** | Designed by the Braille Institute for legibility. Distinct letterforms help younger readers and readers with low vision. |

Both are self-hosted through Fontsource, so no font request ever leaves the user's browser for a third party.

### Scale (major third, 1.25, on a 17px body)

| Token | Size | Use |
| --- | --- | --- |
| `--fs-hero` | 40 to 76px fluid | Home headline only |
| `--fs-3xl` | 36 to 42px | Page titles |
| `--fs-2xl` | 33px | Section titles |
| `--fs-xl` | 26px | Card titles, large numbers |
| `--fs-lg` | 21px | Lead paragraphs |
| `--fs-md` | 17px | Body |
| `--fs-sm` | 15px | Secondary text |
| `--fs-xs` | 13px | Fine print, chart axes |

Body line-height is 1.6 and line length is held under 66 characters. Headings use tight line-height (1.05 to 1.25) and slight negative tracking.

---

## Layout and spacing

- 4px base unit: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Content is left-aligned. Center alignment is reserved for empty states and single-action moments.
- Pages max out at 1180px; reading columns at 66ch.
- Mobile first. On small screens, primary navigation moves to a bottom tab bar with 5 destinations and 48px touch targets.

### Radius by hierarchy

| Token | Size | Use |
| --- | --- | --- |
| `--r-sm` | 8px | Inputs, small controls, table cells |
| `--r-md` | 12px | Cards |
| `--r-lg` | 20px | Panels, sheets, the compass frame |
| `--r-xl` | 28px | Hero and feature surfaces |
| `--r-pill` | 999px | Buttons, chips, tags |

Elevation is mostly borders. Shadows are tinted with Ink and appear only on floating things (menus, sheets, the active simulation card).

---

## Components

All components are rendered in the brand guide PDF.

- **Buttons:** pill-shaped. Primary (Cobalt fill), secondary (outline), quiet (text). Minimum 44px tall. Labels are verbs.
- **Cards:** 12px radius, 1px Line border, no default shadow. Career cards carry a **fit strip**: a thin segmented bar showing the eight match dimensions, so the score is never a single opaque number.
- **Chips:** pills for filters, tags and multi-select answers. Selected chips fill with the tint of their dimension family and show a check mark.
- **Progress:** countable and honest ("3 of 6 assessments"). Every number maps to something the user actually did.
- **Game layer:** levels (Curious, Explorer, Seeker, Pathfinder, Builder, Steward, Called), 20 badges, three weekly quests and a short celebration when something is earned. Points come only from evidence (finishing a simulation, interviewing a professional, reflecting), never from clicks, and repetitive actions are capped. Streaks are weekly, so missing a day never punishes anyone. Medals use the Self, Life and Purpose family colors; unearned medals are dashed outlines, like unexplored compass petals.
- **Evidence badges:** Early signal, Growing evidence, Solid evidence. Shown wherever a score appears.
- **Assessment interface:** one question per view on mobile, generous targets, explicit "I'm not sure" options, progress shown as "Question 4 of 12".
- **Reflection interface:** Iris-tinted panel, serif-free, unhurried. Prompts are questions, never instructions.
- **Comparison interface:** columns per career, rows per attribute, with bars and words, and the largest difference in each row called out.
- **Purpose Compass:** an eleven-petal bloom. Petal length is strength; petal opacity is how much evidence backs it. It fills in as you use Called.

## Iconography

Simple 24px line icons drawn on a 2px stroke with round caps and joins, matching the logo's ring. Icons are inline SVG with no icon font and no third-party icon CDN. They always accompany a text label in navigation.

## Illustration style

Geometric and abstract, built from the same parts as the logo: rings, arcs, dots and paths. No stock photography of smiling students, no cartoon mascots, no religious clip-art. The Purpose Compass bloom is the brand's signature illustration.

## Data visualization

- Bars over pies. Horizontal bars for comparisons; the bar is always labeled with its value.
- Dimension colors follow the Self / Life / Purpose families.
- Uncertainty is visible: missing evidence is drawn as an empty, dashed track rather than a zero.
- Money is shown as ranges, not false-precision points.

## Motion

Motion makes Called feel alive and always answers what people do. It is quick, eased (`cubic-bezier(0.2, 0.8, 0.2, 1)`) and never blocks reading.

| Moment | Behavior |
| --- | --- |
| Page arrival | Each page rises 10px and fades in over 420ms |
| Scroll reveals | Sections and cards lift into view once, staggered by about 70ms |
| Hero | The headline arrives word by word; the compass bloom unfolds, then slowly breathes |
| Feedback | Selections pop, correct answers glow, wrong answers shake slightly, cards lift on hover |
| Data | Match bars grow from zero, fit strips rise, numbers count up, level rings fill |
| Celebration | A burst of rings in the three family colors, then a card the user dismisses |

Durations: 140ms (fast), 260ms (medium), 700ms (slow). `prefers-reduced-motion` turns all of it off.

## Accessibility

- WCAG 2.2 AA minimum; body text targets AAA (7 : 1).
- Visible focus ring on every interactive element (Cobalt ring on light, Spark ring on dark).
- 44px minimum touch targets, 48px in the mobile tab bar.
- Semantic landmarks, labeled controls, and live regions for step changes.
- Meaning never relies on color alone.

## Design principles

1. **Evidence over verdicts.** Show the reasoning, the inputs and the uncertainty.
2. **Rewarding, never manipulative.** Exploring should feel fun for a 14-year-old, but rewards only follow real evidence, and nothing is designed to be addictive.
3. **Mature enough for 22, clear enough for 14.** Plain words, real data, no cartoons.
4. **Faith in the foundation, not the decoration.**
5. **The next step is always visible.** Every screen ends with something worth exploring.

## Prohibited styles

- Beige and every beige-adjacent color listed above.
- Muddy brown-neutral palettes.
- Church-website tropes: stained glass, script fonts, sunbeams, doves, crosses as decoration.
- Personality-test tropes: four-letter types, animal avatars, "your results are in".
- Manipulative game tropes: daily streaks that punish a missed day, loot boxes, leaderboards against other users, points for clicks.
- Generic SaaS tropes: gradient blobs, glassmorphism, stock 3D illustrations.
