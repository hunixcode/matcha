import { formatLongDate } from './format';
import { isEmpty } from './values';
import type { FieldValue, RepeaterItem, Section, SimpleField, Values } from './types';

const RULE = '────────────────────────';

export function formatValue(field: SimpleField, value: FieldValue): string {
  if (isEmpty(value)) return '';
  switch (field.type) {
    case 'date':
      return formatLongDate(String(value));
    case 'toggle':
      return value ? 'Oui' : 'Non';
    case 'multiselect':
      return (value as string[]).join(', ');
    default:
      return String(value);
  }
}

function renderField(field: SimpleField, value: FieldValue, indent = ''): string[] {
  const text = formatValue(field, value);
  if (!text) return [];
  if (field.type === 'textarea') {
    return [`${indent}${field.label} :`, ...text.split('\n').map((line) => `${indent}${line}`)];
  }
  if (field.type === 'multiselect') {
    return [`${indent}${field.label} :`, ...(value as string[]).map((v) => `${indent}  • ${v}`)];
  }
  return [`${indent}${field.label} : ${text}`];
}

function renderSection(section: Section, values: Values): string[] {
  const lines: string[] = [];
  for (const field of section.fields) {
    if (field.hiddenInReport) continue;
    const value = values[field.key];
    if (field.type === 'repeater') {
      const items = (value as RepeaterItem[] | undefined) ?? [];
      items.forEach((item, index) => {
        const body = field.fields.flatMap((sub) => renderField(sub, item[sub.key], '   '));
        if (body.length === 0) return;
        lines.push(`${field.itemLabel} ${index + 1}`, ...body, '');
      });
    } else {
      lines.push(...renderField(field, value));
    }
  }
  while (lines[lines.length - 1] === '') lines.pop();
  if (lines.length === 0) return [];
  return [section.title.toUpperCase(), RULE, ...lines, ''];
}

/** Rendu générique : chaque section non vide devient un bloc « TITRE / champ : valeur ». */
export function renderSections(sections: Section[], values: Values): string {
  return sections
    .flatMap((section) => renderSection(section, values))
    .join('\n')
    .trimEnd();
}
