import { useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Callout, PageHeader } from '../components/ui';
import { CAREERS, CAREER_BY_ID } from '../data/careers';
import { formatDate } from '../lib/format';
import { conversationsForCareer, interviewQuestions, localContext, outreachScript, placeSearches, resourcesForCareer, shadowRequestScript } from '../lib/network';
import { consideredPlaces, homePlace, type Place } from '../lib/places';
import { uid } from '../lib/profile';
import { smartSearchScore } from '../lib/smartSearch';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { useStore } from '../state/store';

const today = () => new Date().toISOString().slice(0, 10);

/** "Houston, TX" for a metro, "Texas" for a state: the way people search. */
const searchName = (p: Place) => (p.kind === 'metro' ? `${p.name.split(', ')[0].split('-')[0]}, ${p.state}` : p.name);

function PlaceLooks({ careerId, careerTitle }: { careerId: string; careerTitle: string }) {
  const { profile } = useStore();
  const career = CAREER_BY_ID[careerId];
  const home = homePlace(profile);
  const places: { place: Place; role: string }[] = [...(home ? [{ place: home, role: 'Where you live' }] : []), ...consideredPlaces(profile).map((place) => ({ place, role: 'Considering' }))];
  return (
    <section className="section section--tight" aria-labelledby="places-look-h">
      <h2 id="places-look-h" className="h3">Look in each of your places</h2>
      {places.length ? (
        <>
          <p className="small muted">Live map searches for established groups and programs connected to {careerTitle.toLowerCase()}. Called doesn’t keep a directory, so you always see current listings. Check that an organization is legitimate before you reach out.</p>
          <div className="grid grid--3">
            {places.map(({ place, role }) => (
              <article key={place.id} className="card place-look">
                <span className="tag">{role}</span>
                <h3 className="h4">{place.label}</h3>
                <ul className="plain small">
                  {placeSearches(career, searchName(place)).map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noreferrer">
                        {s.label} <Icon name="external" size={13} />
                      </a>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </>
      ) : (
        <p className="small">
          <Link to="/places">Add where you live and places you’d consider</Link> to get searches for training programs, professional groups, colleges and free career help in each place.
        </p>
      )}
    </section>
  );
}

function LocationForm() {
  const { profile, update } = useStore();
  const current = profile.location;
  const [city, setCity] = useState(current?.city ?? '');
  const [state, setState] = useState(current?.state ?? '');
  const [zip, setZip] = useState(current?.zip ?? '');
  const [places, setPlaces] = useState<string[]>([...(current?.considering ?? []), '', '', ''].slice(0, 3));
  const [saved, setSaved] = useState(false);

  const save = () => {
    const considering = places.map((x) => x.trim()).filter(Boolean).slice(0, 3);
    if (!city.trim() && !state.trim() && !zip.trim() && !considering.length) {
      update((p) => { delete p.location; });
    } else {
      update((p) => {
        const nextState = state.trim().toUpperCase() || undefined;
        p.location = { city: city.trim() || undefined, state: nextState, zip: zip.trim() || undefined, considering, place: p.location?.state === nextState ? p.location?.place : undefined };
      });
    }
    setSaved(true);
  };

  return (
    <section className="card" aria-labelledby="location-h">
      <h2 id="location-h" className="h3">Where might you live or work?</h2>
      <p className="small muted">Optional. A city and state help Called show pay, outlook, apprenticeships, associations, and workforce resources without using GPS or requiring an account. To compare cost of living, college costs and pay across places, use <Link to="/places">Places and cost of living</Link>.</p>
      <div className="grid grid--2">
        <div className="field"><label htmlFor="network-city">City</label><input id="network-city" className="input" value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} autoComplete="address-level2" /></div>
        <div className="field"><label htmlFor="network-state">State</label><input id="network-state" className="input" value={state} onChange={(e) => setState(e.target.value)} maxLength={30} placeholder="MN or Minnesota" autoComplete="address-level1" /></div>
        <div className="field"><label htmlFor="network-zip">ZIP code <span className="muted small">(optional)</span></label><input id="network-zip" className="input" value={zip} onChange={(e) => setZip(e.target.value.replace(/[^0-9-]/g, '').slice(0, 10))} inputMode="numeric" autoComplete="postal-code" /></div>
      </div>
      <fieldset className="field" style={{ marginTop: 'var(--s-4)' }}>
        <legend>Other places you’d realistically consider <span className="muted small">(up to three)</span></legend>
        <div className="stack">
          {places.map((place, i) => <input key={i} className="input" value={place} onChange={(e) => setPlaces((old) => old.map((v, j) => j === i ? e.target.value : v))} placeholder={`City, state option ${i + 1}`} maxLength={100} />)}
        </div>
      </fieldset>
      <div className="row" style={{ marginTop: 'var(--s-4)' }}><button type="button" className="btn btn--secondary" onClick={save}>Save location</button>{saved && <span className="small muted" role="status">Saved on this device.</span>}</div>
    </section>
  );
}

function ConversationForm({ careerId }: { careerId: string }) {
  const { update } = useStore();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [organization, setOrganization] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const career = CAREER_BY_ID[careerId];
  if (!career) return null;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!role.trim() || !notes.trim() || !date) return;
    update((p) => {
      p.conversations.unshift({ id: uid('talk'), careerId, name: name.trim() || undefined, role: role.trim(), organization: organization.trim() || undefined, location: location.trim() || undefined, date, notes: notes.trim() });
      p.interviews = Math.max(p.interviews, 1);
    });
    setName(''); setRole(''); setOrganization(''); setLocation(''); setNotes(''); setDate(today()); setSaved(true);
  };
  return (
    <form className="card stack" onSubmit={submit} aria-labelledby="log-h">
      <div><h2 id="log-h" className="h3">People I’ve talked to</h2><p className="small muted">This is a lightweight evidence log, not a contact database. Keep notes about what you learned, not private details you don’t need.</p></div>
      <div className="grid grid--2">
        <div className="field"><label htmlFor="talk-name">Name <span className="muted small">(optional)</span></label><input id="talk-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></div>
        <div className="field"><label htmlFor="talk-role">Role or trade</label><input id="talk-role" className="input" required value={role} onChange={(e) => setRole(e.target.value)} maxLength={100} placeholder={`e.g. ${career.title}`} /></div>
        <div className="field"><label htmlFor="talk-org">Organization <span className="muted small">(optional)</span></label><input id="talk-org" className="input" value={organization} onChange={(e) => setOrganization(e.target.value)} maxLength={100} /></div>
        <div className="field"><label htmlFor="talk-location">Location <span className="muted small">(optional)</span></label><input id="talk-location" className="input" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={100} placeholder="City, state or event" /></div>
        <div className="field"><label htmlFor="talk-date">Date</label><input id="talk-date" className="input" type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></div>
      </div>
      <div className="field"><label htmlFor="talk-notes">What I learned</label><textarea id="talk-notes" className="input" required rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} placeholder="What surprised you? What did you learn about the work, training, or day-to-day?" /></div>
      <div className="row"><button type="submit" className="btn btn--primary">Save conversation</button>{saved && <span className="small muted" role="status">Added to your evidence.</span>}</div>
    </form>
  );
}

