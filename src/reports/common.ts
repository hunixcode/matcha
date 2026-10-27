import { formatLongDate, parseEmails } from './format';
import type { Email, Section, Values } from './types';

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export function generalSection(): Section {
  return {
    key: 'general',
    title: 'Date et heure',
    fields: [
      { key: 'date', type: 'date', label: 'Date', required: true, defaultToday: true },
      { key: 'heureDebut', type: 'time', label: 'Heure de début', required: true },
      { key: 'heureFin', type: 'time', label: 'Heure de fin', required: true },
    ],
  };
}

export function sendingSection(): Section {
  return {
    key: 'envoi',
    title: 'Envoi',
    description: 'Mémorisé pour les prochains rapports. Sépare les adresses par une virgule.',
    fields: [
      {
        key: 'destinataires',
        type: 'text',
        label: 'Destinataires',
        keyboard: 'email-address',
        placeholder: 'nom@exemple.fr',
        keepOnReset: true,
        hiddenInReport: true,
      },
      {
        key: 'copie',
        type: 'text',
        label: 'Copie (CC)',
        keyboard: 'email-address',
        placeholder: 'optionnel',
        keepOnReset: true,
        hiddenInReport: true,
      },
    ],
  };
}

/** "13:00" → "13h00" */
const hm = (t: string) => t.replace(':', 'h');

/** Une entrée par ligne → "- entrée". */
export function bulletList(raw: unknown): string[] {
  return str(raw)
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `- ${s}`);
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Rapport au format texte : titre, bloc « Date, heure, et lieu », bloc « Interventions ». */
export function buildReportEmail(code: string, values: Values, interventions: string[]): Email {
  const date = str(values.date);
  const debut = str(values.heureDebut);
  const fin = str(values.heureFin);
  const horaire = debut && fin ? `${hm(debut)} - ${hm(fin)}` : hm(debut || fin);

  const body = [
    '-Date, heure, et lieu---------------------------------------------------------------------',
    ...[date && `* ${capitalize(formatLongDate(date))}`, horaire && `* ${horaire}`, `* ${code}`].filter(Boolean),
    '',
    '-Interventions-----------------------------------------------------------------------------',
    '',
    ...interventions,
  ]
    .join('\n')
    .trimEnd();

  return {
    subject: ['Rapport Monitorat', 'Dylan PETERANO', date && capitalize(formatLongDate(date))]
      .filter(Boolean)
      .join(' -- '),
    body,
    to: parseEmails(values.destinataires),
    cc: parseEmails(values.copie),
  };
}
