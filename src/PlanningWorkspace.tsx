import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Copy, MapPin, Plus, Search, Share2, Trash2 } from 'lucide-react';
import type { City, Person } from './App';
import { dateInZone, findMeetingWindows, formatZoneDate, formatZoneTime, formatZoneTimeRange, isWorkingWindow, type ZoneParticipant } from './meeting';
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

function displayPlanDate(dateKey: string, long = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return 'Select a date';
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: long ? 'long' : 'short', month: 'short', day: 'numeric' })
    .format(new Date(`${dateKey}T12:00:00Z`));
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
  const [meetingTitle, setMeetingTitle] = useState('Team sync');
  const [meetingNote, setMeetingNote] = useState('');

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
  const selected = (selectedStart === null ? undefined : windows.find(window => window.start.getTime() === selectedStart)) ?? best;
  const selectedIsCompromise = Boolean(selected && selected.availableIds.length < participants.length);

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

  function updateDate(next: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(next)) return; setDateKey(next); setSelectedStart(null); }
  function updateDuration(next: number) { setDuration(next); setSelectedStart(null); }

  const proposalDate = selected ? new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: homeCity.timezone }).format(selected.start) : '';
  const proposalText = selected ? [
    `${meetingTitle.trim() || 'Meeting'} — ${proposalDate}`,
    ...participants.map(person => `${person.city}: ${formatZoneTimeRange(selected.start, duration, person.timezone)}`),
    ...(selectedIsCompromise ? ['', 'Please confirm this outside-hours time works for everyone.'] : []),
    ...(meetingNote.trim() ? ['', meetingNote.trim()] : []),
    '',
    'Does this time work for everyone?',
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
      <header className="workspace-heading people-heading">
        <div><h1>People &amp; places</h1><p><span className="desktop-only">Keep the people you coordinate with in their own local time.</span><span className="mobile-only">Keep your team’s cities close.</span></p></div>
        <div className="people-heading-actions"><span>{people.length} people · {new Set(people.map(person => person.cityId)).size} cities</span><button className="workspace-primary desktop-only" onClick={() => document.getElementById('person-name')?.focus()}><Plus size={17} /> Add person</button></div>
      </header>
      <div className="people-layout">
        <section className="people-list">
          <div className="workspace-section-title"><h2>Your people</h2><span className="mobile-only">{people.length} saved</span><span className="desktop-only">Select people when you plan</span></div>
          {people.length === 0 ? <div className="workspace-panel empty-panel"><MapPin size={25} /><h3>No people yet</h3><p>Add someone to see their local time and include them in a shared-time plan.</p></div> : people.map(person => {
            const city = cities.find(item => item.id === person.cityId);
            if (!city) return null;
            const working = isWorkingWindow(currentTime, 0, {
              id: person.id, name: person.name, city: city.name, timezone: city.timezone,
              workStart: person.workStart ?? DEFAULT_START, workEnd: person.workEnd ?? DEFAULT_END,
            });
            return <article className="workspace-panel person-card" key={person.id}>
              <button className="mobile-person-card-edit" aria-label={`Edit ${person.name}`} onClick={() => editPerson(person)} />
              <div className="person-identity"><span className="person-initials">{initials(person.name)}</span><div><h3>{person.name}</h3><p><MapPin size={13} /> {city.name}<span className="desktop-only">, {city.country}</span><span className="mobile-only"> · {formatZoneTime(currentTime, city.timezone).replace(/ [^ ]+$/, '')}</span></p></div></div>
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
          {cityMatches.length > 0 && !cityId && <div className="city-results">{cityMatches.map(city => <button type="button" key={city.id} onClick={() => { setCityId(city.id); setCityQuery(city.name); }}><MapPin size={15} /><span><strong>{city.name}, {city.country}</strong><small>{formatZoneTime(currentTime, city.timezone)} now</small></span></button>)}</div>}
          {cityId && <div className="selected-city"><span><strong>{cities.find(city => city.id === cityId)?.name}, {cities.find(city => city.id === cityId)?.country}</strong><small>{formatZoneTime(currentTime, cities.find(city => city.id === cityId)?.timezone ?? homeCity.timezone)} now</small></span><span><Check size={14} /> Selected</span></div>}
          <label>Usual working hours <small>Monday–Friday</small></label><div className="hour-fields"><input aria-label="Work starts" type="time" value={workStart} onChange={event => setWorkStart(event.target.value)} /><span>to</span><input aria-label="Work ends" type="time" value={workEnd} onChange={event => setWorkEnd(event.target.value)} /></div>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <button className="workspace-primary form-submit" type="submit">{editingId ? 'Save changes' : 'Save person'}</button>
          {editingId && <button className="workspace-text-button" type="button" onClick={resetForm}>Cancel editing</button>}
          {editingId && <button className="workspace-text-button mobile-remove-person" type="button" onClick={() => { onRemovePerson(editingId); resetForm(); }}>Remove person</button>}
        </form>
      </div>
    </div>
  );

  if (view === 'proposal') return (
    <div className="workspace-screen proposal-screen">
      <header className="workspace-heading proposal-heading"><div><button className="workspace-text-button back-button" onClick={() => onViewChange('plan')}><ArrowLeft size={16} /> <span className="desktop-only">Back to shared times</span><span className="mobile-only">Shared times</span></button><h1><span className="desktop-only">Review and share</span><span className="mobile-only">Review &amp; share</span></h1><p>A clear time for everyone, ready to send.</p></div><span className="proposal-step">STEP 3 OF 3</span></header>
      {selected ? <div className="proposal-layout">
        {selectedIsCompromise && <div className="proposal-alert">This is a compromise: {selected.availableIds.length} of {participants.length} people are within working hours. Confirm with everyone before sending.</div>}
        <div className="proposal-detail-column">
          <section className="workspace-panel proposal-detail"><div className="proposal-detail-head"><div><span className="workspace-eyebrow">YOUR PROPOSAL</span><h2>{meetingTitle.trim() || 'Meeting'}</h2></div><span className="proposal-duration">{durationLabel(duration)}</span></div><div className="proposal-date-card"><span className="proposal-date-icon"><small>{new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: homeCity.timezone }).format(selected.start).toUpperCase()}</small><strong>{new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: homeCity.timezone }).format(selected.start)}</strong></span><div><strong>{formatZoneDate(selected.start, homeCity.timezone)}</strong><span className="mobile-only proposal-duration-inline">{durationLabel(duration)}</span><span>{formatZoneTimeRange(selected.start, duration, homeCity.timezone)} · {homeCity.name} time</span></div></div><label className="proposal-field">Meeting title<input value={meetingTitle} onChange={event => setMeetingTitle(event.target.value)} maxLength={80} /></label><label className="proposal-field proposal-note">Note for your team · optional<textarea value={meetingNote} onChange={event => setMeetingNote(event.target.value)} placeholder="Add context or an agenda before you share..." rows={2} /></label></section>
          <section className="workspace-panel proposal-local-times"><h3>Everyone sees their local time</h3><p>The same moment, shown in each person’s city.</p>{participants.map(person => <div key={person.id}><span><strong>{person.name}</strong><small>{person.city}</small></span><b>{formatZoneTime(selected.start, person.timezone)}</b></div>)}</section>
        </div>
        <div className="proposal-share-column"><section className="workspace-panel proposal-share"><div><h2>Share the proposal</h2><p>Copy a message with the date and each person’s local time. Send it in the channel your team already uses.</p></div><div className="proposal-message"><span className="workspace-eyebrow">MESSAGE PREVIEW</span><pre>{proposalText}</pre></div><button className="workspace-primary proposal-copy" onClick={copyProposal}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? 'Copied' : 'Copy proposal'}</button><p className="proposal-copy-hint">{copied ? 'Ready to paste.' : 'You can edit the message after copying it.'}</p><button className="workspace-text-button proposal-native-share" onClick={shareProposal}><Share2 size={16} /> Share with another app</button></section><section className="workspace-panel proposal-next"><h3>Before you send</h3><ol><li><strong>Confirm the local times</strong><span>Check the proposed time for each city.</span></li><li><strong>Share with your team</strong><span>Paste the proposal into chat or email.</span></li><li><strong>Add a calendar invite</strong><span>Once everyone agrees, schedule the meeting.</span></li></ol></section></div>
      </div> : <div className="workspace-panel empty-panel"><p>The selected time is no longer available. Choose another window.</p><button className="workspace-primary" onClick={() => onViewChange('plan')}>Back to planner</button></div>}
    </div>
  );

  return <div className="workspace-screen">
    <header className="workspace-heading planner-heading"><div><h1>Find a shared time</h1><p className="desktop-only">See working hours together before you send an invitation.</p></div><div className="date-control"><button aria-label="Previous day" onClick={() => updateDate(shiftDate(dateKey, -1))}><ChevronLeft size={18} /></button><label><span className="date-display desktop-only">{displayPlanDate(dateKey)}</span><span className="date-display mobile-only">{displayPlanDate(dateKey, true)}</span><input aria-label="Planning date" type="date" value={dateKey} onChange={event => updateDate(event.target.value)} /></label><button aria-label="Next day" onClick={() => updateDate(shiftDate(dateKey, 1))}><ChevronRight size={18} /></button></div></header>
    <section className="workspace-panel participant-panel"><div><span className="workspace-eyebrow">COMPARE PEOPLE</span><div className="participant-chips"><span className="participant-chip selected"><span className="person-initials tiny">YO</span>You <small>{homeCity.name}</small><Check size={13} /></span>{people.map(person => { const city = cities.find(item => item.id === person.cityId); return <button key={person.id} className={`participant-chip ${activeIds.includes(person.id) ? 'selected' : ''}`} onClick={() => togglePerson(person.id)}><span className="person-initials tiny">{initials(person.name)}</span>{person.name.split(' ')[0]} <small>{city?.name}</small>{activeIds.includes(person.id) && <Check size={13} />}</button>; })}<button className="add-participant" onClick={() => onViewChange('people')}><Plus size={15} /> Add person</button></div></div><label className="duration-control">DURATION<span className="duration-select"><select value={duration} onChange={event => updateDuration(Number(event.target.value))}><option value={30}>30 minutes</option><option value={60}>1 hour</option></select><ChevronDown size={16} aria-hidden="true" /></span></label></section>
    {people.length === 0 ? <div className="workspace-panel empty-panel"><Clock3 size={25} /><h2>Add someone to compare</h2><p>Save a person and their working hours to find a shared time.</p><button className="workspace-primary" onClick={() => onViewChange('people')}>Add a person</button></div> : activeIds.length === 0 ? <div className="workspace-panel empty-panel"><h2>Select a person</h2><p>Choose at least one person to compare with your home time.</p></div> : <>
      <section className={`workspace-panel shared-timeline ${showMobileTimeline ? 'mobile-expanded' : ''}`}><div className="timeline-heading"><div><span className="workspace-eyebrow">SHARED WORKING HOURS</span><h2>{new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${dateKey}T12:00:00Z`))}</h2></div><span>Times aligned to {homeCity.name}</span></div><div className="shared-timeline-scroll"><div className="shared-timeline-inner"><div className="time-ruler"><span />{[0, 3, 6, 9, 12, 15, 18, 21].map(hour => <span key={hour} style={{ gridColumn: `${hour * 2 + 2} / span 6` }}>{hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`}</span>)}</div>{participants.map(person => <div className="timeline-person-row" key={person.id}><div className="timeline-person-label"><strong>{person.name}</strong><small>{person.city}</small></div><div className="timeline-slots">{windows.map(window => { const available = isWorkingWindow(window.start, duration, person); const allAvailable = window.availableIds.length === participants.length; const isSelected = selected?.start.getTime() === window.start.getTime(); return <button key={window.start.getTime()} title={`${formatZoneTime(window.start, homeCity.timezone)} · ${available ? 'Working' : 'Outside work hours'}`} aria-label={`${person.name} at ${formatZoneTime(window.start, homeCity.timezone)}`} disabled={!allAvailable} onClick={() => setSelectedStart(window.start.getTime())} className={`${available ? 'available' : ''} ${allAvailable ? 'shared' : ''} ${isSelected ? 'chosen' : ''}`} />; })}</div></div>)}</div></div><p className="timeline-hint">{shared.length ? 'Select a blue window to compare local times and propose it.' : `No ${duration}-minute window falls within everyone’s working hours.`}</p></section>
      {selected ? <section className="workspace-panel window-summary"><div className="best-window-card"><div><span className="workspace-eyebrow">{selectedIsCompromise ? 'CLOSEST COMPROMISE' : 'BEST SHARED WINDOW'}</span><h2>{formatZoneTimeRange(selected.start, duration, homeCity.timezone)}</h2><p>{formatZoneDate(selected.start, homeCity.timezone)} · {homeCity.name} time</p>{selectedIsCompromise && <p className="compromise-warning">{selected.availableIds.length} of {participants.length} people are within working hours. Check with everyone before sending.</p>}</div><div className="window-people">{participants.filter(person => person.id !== 'home').map(person => <div key={person.id}><strong>{person.name} · {person.city}</strong><span>{formatZoneTime(selected.start, person.timezone)}</span></div>)}</div></div><button className="mobile-other-times" onClick={() => setShowMobileTimeline(previous => !previous)}>{showMobileTimeline ? 'Hide other times' : 'See other times'} <ArrowRight size={15} /></button><div className="window-actions"><button className="workspace-secondary" onClick={() => setSelectedStart(null)}>{selectedIsCompromise ? 'Back to alternatives' : 'Best time'}</button><button className="workspace-primary" onClick={() => onViewChange('proposal')}>Review proposal <ArrowRight size={17} /></button></div></section> : <section className="workspace-panel window-summary no-window"><div><span className="workspace-eyebrow">NO SHARED WINDOW</span><h2>No overlap during working hours</h2><p>No one time fits everyone’s usual hours. Keep their hours protected, or review the closest compromise.</p></div>{compromise && compromise.availableIds.length > 0 && <div className="closest-compromise"><span>Closest compromise</span><strong>{formatZoneTime(compromise.start, homeCity.timezone)}</strong><small>{compromise.availableIds.length} of {participants.length} people within working hours</small></div>}<div className="no-window-actions">{compromise && compromise.availableIds.length > 0 && <button className="workspace-primary" onClick={() => setSelectedStart(compromise.start.getTime())}>Review compromise</button>}<button className="workspace-text-button" onClick={() => onViewChange('people')}>Change people or hours</button></div></section>}
    </>}
  </div>;
}
