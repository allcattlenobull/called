import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CAREER_BY_ID, DATA_SOURCES, blsUrl, onetUrl } from '../../data/careers';
import { APTITUDES, EDUCATION_LEVELS, FAMILIES, GIFTS, LEVEL_WORDS, OUTLOOK, REMOTE, ROUTES, SCHEDULE, SKILLS, VALUES } from '../../data/vocab';
import { SIM_BY_ID } from '../../data/simulations';
import { EXPERIMENT_BY_ID } from '../../data/purpose-experiments';
import { useStore } from '../../state/store';
import { estimatedEducationCost, geography, matchCareer } from '../../lib/matching';
import { money, moneyK } from '../../lib/format';
import { generateRoadmap } from '../../lib/path';
import { Conflicts, EvidenceBadge, FitStrip, MatchBars, OverallScore } from '../../components/Match';
import { SaveButton } from '../../components/CareerCard';
import { Icon } from '../../components/Icon';
import { Callout, OptionGroup } from '../../components/ui';
import type { CareerStatus, RealityResponse } from '../../types';
import NotFound from '../NotFound';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

const STATUS: { value: CareerStatus; label: string }[] = [
  { value: 'curious', label: 'Curious' },
  { value: 'exploring', label: 'Exploring' },
  { value: 'strong', label: 'Strong interest' },
  { value: 'notForMe', label: 'Not for me' },
];

const REALITY: { value: RealityResponse; label: string }[] = [
  { value: 'definitely', label: 'Definitely' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'unsure', label: 'Unsure' },
  { value: 'probablyNot', label: 'Probably not' },
];

