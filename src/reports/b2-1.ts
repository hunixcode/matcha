import { buildReportEmail, generalSection, sendingSection } from './common';
import type { ReportDefinition, Section, SimpleField } from './types';
import { doneRooms } from './values';

const SALLES = ['B2-1', 'B2-2', 'B2-3', 'B2-4', 'B1-2', 'B1-3', 'COSIP'];

const SALLE_FIELDS: SimpleField[] = [
  { key: 'f1', type: 'number', label: 'Nombre de F1 appuyé', min: 0, max: 999 },
  { key: 'ecrans', type: 'number', label: 'Câbles écrans débranchés', min: 0, max: 999 },
  { key: 'clientsLegers', type: 'number', label: 'Câbles client léger débranchés', min: 0, max: 999 },
  { key: 'clim', type: 'checkbox', label: 'Climatisation allumée' },
  { key: 'portes', type: 'number', label: 'Portes ouvertes', min: 0, max: 999 },
  { key: 'observation', type: 'textarea', label: 'Observation', minLines: 3 },
];

const sections: Section[] = [
  generalSection(),
  {
    key: 'interventions',
    title: 'Interventions',
    description: 'Touche une salle pour la remplir. Seules les salles cochées « faite » apparaissent dans le rapport.',
    fields: [
      { key: 'nbInterventions', type: 'number', label: 'Nombre d’interventions', min: 0, max: 999 },
      { key: 'salles', type: 'rooms', label: 'Salles', rooms: SALLES, fields: SALLE_FIELDS },
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
  buildEmail: (values) => {
    const faites = doneRooms(values.salles);
    return buildReportEmail('B2-1', values, [
      `Nombre d'interventions: ${values.nbInterventions ?? 0}`,
      '',
      'Salles :',
      ...(faites.length === 0
        ? ['R.A.S']
        : faites.flatMap((salle) => {
            const observation = typeof salle.observation === 'string' ? salle.observation.trim() : '';
            return [
              `- ${salle.id}`,
              `   * F1 appuyé : ${salle.f1 ?? 0}`,
              `   * Câbles écrans débranchés : ${salle.ecrans ?? 0}`,
              `   * Câbles client léger débranchés : ${salle.clientsLegers ?? 0}`,
              `   * Climatisation allumée : ${salle.clim ? 'Oui' : 'Non'}`,
              `   * Portes ouvertes : ${salle.portes ?? 0}`,
              ...(observation ? [`   * Observation : ${observation}`] : []),
            ];
          })),
    ]);
  },
};
