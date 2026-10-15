import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../state/store';
import { CAREERS, CAREER_BY_ID } from '../data/careers';
import { LIFESTYLE_QUESTIONS } from '../data/assessments';
import { SKILLS, SKILL_LEVELS } from '../data/vocab';
import { Callout, OptionGroup, PageHeader } from '../components/ui';
import { Icon } from '../components/Icon';
import { money } from '../lib/format';
import { smartSearchScore } from '../lib/smartSearch';
import { homePlace, localPay } from '../lib/places';
import { COMPLETED_EDUCATION, readinessLabel, skillLabels, skillsYouHave } from '../lib/readiness';
import { nextMoves } from '../lib/nextMoves';
import { generateRoadmap } from '../lib/path';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import type { CompletedEducation, LifestylePrefs, SkillId, SkillLevel } from '../types';

const SKILL_IDS = Object.keys(SKILLS) as SkillId[];
const TRAINING = LIFESTYLE_QUESTIONS.find((q) => q.key === 'trainingYears')!;
type Scope = 'none' | 'short' | 'any';

export default function WhereNow() {
  useDocumentTitle('Where you are now');
  const { profile, update } = useStore();
  const cur = profile.current ?? {};
  const home = homePlace(profile);

  const [jobQuery, setJobQuery] = useState(cur.careerId ? (CAREER_BY_ID[cur.careerId]?.title ?? '') : '');
  const [careerId, setCareerId] = useState(cur.careerId ?? '');
  const [jobTitle, setJobTitle] = useState(cur.jobTitle ?? '');
  const [pay, setPay] = useState(cur.pay ? String(cur.pay) : '');
  const [years, setYears] = useState(cur.yearsInRole !== undefined ? String(cur.yearsInRole) : '');
  const [education, setEducation] = useState<CompletedEducation | ''>(cur.education ?? '');
  const [field, setField] = useState(cur.field ?? '');
  const [credentials, setCredentials] = useState(cur.credentials ?? '');
  const [saved, setSaved] = useState(false);
  const [scope, setScope] = useState<Scope>(profile.lifestyle.trainingYears === 'none' ? 'none' : profile.lifestyle.trainingYears === 'short' ? 'short' : 'any');

  const job = CAREER_BY_ID[careerId];
  const jobMatches = useMemo(() => {
    const q = jobQuery.trim();
    if (!q || q === job?.title) return [];
    return CAREERS.map((c) => ({ c, s: smartSearchScore(q, [c.title, c.family, c.summary]) }))
      .filter(({ s }) => s >= 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 6)
      .map(({ c }) => c);
  }, [jobQuery, job]);
  const typical = job ? localPay(job, home) : undefined;

  const save = () => {
    update((p) => {
      const n = (v: string) => (v.trim() && Number.isFinite(Number(v)) && Number(v) >= 0 ? Math.round(Number(v)) : undefined);
      p.current = {
        careerId: careerId || undefined,
        jobTitle: jobTitle.trim() || undefined,
        pay: n(pay),
        yearsInRole: n(years),
        education: education || undefined,
        field: field.trim() || undefined,
        credentials: credentials.trim() || undefined,
      };
      if (!p.stage && (careerId || n(pay))) p.stage = 'working';
    });
    setSaved(true);
  };

  const setSkill = (id: SkillId, v: SkillLevel) =>
    update((p) => {
      p.skills[id] = v;
      if (SKILL_IDS.every((s) => p.skills[s] !== undefined)) p.completed.skills = p.completed.skills ?? new Date().toISOString();
    });

  const fillFromJob = () => {
    if (!job) return;
    update((p) => {
      for (const s of job.skills) if ((p.skills[s] ?? 0) < 2) p.skills[s] = 2;
    });
  };

  const setTraining = (v: NonNullable<LifestylePrefs['trainingYears']>) =>
    update((p) => {
      p.lifestyle.trainingYears = v;
    });

  const ready = !!profile.current?.education;
  const moves = useMemo(() => nextMoves(profile, { noMoreSchool: scope !== 'any', shortOk: scope === 'short', limit: 12 }), [profile, scope]);
  const have = skillsYouHave(profile);

  const explore = (id: string) =>
    update((p) => {
      if (!p.roadmaps.some((r) => r.careerId === id)) p.roadmaps.unshift(generateRoadmap(CAREER_BY_ID[id], p));
      if (!p.saved.includes(id)) p.saved.push(id);
      if (!p.careerStatus[id] || p.careerStatus[id] === 'curious') p.careerStatus[id] = 'exploring';
    });

  return (
    <div className="wrap where-now">
      <PageHeader
        title="Where you are now"
        lead="Your current job, pay, education and skills are evidence too. Called credits what you already have, so it can show moves you could make without starting over."
      />

      <div className="grid grid--2 where-now__forms">
        <section className="card stack" aria-labelledby="work-h">
          <h2 id="work-h" className="h3">
            Your work now
          </h2>
          <div className="field">
            <label htmlFor="job-search">Closest career to what you do now</label>
            <input id="job-search" className="input" type="search" value={jobQuery} placeholder="Try teacher, firefighter, nurse…" autoComplete="off" onChange={(e) => { setJobQuery(e.target.value); setSaved(false); }} />
            {jobMatches.length > 0 && (
              <div className="smart-results" aria-label="Matching careers">
                {jobMatches.map((c) => (
                  <button key={c.id} type="button" className="smart-result" onClick={() => { setCareerId(c.id); setJobQuery(c.title); }}>
                    <span>
                      <strong>{c.title}</strong>
                    </span>
                    <span className="tag">Choose</span>
                  </button>
                ))}
              </div>
            )}
            {job ? (
              <span className="field__hint">
                Chosen: {job.title}.{' '}
                <button type="button" className="linkish" onClick={() => { setCareerId(''); setJobQuery(''); }}>
                  Clear
                </button>
              </span>
            ) : (
              <span className="field__hint">Optional. Leave blank if you’re not working or nothing is close.</span>
            )}
          </div>
          <div className="field">
            <label htmlFor="job-title">Your job title, in your words <span className="muted small">(optional)</span></label>
            <input id="job-title" className="input" value={jobTitle} maxLength={80} onChange={(e) => { setJobTitle(e.target.value); setSaved(false); }} />
          </div>
          <div className="grid grid--2">
            <div className="field">
              <label htmlFor="job-pay">Yearly pay before taxes</label>
              <input id="job-pay" className="input" type="number" inputMode="numeric" min={0} step={1000} value={pay} onChange={(e) => { setPay(e.target.value); setSaved(false); }} />
              {typical && <span className="field__hint">Typical for {job!.title.toLowerCase()} ({typical.label}): {money(typical.pay)}</span>}
            </div>
            <div className="field">
              <label htmlFor="job-years">Years in this work</label>
              <input id="job-years" className="input" type="number" inputMode="numeric" min={0} max={60} value={years} onChange={(e) => { setYears(e.target.value); setSaved(false); }} />
            </div>
          </div>
        </section>

        <section className="card stack" aria-labelledby="edu-now-h">
          <h2 id="edu-now-h" className="h3">
            Your education
          </h2>
          <div className="field">
            <label htmlFor="edu-done">Highest education you’ve finished</label>
            <select id="edu-done" className="select" value={education} onChange={(e) => { setEducation(e.target.value as CompletedEducation | ''); setSaved(false); }}>
              <option value="">Choose…</option>
              {COMPLETED_EDUCATION.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="edu-field">Field of study <span className="muted small">(optional)</span></label>
            <input id="edu-field" className="input" value={field} maxLength={80} placeholder="e.g. Education, Fire science, Biology" onChange={(e) => { setField(e.target.value); setSaved(false); }} />
          </div>
          <div className="field">
            <label htmlFor="edu-creds">Licenses and certifications <span className="muted small">(optional)</span></label>
            <input id="edu-creds" className="input" value={credentials} maxLength={160} placeholder="e.g. Teaching license, EMT-B, Firefighter II, CDL" onChange={(e) => { setCredentials(e.target.value); setSaved(false); }} />
          </div>
          <OptionGroup legend={TRAINING.question.replace('after high school', 'from here')} value={profile.lifestyle.trainingYears} onChange={(v) => setTraining(v as NonNullable<LifestylePrefs['trainingYears']>)} options={TRAINING.options.map((o) => ({ value: o.value as string, label: o.label }))} />
        </section>
      </div>

      <div className="row where-now__save">
        <button type="button" className="btn btn--primary" onClick={save}>
          Save where I am now
        </button>
        {saved && (
          <span className="small" role="status">
            Saved. Matches, career pages and training costs now credit what you have.
          </span>
        )}
      </div>

      <section className="section" aria-labelledby="skills-now-h">
        <div className="section-head">
          <h2 id="skills-now-h" className="h3">
            Skills you bring
          </h2>
          {job && (
            <button type="button" className="btn btn--secondary btn--sm" onClick={fillFromJob}>
              Add the skills {job.title.toLowerCase()}s use
            </button>
          )}
        </div>
        <p className="small muted">Rate what you’ve actually done. These are the same answers as the skills assessment, so changing one changes both. They save as you go.</p>
        <div className="skill-grid">
          {SKILL_IDS.map((id) => (
            <div className="field" key={id}>
              <label htmlFor={`sk-${id}`}>{SKILLS[id].label}</label>
              <select id={`sk-${id}`} className="select" value={profile.skills[id] ?? ''} onChange={(e) => setSkill(id, Number(e.target.value) as SkillLevel)}>
                <option value="" disabled>
                  Not rated
                </option>
                {SKILL_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="moves-h">
        <h2 id="moves-h" className="h3">
          Your next moves
        </h2>
        <p className="small muted">
          Ranked by the skills you bring, school you’d still need, pay where you live{profile.current?.pay ? ' compared with what you earn now' : ''}, and your personal fit. Nothing here is a verdict; each one is something to test.
        </p>
        {!ready && (
          <Callout tone="info" title="Add your education to see what needs no more school">
            Choose the highest education you’ve finished above and save. Until then, school time is estimated from scratch.
          </Callout>
        )}
        <div className="segmented" role="group" aria-label="How much more school">
          {(
            [
              ['none', 'No more school'],
              ['short', 'Up to about a year'],
              ['any', 'Any amount'],
            ] as [Scope, string][]
          ).map(([v, label]) => (
            <button key={v} type="button" aria-pressed={scope === v} onClick={() => setScope(v)}>
              {label}
            </button>
          ))}
        </div>
        {moves.length ? (
          <ul className="moves">
            {moves.map((m) => {
              const inPath = profile.roadmaps.some((r) => r.careerId === m.career.id);
              return (
                <li key={m.career.id} className="card move">
                  <div className="move__head">
                    <h3 className="h4">
                      <Link to={`/careers/${m.career.id}`}>{m.career.title}</Link>
                    </h3>
                    {m.ready && <span className={`tag ${m.ready.kind === 'ready' ? 'tag--done' : 'tag--primary'}`}>{readinessLabel(m.ready)}</span>}
                  </div>
                  <dl className="move__facts">
                    <div>
                      <dt>Pay {home ? 'where you live' : 'in the U.S.'}</dt>
                      <dd>
                        {money(m.pay)}
                        {m.payChange !== undefined && (
                          <span className={m.payChange >= 0 ? 'move__up' : 'move__down'}>
                            {' '}
                            ({Math.abs(m.payChange) < 1000 ? 'about the same as now' : `${m.payChange >= 0 ? '+' : '−'}${money(Math.abs(m.payChange))} vs. now`})
                          </span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Skills you bring</dt>
                      <dd>{m.skills.length ? skillLabels(m.skills).join(', ') : 'Few overlap yet'}</dd>
                    </div>
                    {m.match.overall !== null && (
                      <div>
                        <dt>Personal fit</dt>
                        <dd>{m.match.overall} / 100</dd>
                      </div>
                    )}
                  </dl>
                  {m.ready && <p className="small" style={{ margin: 0 }}>{m.ready.summary}</p>}
                  {m.ready?.note && <p className="small muted" style={{ margin: 0 }}>{m.ready.note}</p>}
                  <div className="row">
                    {inPath ? (
                      <Link to={`/path?career=${m.career.id}`} className="btn btn--secondary btn--sm">
                        Open in My Path
                      </Link>
                    ) : (
                      <button type="button" className="btn btn--secondary btn--sm" onClick={() => explore(m.career.id)}>
                        Explore this path
                      </button>
                    )}
                    {m.ready && m.ready.years > 0 && (
                      <Link to={`/compare/education?career=${m.career.id}`} className="btn btn--quiet btn--sm">
                        Cost and payoff
                      </Link>
                    )}
                    <Link to={`/network?career=${m.career.id}`} className="btn btn--quiet btn--sm">
                      Talk to someone
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted">Nothing fits that limit yet. Try “Up to about a year” or check your education above.</p>
        )}
        {profile.current?.credentials && (
          <p className="small">
            <Icon name="info" size={16} /> Credentials like {profile.current.credentials} can count. When you contact programs, ask about credit for prior learning, prior experience or military training; it can shorten school time.
          </p>
        )}
        {have.length === 0 && <p className="small muted">Rate a few skills above to see which ones carry over.</p>}
      </section>
    </div>
  );
}
