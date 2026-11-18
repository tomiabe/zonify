export interface ZoneParticipant {
  id: string;
  name: string;
  city: string;
  timezone: string;
  workStart: string;
  workEnd: string;
}

export interface MeetingWindow {
  start: Date;
  availableIds: string[];
  score: number;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function parts(date: Date, timezone: string) {
  let formatter = formatterCache.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    });
    formatterCache.set(timezone, formatter);
  }
  const values = Object.fromEntries(formatter.formatToParts(date).map(part => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    weekday: values.weekday,
    minute: Number(values.hour) * 60 + Number(values.minute),
  };
}

function minuteOfDay(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

export function dateInZone(date: Date, timezone: string) {
  return parts(date, timezone).date;
}

export function isWorkingWindow(start: Date, duration: number, person: ZoneParticipant) {
  const startParts = parts(start, person.timezone);
  const endParts = parts(new Date(start.getTime() + duration * 60_000), person.timezone);
  if (startParts.date !== endParts.date || ['Sat', 'Sun'].includes(startParts.weekday)) return false;
  return startParts.minute >= minuteOfDay(person.workStart)
    && endParts.minute <= minuteOfDay(person.workEnd);
}

export function findMeetingWindows(dateKey: string, baseTimezone: string, people: ZoneParticipant[], duration: number) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const center = Date.UTC(year, month - 1, day);
  const windows: MeetingWindow[] = [];
  // Search around UTC midnight so every local hour is included, even at UTC+14 or UTC-12.
  for (let time = center - 18 * 3_600_000; time <= center + 42 * 3_600_000; time += 30 * 60_000) {
    const start = new Date(time);
    const base = parts(start, baseTimezone);
    if (base.date !== dateKey) continue;
    const availableIds = people.filter(person => isWorkingWindow(start, duration, person)).map(person => person.id);
    const score = Math.max(...people.map(person => {
      const local = parts(start, person.timezone).minute;
      const midpoint = (minuteOfDay(person.workStart) + minuteOfDay(person.workEnd)) / 2;
      return Math.abs(local + duration / 2 - midpoint);
    }));
    windows.push({ start, availableIds, score });
  }
  return windows;
}

export function formatZoneTime(date: Date, timezone: string) {
  const clock = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, hour: 'numeric', minute: '2-digit',
  }).format(date);
  const abbreviation = zoneAbbreviation(date, timezone);
  return abbreviation ? `${clock} ${abbreviation}` : clock;
}

export function zoneAbbreviation(date: Date, timezone: string) {
  const locale = timezone.startsWith('Australia/') ? 'en-AU'
    : timezone === 'Pacific/Auckland' ? 'en-NZ'
      : timezone === 'Asia/Tokyo' ? 'ja-JP'
        : timezone === 'Asia/Dubai' ? 'en-AE'
          : timezone === 'America/Sao_Paulo' ? 'pt-BR'
            : timezone === 'Europe/London' ? 'en-GB'
              : 'en-US';
  return new Intl.DateTimeFormat(locale, { timeZone: timezone, timeZoneName: 'short' })
    .formatToParts(date).find(part => part.type === 'timeZoneName')?.value ?? '';
}

export function formatZoneTimeRange(start: Date, minutes: number, timezone: string) {
  const end = new Date(start.getTime() + minutes * 60_000);
  const startTime = formatZoneTime(start, timezone);
  const endTime = formatZoneTime(end, timezone);
  const startClock = startTime.slice(0, startTime.lastIndexOf(' '));
  const endClock = endTime.slice(0, endTime.lastIndexOf(' '));
  const zone = endTime.slice(endTime.lastIndexOf(' ') + 1);
  const startPeriod = startClock.match(/ (AM|PM)$/)?.[1];
  const endPeriod = endClock.match(/ (AM|PM)$/)?.[1];
  const compactStart = startPeriod === endPeriod ? startClock.replace(/ (AM|PM)$/, '') : startClock;
  return `${compactStart}–${endClock} ${zone}`;
}

export function formatZoneDate(date: Date, timezone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
  }).format(date);
}
