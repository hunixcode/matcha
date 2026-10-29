import { toIsoDate } from './format';
import type { Field, FieldValue, ReportDefinition, RepeaterItem, SimpleField, Values } from './types';

export function newItemId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function defaultValue(field: Field): FieldValue {
  switch (field.type) {
    case 'date':
      return field.defaultToday ? toIsoDate(new Date()) : '';
    case 'multiselect':
      return [];
    case 'repeater':
      return [];
    case 'number':
      return field.min ?? 0;
    case 'toggle':
      return undefined;
    case 'checkbox':
      return false;
    case 'rooms':
      return field.rooms.map((room) => ({ ...emptyItem(field.fields), id: room, done: false }));
    default:
      return '';
  }
}

export function emptyItem(fields: SimpleField[]): RepeaterItem {
  const item: RepeaterItem = { id: newItemId() };
  for (const field of fields) item[field.key] = defaultValue(field) as RepeaterItem[string];
  return item;
}

function allFields(def: ReportDefinition): Field[] {
  return def.sections.flatMap((s) => s.fields);
}

export function initialValues(def: ReportDefinition, previous?: Values): Values {
  const values: Values = {};
  for (const field of allFields(def)) {
    values[field.key] =
      field.keepOnReset && previous && previous[field.key] !== undefined
        ? previous[field.key]
        : defaultValue(field);
  }
  return values;
}

/** Salles cochées « faites » d'un champ `rooms`. */
export function doneRooms(value: FieldValue): RepeaterItem[] {
  if (!Array.isArray(value)) return [];
  return (value as (string | RepeaterItem)[]).filter(
    (room): room is RepeaterItem => typeof room === 'object' && room.done === true,
  );
}

export function isEmpty(value: FieldValue): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** Clés des champs obligatoires non remplis. */
export function missingRequired(def: ReportDefinition, values: Values): string[] {
  return allFields(def)
    .filter((f) => f.required && isEmpty(values[f.key]))
    .map((f) => f.key);
}

/** Part des champs (hors nombres) qui ont été renseignés, de 0 à 1. */
export function completion(def: ReportDefinition, values: Values): number {
  const fields = allFields(def).filter((f) => f.type !== 'number' && !f.hiddenInReport);
  if (fields.length === 0) return 0;
  const filled = fields.filter((f) =>
    f.type === 'rooms' ? doneRooms(values[f.key]).length > 0 : !isEmpty(values[f.key]),
  ).length;
  return filled / fields.length;
}