export default function Network() {
  useDocumentTitle('Local Connections');
  const { profile } = useStore();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('career') ?? '';
  const career = CAREER_BY_ID[selectedId];
  const [picker, setPicker] = useState(selectedId);
  const [careerQuery, setCareerQuery] = useState(career?.title ?? '');
  const chosen = CAREER_BY_ID[picker];
  const active = chosen ?? career;
  const resources = useMemo(() => active ? resourcesForCareer(active, profile.stage) : [], [active, profile.stage]);
  const conversations = active ? conversationsForCareer(active.id, profile) : [];
  const careerMatches = useMemo(() => {
    if (!careerQuery.trim()) return CAREERS.slice(0, 8);
    return CAREERS.map((item) => ({ item, score: smartSearchScore(careerQuery, [item.title, item.family, item.summary, item.skills.join(' ')]) })).filter(({ score }) => score >= 0).sort((a, b) => b.score - a.score).slice(0, 8).map(({ item }) => item);
  }, [careerQuery]);

  const selectCareer = (id: string) => { setPicker(id); setCareerQuery(CAREER_BY_ID[id]?.title ?? ''); setParams(id ? { career: id } : {}, { replace: true }); };

  return (
    <div className="wrap network-page">
      <PageHeader title="Local Connections" lead="Called helps you turn career curiosity into real-world evidence. Find established places to learn, then record what a conversation taught you.">
        <Link to="/careers" className="btn btn--secondary"><Icon name="careers" size={18} /> Browse careers</Link>
      </PageHeader>
      <div className="grid grid--2">
        <LocationForm />
        <section className="card" aria-labelledby="career-choice-h">
          <h2 id="career-choice-h" className="h3">Find a field to explore</h2>
          <p className="small muted">Search by title, close spelling, field, skill, or related words. The resources and scripts will adapt to your choice.</p>
          <label className="field" htmlFor="network-career"><span>Search careers</span><input id="network-career" className="input" type="search" value={careerQuery} onChange={(event) => setCareerQuery(event.target.value)} placeholder="Try nures, coder, helping people…" autoComplete="off" /></label>
          {careerQuery !== active?.title && <div className="smart-results" aria-label="Career connection matches">{careerMatches.map((item) => <button type="button" className="smart-result" key={item.id} onClick={() => selectCareer(item.id)}><span><strong>{item.title}</strong><span className="small muted">{item.summary}</span></span><span className="tag">Choose</span></button>)}</div>}
          {active && <p className="small" style={{ marginTop: 'var(--s-4)' }}>You’re gathering evidence about <strong>{active.title}</strong> {localContext(profile)}.</p>}
        </section>
      </div>
      {active ? <>
        <section className="section section--tight" aria-labelledby="connect-h">
          <div className="section-head"><div><h2 id="connect-h">Explore this field near you</h2><p className="small muted">Established organizations and learning opportunities, not a social network. Open each source to check current local options.</p></div></div>
          <div className="grid grid--3">{resources.map((resource) => <article className="card network-resource" key={resource.id}><span className="tag">{resource.kind === 'student' ? 'Student opportunity' : resource.kind === 'career' ? 'Career resource' : 'General resource'}</span><h3>{resource.name}</h3><p className="small muted">{resource.description}</p><a className="btn btn--quiet btn--sm" href={resource.url} target="_blank" rel="noreferrer">Open resource <Icon name="external" size={15} /></a></article>)}</div>
        </section>
        <PlaceLooks careerTitle={active.title} careerId={active.id} />
        <section className="grid grid--2 network-evidence">
          <div className="card stack"><h2 className="h3">Talk to someone in this field near you</h2><p>Use this as a small evidence-building step. You’re asking to learn what the work is really like, not asking a stranger for a job.</p><div className="callout callout--evidence"><Icon name="journal" size={20} /><div><strong className="callout__title">Ask for a conversation</strong><p>{outreachScript(active, profile)}</p><button type="button" className="btn btn--quiet btn--sm" onClick={() => navigator.clipboard?.writeText(outreachScript(active, profile))}>Copy conversation script</button></div></div><div className="callout"><Icon name="careers" size={20} /><div><strong className="callout__title">Ask for a safe way to observe</strong><p>{shadowRequestScript(active, profile)}</p><button type="button" className="btn btn--quiet btn--sm" onClick={() => navigator.clipboard?.writeText(shadowRequestScript(active, profile))}>Copy job-shadow script</button></div></div>{profile.stage === 'highSchool' && <Callout tone="info" title="A note about safety">Prefer school, employer, union, association, or organization channels. Meet at an official workplace, event, or public place. Tell a parent, teacher, counselor, or trusted adult, and avoid sharing unnecessary private information with strangers.</Callout>}</div>
          <ConversationForm careerId={active.id} />
        </section>
        <section className="card network-questions" aria-labelledby="questions-h"><div className="row row--between"><div><h2 id="questions-h" className="h3">Questions that get past the job description</h2><p className="small muted">Choose a few. Listen for examples, tradeoffs, and what has changed recently.</p></div><Link to={`/careers/${active.id}/interview`} className="btn btn--secondary btn--sm">Practice first</Link></div><ol className="grid grid--2">{interviewQuestions(active).map((question) => <li key={question}>{question}</li>)}</ol></section>
        {conversations.length > 0 && <section className="card network-log" aria-labelledby="logged-h"><h2 id="logged-h" className="h3">Your evidence for {active.title}</h2><ul className="plain">{conversations.map((entry) => <li className="network-log__item" key={entry.id}><div className="row row--between"><strong>{entry.role}{entry.organization ? ` · ${entry.organization}` : ''}</strong><span className="small muted">{formatDate(entry.date)}</span></div><p className="small">{entry.notes}</p>{(entry.name || entry.location) && <span className="small muted">{[entry.name, entry.location].filter(Boolean).join(' · ')}</span>}</li>)}</ul><p className="small muted">This conversation now counts as interview evidence for this path and can change My Path’s next best step.</p></section>}
      </> : <section className="section"><div className="empty"><span className="empty__icon"><Icon name="purpose" size={28} /></span><h2 className="empty__title">Choose a career to find relevant connections</h2><p>Start with a career page or pick one above. Called will keep the focus on learning, not networking for its own sake.</p></div></section>}
    </div>
  );
}
