import { buildReportEmail, bulletList, generalSection, sendingSection } from './common';
import type { ReportDefinition, Section } from './types';

const LISTES = [
  { key: 'traites', title: 'Ordinateurs traités', placeholder: 'BUPF004' },
  { key: 'prets', title: 'Ordinateurs prêtés', placeholder: 'BUPF048' },
  { key: 'retours', title: 'Ordinateurs retours', placeholder: 'BUPF020' },
  { key: 'materiels', title: 'Matériels traités', placeholder: 'USB88' },
];

const sections: Section[] = [
  generalSection(),
  {
    key: 'interventions',
    title: 'Interventions',
    description: 'Un élément par ligne.',
    fields: [
      ...LISTES.map((l) => ({
        key: l.key,
        type: 'textarea' as const,
        label: l.title,
        placeholder: l.placeholder,
      })),
      { key: 'aidesImpressions', type: 'number', label: 'Aides impressions', min: 0, max: 999 },
      { key: 'observations', type: 'textarea', label: 'Autres observations' },
    ],
  },
  sendingSection(),
];

export const bu: ReportDefinition = {
  id: 'bu',
  code: 'BU',
  title: 'Rapport BU',
  tagline: 'Ordinateurs, matériels et aides impressions',
  sections,
  buildEmail: (values) =>
    buildReportEmail('BU', values, [
      ...LISTES.flatMap((l) => [`${l.title} :`, ...bulletList(values[l.key]), '']),
      `Aides impressions : ${values.aidesImpressions ?? 0}`,
      '',
      `Autres Observations : ${typeof values.observations === 'string' ? values.observations.trim() : ''}`,
    ]),
};
