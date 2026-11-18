import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Copy, MapPin, Plus, Search, Share2, Trash2 } from 'lucide-react';
import type { City, Person } from './App';
import { dateInZone, findMeetingWindows, formatZoneDate, formatZoneTime, isWorkingWindow, type ZoneParticipant } from './meeting';
import './PlanningWorkspace.css';

type View = 'people' | 'plan' | 'proposal';

interface Props {
  view: View;
  onViewChange: (view: View) => void;
  cities: City[];
  homeCity: City;
  people: Person[];
  homeWorkStart: string;
  homeWorkEnd: string;
  currentTime: Date;
  onSavePerson: (person: Person) => void;
  onRemovePerson: (id: string) => void;
}

const DEFAULT_START = '09:00';
const DEFAULT_END = '17:00';

function initials(name: string) {
  return name.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
}

function shiftDate(dateKey: string, amount: number) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + amount)).toISOString().slice(0, 10);
}

function durationLabel(minutes: number) {
  return minutes === 60 ? '1 hour' : `${minutes} minutes`;
}

export default function PlanningWorkspace({
  view, onViewChange, cities, homeCity, people, homeWorkStart, homeWorkEnd, currentTime, onSavePerson, onRemovePerson,
}: Props) {
  const [name, setName] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [cityId, setCityId] = useState('');
  const [workStart, setWorkStart] = useState(DEFAULT_START);
  const [workEnd, setWorkEnd] = useState(DEFAULT_END);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [dateKey, setDateKey] = useState(() => dateInZone(new Date(), homeCity.timezone));
  const [duration, setDuration] = useState(30);
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);
  const [selectedStart, setSelectedStart] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [showMobileTimeline, setShowMobileTimeline] = useState(false);

  const cityMatches = cityQuery.trim()
    ? cities.filter(city => `${city.name} ${city.country} ${city.timezone}`.toLowerCase().includes(cityQuery.toLowerCase())).slice(0, 6)
    : [];
  const activeIds = useMemo(() => selectedIds ?? people.map(person => person.id), [selectedIds, people]);
  const participants = useMemo<ZoneParticipant[]>(() => [
    { id: 'home', name: 'You', city: homeCity.name, timezone: homeCity.timezone, workStart: homeWorkStart, workEnd: homeWorkEnd },
    ...people.filter(person => activeIds.includes(person.id)).flatMap(person => {
      const city = cities.find(item => item.id === person.cityId);
      return city ? [{
        id: person.id, name: person.name, city: city.name, timezone: city.timezone,
        workStart: person.workStart ?? DEFAULT_START, workEnd: person.workEnd ?? DEFAULT_END,
      }] : [];
    }),
  ], [activeIds, cities, homeCity, people, homeWorkStart, homeWorkEnd]);
  const windows = useMemo(
    () => findMeetingWindows(dateKey, homeCity.timezone, participants, duration),
    [dateKey, homeCity.timezone, participants, duration],
  );
  const shared = windows.filter(window => window.availableIds.length === participants.length && participants.length > 1);
  const best = [...shared].sort((a, b) => a.score - b.score)[0];
  const compromise = [...windows].sort((a, b) =>
    b.availableIds.length - a.availableIds.length || a.score - b.score
  )[0];
  const selected = shared.find(window => window.start.getTime() === selectedStart) ?? best;

  function resetForm() {
    setName(''); setCityQuery(''); setCityId(''); setWorkStart(DEFAULT_START);
    setWorkEnd(DEFAULT_END); setEditingId(null); setFormError('');
  }

  function editPerson(person: Person) {
    const city = cities.find(item => item.id === person.cityId);
    setName(person.name); setCityId(person.cityId); setCityQuery(city?.name ?? '');
    setWorkStart(person.workStart ?? DEFAULT_START); setWorkEnd(person.workEnd ?? DEFAULT_END);
    setEditingId(person.id); setFormError('');
    onViewChange('people');
  }

  function savePerson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !cityId) { setFormError('Add a name and choose a city.'); return; }
    if (workEnd <= workStart) { setFormError('The end time must be after the start time.'); return; }
    onSavePerson({ id: editingId ?? crypto.randomUUID(), name: name.trim(), cityId, workStart, workEnd });
    resetForm();
  }

  function togglePerson(id: string) {
    setSelectedIds(previous => {
      const current = previous ?? people.map(person => person.id);
      return current.includes(id) ? current.filter(item => item !== id) : [...current, id];
    });
    setSelectedStart(null);
  }

  function updateDate(next: string) { setDateKey(next); setSelectedStart(null); }
  function updateDuration(next: number) { setDuration(next); setSelectedStart(null); }

  const proposalText = selected ? [
    `Could we meet on ${formatZoneDate(selected.start, homeCity.timezone)} for ${durationLabel(duration)}?`,
    ...participants.map(person => `• ${person.name} (${person.city}): ${formatZoneTime(selected.start, person.timezone)}–${formatZoneTime(new Date(selected.start.getTime() + duration * 60_000), person.timezone)}`),
    'Times are shown in each person’s local time zone.',
  ].join('\n') : '';

  async function copyProposal() {
    try {
      await navigator.clipboard.writeText(proposalText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  async function shareProposal() {
    if (navigator.share) {
      try { await navigator.share({ title: 'Zonify time proposal', text: proposalText }); } catch { /* User dismissed share sheet. */ }
    } else {
      await copyProposal();
    }
  }

  if (view === 'people') return (
    <div className="workspace-screen">
      <header className="workspace-heading">
        <div><span className="workspace-eyebrow">YOUR WORKSPACE</span><h1>People &amp; places</h1><p>Keep your team’s cities close and know when they’re available.</p></div>
        <button className="workspace-primary desktop-only" onClick={() => document.getElementById('person-name')?.focus()}><Plus size={17} /> Add person</button>
      </header>
      <div className="people-layout">
        <section className="people-list">
          <div className="workspace-section-title"><h2>Your people</h2><span>{people.length} saved</span></div>
          {people.length === 0 ? <div className="workspace-panel empty-panel"><MapPin size={25} /><h3>No people yet</h3><p>Add someone to see their local time and include them in a shared-time plan.</p></div> : people.map(person => {
            const city = cities.find(item => item.id === person.cityId);
            if (!city) return null;
            const working = isWorkingWindow(currentTime, 0, {
              id: person.id, name: person.name, city: city.name, timezone: city.timezone,
              workStart: person.workStart ?? DEFAULT_START, workEnd: person.workEnd ?? DEFAULT_END,
            });
            return <article className="workspace-panel person-card" key={person.id}>
              <div className="person-identity"><span className="person-initials">{initials(person.name)}</span><div><h3>{person.name}</h3><p><MapPin size={13} /> {city.name}, {city.country}</p></div></div>
              <div className="person-meta"><strong>{formatZoneTime(currentTime, city.timezone)}</strong><small>{person.workStart ?? DEFAULT_START}–{person.workEnd ?? DEFAULT_END} usual hours</small><span className={working ? 'work-status active' : 'work-status'}>{working ? 'Working now' : 'Outside work hours'}</span></div>
              <div className="person-actions"><button onClick={() => editPerson(person)}>Edit</button><button aria-label={`Remove ${person.name}`} onClick={() => onRemovePerson(person.id)}><Trash2 size={16} /></button></div>
            </article>;
          })}
          <div className="workspace-panel next-step"><div><strong>Ready to find a shared time?</strong><p>Compare everyone’s working hours across time zones.</p></div><button onClick={() => onViewChange('plan')}>Plan a time <ArrowRight size={17} /></button></div>
        </section>
        <form className="workspace-panel person-form" onSubmit={savePerson}>
          <div><h2>{editingId ? 'Edit person' : 'Add a person'}</h2><p>See their local time and usual working hours.</p></div>
          <label htmlFor="person-name">Name</label><input id="person-name" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Maya Chen" required />
          <label htmlFor="person-city">City or time zone</label>
          <div className="city-search"><Search size={16} /><input id="person-city" value={cityQuery} onChange={event => { setCityQuery(event.target.value); setCityId(''); }} placeholder="Search a city" autoComplete="off" /></div>
          {cityMatches.length > 0 && !cityId && <div className="city-results">{cityMatches.map(city => <button type="button" key={city.id} onClick={() => { setCityId(city.id); setCityQuery(city.name); }}>{city.name}, {city.country}</button>)}</div>}
          {cityId && <span className="selected-city"><Check size={14} /> {cities.find(city => city.id === cityId)?.name} selected</span>}
          <label>Usual working hours <small>Monday–Friday</small></label><div className="hour-fields"><input aria-label="Work starts" type="time" value={workStart} onChange={event => setWorkStart(event.target.value)} /><span>to</span><input aria-label="Work ends" type="time" value={workEnd} onChange={event => setWorkEnd(event.target.value)} /></div>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <button className="workspace-primary form-submit" type="submit">{editingId ? 'Save changes' : 'Save person'}</button>
          {editingId && <button className="workspace-text-button" type="button" onClick={resetForm}>Cancel editing</button>}
        </form>
      </div>
    </div>
  );

  if (view === 'proposal') return (
    <div className="workspace-screen">
      <header className="workspace-heading proposal-heading"><div><button className="workspace-text-button back-button" onClick={() => onViewChange('plan')}><ArrowLeft size={16} /> Back to planner</button><span className="workspace-eyebrow">STEP 2 OF 2</span><h1>Share a time proposal</h1><p>One clear time for everyone, wherever they are.</p></div></header>
      {selected ? <div className="proposal-layout">
        <section className="workspace-panel proposal-detail"><span className="workspace-eyebrow">PROPOSED TIME</span><h2>{formatZoneDate(selected.start, homeCity.timezone)}</h2><strong className="proposal-time">{formatZoneTime(selected.start, homeCity.timezone)}</strong><p>{durationLabel(duration)} · {participants.length} people</p><div className="proposal-local-times"><h3>In each person’s time zone</h3>{participants.map(person => <div key={person.id}><span className="person-initials small">{initials(person.name)}</span><span><strong>{person.name}</strong><small>{person.city}</small></span><b>{formatZoneTime(selected.start, person.timezone)}</b></div>)}</div></section>
        <section className="workspace-panel proposal-share"><div><span className="workspace-eyebrow">READY TO SHARE</span><h2>Send the right time to everyone</h2><p>The message includes the date, year, city and time zone for each person.</p></div><pre>{proposalText}</pre><div className="proposal-buttons"><button className="workspace-primary" onClick={copyProposal}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? 'Copied' : 'Copy proposal'}</button><button className="workspace-secondary" onClick={shareProposal}><Share2 size={17} /> Share</button></div></section>
      </div> : <div className="workspace-panel empty-panel"><p>The selected time is no longer available. Choose another window.</p><button className="workspace-primary" onClick={() => onViewChange('plan')}>Back to planner</button></div>}
    </div>
  );

  return <div className="workspace-screen">
    <header className="workspace-heading planner-heading"><div><span className="workspace-eyebrow">FIND A SHARED TIME</span><h1>Plan time across zones</h1><p>Find a time that respects everyone’s working day.</p></div><div className="date-control"><button aria-label="Previous day" onClick={() => updateDate(shiftDate(dateKey, -1))}><ChevronLeft size={18} /></button><label><CalendarDays size={17} /><input aria-label="Planning date" type="date" value={dateKey} onChange={event => updateDate(event.target.value)} /></label><button aria-label="Next day" onClick={() => updateDate(shiftDate(dateKey, 1))}><ChevronRight size={18} /></button></div></header>
    <section className="workspace-panel participant-panel"><div><span className="workspace-eyebrow">COMPARE PEOPLE</span><div className="participant-chips"><span className="participant-chip selected"><span className="person-initials tiny">YO</span>You <small>{homeCity.name}</small><Check size={13} /></span>{people.map(person => { const city = cities.find(item => item.id === person.cityId); return <button key={person.id} className={`participant-chip ${activeIds.includes(person.id) ? 'selected' : ''}`} onClick={() => togglePerson(person.id)}><span className="person-initials tiny">{initials(person.name)}</span>{person.name.split(' ')[0]} <small>{city?.name}</small>{activeIds.includes(person.id) && <Check size={13} />}</button>; })}<button className="add-participant" onClick={() => onViewChange('people')}><Plus size={15} /> Add person</button></div></div><label className="duration-control">DURATION<span className="duration-select"><select value={duration} onChange={event => updateDuration(Number(event.target.value))}><option value={30}>30 minutes</option><option value={60}>1 hour</option></select><ChevronDown size={16} aria-hidden="true" /></span></label></section>
    {people.length === 0 ? <div className="workspace-panel empty-panel"><Clock3 size={25} /><h2>Add someone to compare</h2><p>Save a person and their working hours to find a shared time.</p><button className="workspace-primary" onClick={() => onViewChange('people')}>Add a person</button></div> : activeIds.length === 0 ? <div className="workspace-panel empty-panel"><h2>Select a person</h2><p>Choose at least one person to compare with your home time.</p></div> : <>
      <section className={`workspace-panel shared-timeline ${showMobileTimeline ? 'mobile-expanded' : ''}`}><div className="timeline-heading"><div><span className="workspace-eyebrow">SHARED WORKING HOURS</span><h2>{new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${dateKey}T12:00:00Z`))}</h2></div><span>Times aligned to {homeCity.name}</span></div><div className="shared-timeline-scroll"><div className="shared-timeline-inner"><div className="time-ruler"><span />{[0, 3, 6, 9, 12, 15, 18, 21].map(hour => <span key={hour} style={{ gridColumn: `${hour * 2 + 2} / span 6` }}>{hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`}</span>)}</div>{participants.map(person => <div className="timeline-person-row" key={person.id}><div className="timeline-person-label"><strong>{person.name}</strong><small>{person.city}</small></div><div className="timeline-slots">{windows.map(window => { const available = isWorkingWindow(window.start, duration, person); const allAvailable = window.availableIds.length === participants.length; const isSelected = selected?.start.getTime() === window.start.getTime(); return <button key={window.start.getTime()} title={`${formatZoneTime(window.start, homeCity.timezone)} · ${available ? 'Working' : 'Outside work hours'}`} aria-label={`${person.name} at ${formatZoneTime(window.start, homeCity.timezone)}`} disabled={!allAvailable} onClick={() => setSelectedStart(window.start.getTime())} className={`${available ? 'available' : ''} ${allAvailable ? 'shared' : ''} ${isSelected ? 'chosen' : ''}`} />; })}</div></div>)}</div></div><p className="timeline-hint">{shared.length ? 'Select a blue window to compare local times and propose it.' : `No ${duration}-minute window falls within everyone’s working hours.`}</p></section>
      {selected ? <section className="workspace-panel window-summary"><div><span className="workspace-eyebrow">BEST SHARED WINDOW</span><h2>{formatZoneTime(selected.start, homeCity.timezone)}</h2><p>{formatZoneDate(selected.start, homeCity.timezone)} · {durationLabel(duration)}</p></div><div className="window-people">{participants.map(person => <div key={person.id}><strong>{person.name}</strong><span>{formatZoneTime(selected.start, person.timezone)}</span></div>)}</div><button className="mobile-other-times" onClick={() => setShowMobileTimeline(previous => !previous)}>{showMobileTimeline ? 'Hide other times' : 'See other times'} <ArrowRight size={15} /></button><div className="window-actions"><button className="workspace-secondary" onClick={() => setSelectedStart(null)}>Best time</button><button className="workspace-primary" onClick={() => onViewChange('proposal')}>Review proposal <ArrowRight size={17} /></button></div></section> : <section className="workspace-panel window-summary no-window"><div><span className="workspace-eyebrow">NO SHARED WINDOW</span><h2>There isn’t a time inside everyone’s hours.</h2><p>Try a different day, shorten the meeting, or adjust who joins.</p></div>{compromise && compromise.availableIds.length > 0 && <div className="closest-compromise"><span>Closest compromise</span><strong>{formatZoneTime(compromise.start, homeCity.timezone)}</strong><small>{compromise.availableIds.length} of {participants.length} people within working hours</small></div>}<button className="workspace-secondary" onClick={() => onViewChange('people')}>Edit working hours</button></section>}
    </>}
  </div>;
}
