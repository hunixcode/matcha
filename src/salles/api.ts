import { parseIcs, type Slot } from './ics';

// Mêmes serveurs que https://kioskweb.apps.upf.pf/salle (voir /assets/config.json).
const REFERENTIEL_URL = 'https://ics.apps.upf.pf/referentiel/salles';
const ICS_URL = 'https://icsviewer.apps.upf.pf/ics-srv/ics_salle.php?id=';
const TIMEOUT_MS = 15_000;

/** Nom du bâtiment dans le référentiel. */
export const BUILDING = 'BAT._B';

export type Room = { id: string; label: string };
export type RoomSchedule = Room & { slots: Slot[] | null };

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/** Référentiel : une ligne « id;bâtiment;libellé » par salle. */
async function fetchRooms(building: string): Promise<Room[]> {
  const text = await fetchText(REFERENTIEL_URL);
  return text
    .split('\n')
    .map((line) => line.trim().split(';'))
    .filter((cols) => cols.length >= 3 && cols[1] === building)
    .map(([id, , label]) => ({ id, label }));
}

/** Emploi du temps de chaque salle ; `slots` vaut null pour une salle dont l'ICS n'a pas pu être lu. */
export async function fetchSchedules(building: string = BUILDING): Promise<RoomSchedule[]> {
  const rooms = await fetchRooms(building);
  return Promise.all(
    rooms.map(async (room) => {
      try {
        return { ...room, slots: parseIcs(await fetchText(ICS_URL + encodeURIComponent(room.id))) };
      } catch {
        return { ...room, slots: null };
      }
    }),
  );
}