export default function CareerDetail() {
  const { id = '' } = useParams();
  const career = CAREER_BY_ID[id];
  useDocumentTitle(career?.title);
  const { profile, update } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!career) return;
    update((p) => {
      p.careerViews = [id, ...p.careerViews.filter((x) => x !== id)].slice(0, 200);
    });
    // Record a view once per visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const match = useMemo(() => (career ? matchCareer(career, profile) : null), [career, profile]);
  if (!career || !match) return <NotFound />;

  const status = profile.careerStatus[id];
  const inCompare = profile.compare.includes(id);
  const sim = career.simulationId ? SIM_BY_ID[career.simulationId] : undefined;
  const simDone = sim && profile.simulations.find((s) => s.simulationId === sim.id);
  const reasons = [...Object.values(match.dimensions).flatMap((d) => d.reasons), ...match.experience.reasons];
  const cost = estimatedEducationCost(career);
  const range = { min: 20000, max: 240000 };
  const pos = (n: number) => `${Math.max(0, Math.min(100, ((n - range.min) / (range.max - range.min)) * 100))}%`;
  const roadmap = profile.roadmaps.find((r) => r.careerId === id);

  return (
    <div className="wrap career">
      <header className="career__head">
        <Link to="/careers" className="backlink">
          <Icon name="arrowLeft" size={18} />
          All careers
        </Link>
        <span className="ccard__family">{FAMILIES[career.family]}</span>
        <h1>{career.title}</h1>
        <p className="lead">{career.summary}</p>
        <div className="row career__actions">
          <SaveButton careerId={id} />
          <button
            type="button"
            className={`btn btn--secondary${inCompare ? ' is-on' : ''}`}
            aria-pressed={inCompare}
            onClick={() =>
              update((p) => {
                p.compare = inCompare ? p.compare.filter((x) => x !== id) : [...p.compare.filter((x) => x !== id), id].slice(-3);
              })
            }
          >
            <Icon name={inCompare ? 'check' : 'compare'} size={18} />
            {inCompare ? 'In comparison' : 'Add to comparison'}
          </button>
          {inCompare && profile.compare.length > 1 && (
            <Link to="/compare" className="btn btn--quiet">
              Compare now
            </Link>
          )}
        </div>
        <div className="status-row" role="group" aria-label="How do you feel about this career?">
          <span className="small muted">Mark as:</span>
          <div className="segmented">
            {STATUS.map((s) => (
              <button
                key={s.value}
                type="button"
                aria-pressed={status === s.value}
                onClick={() =>
                  update((p) => {
                    if (p.careerStatus[id] === s.value) delete p.careerStatus[id];
                    else p.careerStatus[id] = s.value;
                  })
                }
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="split career__body">
        <div className="stack-lg">
          <section aria-labelledby="fit-h" className="card fit-card">
            <div className="row row--between">
              <h2 id="fit-h" className="h3" style={{ margin: 0 }}>
                How it fits you
              </h2>
              <EvidenceBadge confidence={match.confidence} />
            </div>
            {match.overall === null ? (
              <p className="muted" style={{ marginTop: 'var(--s-3)' }}>
                Not enough evidence yet. <Link to="/discover">Complete an assessment</Link> and each dimension below will fill in.
              </p>
            ) : (
              <div className="fit-card__score">
                <OverallScore match={match} />
                <FitStrip match={match} />
              </div>
            )}
            {match.explanation && <p className="fit-card__why">{match.explanation}</p>}
            <MatchBars match={match} />
            {match.experience.adjustment !== 0 && (
              <p className="small muted" style={{ marginTop: 'var(--s-3)' }}>
                Your experience with this kind of work moved the overall score {match.experience.adjustment > 0 ? 'up' : 'down'} by {Math.abs(match.experience.adjustment)}.
              </p>
            )}
            {reasons.length > 0 && (
              <>
                <h3 className="h4" style={{ marginTop: 'var(--s-5)' }}>
                  Why it appeared
                </h3>
                <ul className="reasons">
                  {reasons.map((r) => (
                    <li key={r}>
                      <Icon name="check" size={16} />
                      {r}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {match.conflicts.length > 0 && (
              <>
                <h3 className="h4" style={{ marginTop: 'var(--s-5)' }}>
                  Potential conflicts
                </h3>
                <Conflicts match={match} />
              </>
            )}
            <p className="small muted" style={{ marginTop: 'var(--s-4)', marginBottom: 0 }}>
              Scores organize your evidence; they don’t predict your future. <Link to="/about#how-matching-works">How matching works</Link>
            </p>
          </section>

          <section aria-labelledby="reality-h">
            <h2 id="reality-h">Reality check</h2>
            <div className="reality">
              <div className="reality__col reality__col--imagine">
                <h3>What people imagine</h3>
                <ul>
                  {career.imagine.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div className="reality__col reality__col--actual">
                <h3>What the work actually looks like</h3>
                <ul>
                  {career.reality.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <h4 className="small" style={{ fontFamily: 'var(--font-body)', marginTop: 'var(--s-4)' }}>
                  Common frustrations
                </h4>
                <p className="small">{career.frustrations.join('. ')}.</p>
                <h4 className="small" style={{ fontFamily: 'var(--font-body)' }}>
                  Emotional demands
                </h4>
                <p className="small" style={{ marginBottom: 0 }}>
                  {career.emotionalDemands}
                </p>
              </div>
            </div>
            <div className="reality-q">
              <OptionGroup
                legend="Does this still sound interesting?"
                layout="row"
                value={profile.reality[id]}
                onChange={(v) =>
                  update((p) => {
                    p.reality[id] = v;
                  })
                }
                options={REALITY}
              />
              {profile.reality[id] && (
                <p className="small muted" role="status" style={{ marginTop: 'var(--s-2)' }}>
                  Saved to your Purpose Compass. {profile.reality[id] === 'probablyNot' ? 'Ruling things out is useful evidence too.' : 'Your recommendations will take this into account.'}
                </p>
              )}
            </div>
          </section>

          <section aria-labelledby="day-h">
            <h2 id="day-h">The day-to-day</h2>
            <div className="grid grid--2">
              <div className="card">
                <h3>Typical responsibilities</h3>
                <ul>
                  {career.responsibilities.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div className="card">
                <h3>A real day</h3>
                <ul>
                  {career.dayInLife.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section aria-labelledby="pay-h">
            <h2 id="pay-h">Pay and outlook</h2>
            <div className="card">
              <div className="pay-head">
                <div>
                  <span className="stat__value">{money(career.pay.median)}</span>
                  <span className="stat__label">Median yearly pay in the U.S.</span>
                </div>
                <div>
                  <span className="pay-outlook">{OUTLOOK[career.outlook].label}</span>
                  <span className="stat__label">Projected job growth</span>
                </div>
              </div>
              <div className="range" aria-label={`Most workers earn between ${money(career.pay.low)} and ${money(career.pay.high)}`} role="img">
                <span className="range__track" />
                <span className="range__band" style={{ left: pos(career.pay.low), width: `calc(${pos(career.pay.high)} - ${pos(career.pay.low)})` }} />
                <span className="range__median" style={{ left: pos(career.pay.median) }} />
              </div>
              <div className="range__labels">
                <span>Lower 10%: {moneyK(career.pay.low)}</span>
                <span>Top 10%: {moneyK(career.pay.high)}+</span>
              </div>
              {career.pay.note && <p className="small" style={{ marginTop: 'var(--s-3)' }}>{career.pay.note}</p>}
              <p className="small muted" style={{ marginTop: 'var(--s-3)', marginBottom: 0 }}>
                Pay varies a lot by location, experience and employer. Figures are rounded from {DATA_SOURCES.wages}, {DATA_SOURCES.wagesAsOf}.
              </p>
            </div>
          </section>

          <section aria-labelledby="edu-h">
            <h2 id="edu-h">Education and training</h2>
            <div className="card stack">
              <dl className="dl">
                <div>
                  <dt>Typical entry level</dt>
                  <dd>{EDUCATION_LEVELS[career.education.level].label}</dd>
                </div>
                <div>
                  <dt>Time after high school</dt>
                  <dd>{career.education.years === 0 ? 'You can start right away' : `About ${career.education.years} year${career.education.years === 1 ? '' : 's'}`}</dd>
                </div>
                <div>
                  <dt>Routes in</dt>
                  <dd>{career.education.routes.map((r) => ROUTES[r]).join(', ')}</dd>
                </div>
                <div>
                  <dt>Estimated tuition</dt>
                  <dd>{cost === 0 ? 'Little or none' : `Around ${money(cost)} before aid`}</dd>
                </div>
                {career.education.majors && (
                  <div>
                    <dt>Related majors</dt>
                    <dd>{career.education.majors.join(', ')}</dd>
                  </div>
                )}
                {career.education.credentials && (
                  <div>
                    <dt>Licenses and certifications</dt>
                    <dd>{career.education.credentials.join(', ')}</dd>
                  </div>
                )}
              </dl>
              <p>{career.education.summary}</p>
              <div>
                <h3 className="h4">Other routes in</h3>
                <ul>
                  {career.alternativeRoutes.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <Link to={`/compare/education?career=${id}`} className="btn btn--secondary">
                Check the education ROI
              </Link>
            </div>
          </section>
        </div>

        <aside className="stack-lg sticky">
          <section className="card" aria-labelledby="try-h">
            <h2 id="try-h" className="h3">
              Test it
            </h2>
            {sim ? (
              <Link to={`/try/${sim.id}`} className="try-mini">
                <span className="tag tag--primary">{simDone ? `Completed, enjoyed ${simDone.enjoyment}/5` : `${sim.minutes}-minute simulation`}</span>
                <strong>{sim.title}</strong>
                <span className="small muted">{sim.hook}</span>
              </Link>
            ) : (
              <p className="small muted">No simulation for this career yet. Try a purpose experiment instead.</p>
            )}
            {career.experimentIds?.map((eid) => {
              const e = EXPERIMENT_BY_ID[eid];
              return e ? (
                <Link key={eid} to={`/try/experiments/${eid}`} className="try-mini">
                  <span className="tag tag--purpose">Purpose experiment</span>
                  <strong>{e.title}</strong>
                </Link>
              ) : null;
            })}
          </section>

          <section className="card" aria-labelledby="cond-h">
            <h2 id="cond-h" className="h3">
              Working conditions
            </h2>
            <dl className="dl">
              <div>
                <dt>Where</dt>
                <dd>{career.environment}</dd>
              </div>
              <div>
                <dt>Schedule</dt>
                <dd>{SCHEDULE[career.schedule]}</dd>
              </div>
              <div>
                <dt>Remote</dt>
                <dd>{REMOTE[career.remote]}</dd>
              </div>
              <div>
                <dt>Physical demands</dt>
                <dd>{LEVEL_WORDS[career.physical]}</dd>
              </div>
              <div>
                <dt>Travel</dt>
                <dd>{LEVEL_WORDS[career.travel]}</dd>
              </div>
              <div>
                <dt>Stress</dt>
                <dd>{LEVEL_WORDS[career.stress]}</dd>
              </div>
              <div>
                <dt>Mostly works with</dt>
                <dd>{career.peopleData >= 1 ? 'People' : career.peopleData <= -1 ? 'Data, things or ideas' : 'A mix of people and information'}</dd>
              </div>
              <div>
                <dt>Where the jobs are</dt>
                <dd>{geography(career) === 'everywhere' ? 'Most communities' : 'Concentrated in larger cities'}</dd>
              </div>
              <div>
                <dt>Run your own business</dt>
                <dd>{LEVEL_WORDS[career.entrepreneurial]} potential</dd>
              </div>
            </dl>
          </section>

          <section className="card" aria-labelledby="needs-h">
            <h2 id="needs-h" className="h3">
              What it draws on
            </h2>
            <h3 className="h4">Key skills</h3>
            <div className="chips chips--static">
              {career.skills.map((s) => (
                <span key={s} className="tag">
                  {SKILLS[s].label}
                </span>
              ))}
            </div>
            <h3 className="h4" style={{ marginTop: 'var(--s-4)' }}>
              Helpful aptitudes
            </h3>
            <div className="chips chips--static">
              {career.aptitudes.map((s) => (
                <span key={s} className="tag">
                  {APTITUDES[s].label}
                </span>
              ))}
            </div>
            <h3 className="h4" style={{ marginTop: 'var(--s-4)' }}>
              Values it tends to support
            </h3>
            <div className="chips chips--static">
              {career.values.supports.map((s) => (
                <span key={s} className="tag tag--done">
                  {VALUES[s].label}
                </span>
              ))}
            </div>
            {career.values.strains.length > 0 && (
              <>
                <h3 className="h4" style={{ marginTop: 'var(--s-4)' }}>
                  Values it can strain
                </h3>
                <div className="chips chips--static">
                  {career.values.strains.map((s) => (
                    <span key={s} className="tag">
                      {VALUES[s].label}
                    </span>
                  ))}
                </div>
              </>
            )}
            <h3 className="h4" style={{ marginTop: 'var(--s-4)' }}>
              Gifts it uses
            </h3>
            <div className="chips chips--static">
              {career.gifts.map((s) => (
                <span key={s} className="tag tag--purpose">
                  {GIFTS[s].label}
                </span>
              ))}
            </div>
          </section>

          <section className="card" aria-labelledby="path-h">
            <h2 id="path-h" className="h3">
              {roadmap ? (roadmap.stage === 'leading' ? 'A leading path' : roadmap.stage === 'ruledOut' ? 'Ruled out for now' : 'You’re exploring this path') : 'Test this path'}
            </h2>
            <p className="small muted">
              {roadmap
                ? roadmap.stage === 'ruledOut'
                  ? 'You tested it and decided it isn’t for you right now. You can reopen it anytime.'
                  : 'See your evidence, what’s still unanswered and your next best step.'
                : 'Exploring isn’t committing. Called drafts a few small steps to gather real evidence, shaped by your stage of life and what you’ve already done.'}
            </p>
            {roadmap ? (
              <Link to={`/path?career=${id}`} className="btn btn--secondary btn--block">
                Open in My Path
              </Link>
            ) : (
              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={() => {
                  update((p) => {
                    p.roadmaps.unshift(generateRoadmap(career, p));
                    if (!p.saved.includes(id)) p.saved.push(id);
                    if (!p.careerStatus[id] || p.careerStatus[id] === 'curious') p.careerStatus[id] = 'exploring';
                  });
                  navigate(`/path?career=${id}`);
                }}
              >
                Explore this path
              </button>
            )}
          </section>

          <section className="card" aria-labelledby="related-h">
            <h2 id="related-h" className="h3">
              Related careers
            </h2>
            <ul className="plain related">
              {career.related
                .map((r) => CAREER_BY_ID[r])
                .filter(Boolean)
                .map((r) => (
                  <li key={r.id}>
                    <Link to={`/careers/${r.id}`}>{r.title}</Link>
                    <span className="small muted"> {EDUCATION_LEVELS[r.education.level].label.toLowerCase()}</span>
                  </li>
                ))}
            </ul>
          </section>

          <Callout title="Sources">
            {career.soc ? (
              <>
                Learn more on{' '}
                <a href={onetUrl(career.soc)} target="_blank" rel="noreferrer">
                  O*NET OnLine
                </a>{' '}
                and{' '}
                <a href={blsUrl(career.soc)} target="_blank" rel="noreferrer">
                  BLS wage data
                </a>{' '}
                (SOC {career.soc}). Descriptions are written by Called and informed by O*NET.
              </>
            ) : (
              'This career spans many occupations, so pay is a rough estimate. Descriptions are written by Called.'
            )}
          </Callout>
        </aside>
      </div>
    </div>
  );
}
