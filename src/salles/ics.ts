/** Cours d'une salle, en millisecondes UTC. */
export type Slot = { start: number; end: number; title: string };

export type Availability =
  | { state: 'busy'; title: string; until: number }
  | { state: 'free'; nextStart: number | null };

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Tahiti : UTC-10, sans changement d'heure. Fixé pour ne pas dépendre du fuseau du téléphone. */
const OFFSET = -10 * HOUR;

const DATE_RE = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/;

function parseDate(value: string): number | null {
  const m = DATE_RE.exec(value.trim());
  if (!m) return null;
  const utc = Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0));
  // Sans « Z », l'heure est celle de Tahiti.
  return m[7] ? utc : utc - OFFSET;
}

const unescapeText = (s: string) => s.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1').trim();

export function parseIcs(text: string): Slot[] {
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
  const slots: Slot[] = [];
  let current: Record<string, string> | null = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
    } else if (line === 'END:VEVENT') {
      if (current) {
        const start = current.DTSTART ? parseDate(current.DTSTART) : null;
        const end = current.DTEND ? parseDate(current.DTEND) : null;
        if (start !== null && end !== null && end > start) {
          slots.push({ start, end, title: unescapeText(current.SUMMARY ?? '') });
        }
      }
      current = null;
    } else if (current) {
      const colon = line.indexOf(':');
      if (colon > 0) current[line.slice(0, colon).split(';')[0].toUpperCase()] = line.slice(colon + 1);
    }
  }
  return slots.sort((a, b) => a.start - b.start);
}

/** Début de la journée (à Tahiti) contenant `ms`. */
export function startOfDay(ms: number): number {
  const local = ms + OFFSET;
  return local - (((local % DAY) + DAY) % DAY) - OFFSET;
}

export function endOfDay(ms: number): number {
  return startOfDay(ms) + DAY;
}

/** Cours chevauchant la journée de `ms`, dans l'ordre. */
export function slotsOfDay(slots: Slot[], ms: number): Slot[] {
  const from = startOfDay(ms);
  const to = from + DAY;
  return slots.filter((s) => s.end > from && s.start < to);
}

export function availabilityAt(slots: Slot[], now: number): Availability {
  const running = slots.find((s) => s.start <= now && now < s.end);
  if (running) {
    // Cours qui s'enchaînent : la salle ne se libère qu'à la fin du dernier.
    let until = running.end;
    for (const s of slots) if (s.start <= until && s.end > until) until = s.end;
    return { state: 'busy', title: running.title, until };
  }
  const next = slots.find((s) => s.start > now);
  return { state: 'free', nextStart: next ? next.start : null };
}

/** "14h05", à l'heure de Tahiti. */
export function formatHour(ms: number): string {
  const d = new Date(ms + OFFSET);
  return `${d.getUTCHours()}h${String(d.getUTCMinutes()).padStart(2, '0')}`;
}
