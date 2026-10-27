import { buildReportEmail, generalSection, sendingSection } from './common';
import type { ReportDefinition, Section } from './types';

const SALLES = ['B2-1', 'B2-2', 'B2-3', 'B2-4', 'B1-2', 'B1-3', 'COSIP'];

const sections: Section[] = [
  generalSection(),
  {
    key: 'interventions',
    title: 'Interventions',
    description: 'Laisse une salle vide si rien à signaler (R.A.S).',
    fields: [
      { key: 'nbInterventions', type: 'number', label: 'Nombre d’interventions', min: 0, max: 999 },
      ...SALLES.map((salle) => ({
        key: `salle_${salle}`,
        type: 'text' as const,
        label: salle,
        placeholder: 'R.A.S',
      })),
    ],
  },
  sendingSection(),
];

export const b21: ReportDefinition = {
  id: 'b2-1',
  code: 'B2-1',
  title: 'Rapport B2-1',
  tagline: 'Interventions et état des salles',
  sections,
  buildEmail: (values) =>
    buildReportEmail('B2-1', values, [
      `Nombre d'interventions: ${values.nbInterventions ?? 0}`,
      '',
      'Salles :',
      ...SALLES.map((salle) => {
        const v = values[`salle_${salle}`];
        return `- ${salle} : ${typeof v === 'string' && v.trim() ? v.trim() : 'R.A.S'}`;
      }),
    ]),
};
