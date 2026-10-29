export type ReportId = 'b2-1' | 'bu';

type FieldBase = {
  key: string;
  label: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  /** Conservé quand on vide le formulaire (nom du rédacteur, destinataires…). */
  keepOnReset?: boolean;
  /** Exclu du corps du rapport (ex. destinataires). */
  hiddenInReport?: boolean;
};

export type TextField = FieldBase & {
  type: 'text';
  keyboard?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
};
export type TextAreaField = FieldBase & { type: 'textarea'; minLines?: number };
export type DateField = FieldBase & { type: 'date'; defaultToday?: boolean };
export type TimeField = FieldBase & { type: 'time' };
export type SelectField = FieldBase & { type: 'select'; options: string[] };
export type MultiSelectField = FieldBase & { type: 'multiselect'; options: string[] };
export type ToggleField = FieldBase & { type: 'toggle' };
export type NumberField = FieldBase & { type: 'number'; min?: number; max?: number };
export type CheckboxField = FieldBase & { type: 'checkbox' };

export type SimpleField =
  | TextField
  | TextAreaField
  | DateField
  | TimeField
  | SelectField
  | MultiSelectField
  | ToggleField
  | NumberField
  | CheckboxField;

export type RepeaterField = FieldBase & {
  type: 'repeater';
  itemLabel: string;
  addLabel: string;
  fields: SimpleField[];
};

/**
 * Une case par salle, qui ouvre un sous-formulaire. Valeur : un élément par salle
 * (`id` = nom de la salle, `done` = salle faite). Seules les salles faites vont dans le rapport.
 */
export type RoomsField = FieldBase & {
  type: 'rooms';
  rooms: string[];
  fields: SimpleField[];
};

export type Field = SimpleField | RepeaterField | RoomsField;

export type Section = {
  key: string;
  title: string;
  description?: string;
  fields: Field[];
};

export type RepeaterItem = { id: string; [key: string]: SimpleValue };
export type SimpleValue = string | number | boolean | string[] | undefined;
export type FieldValue = SimpleValue | RepeaterItem[];
export type Values = Record<string, FieldValue>;

export type Email = {
  subject: string;
  body: string;
  to: string[];
  cc: string[];
};

export type ReportDefinition = {
  id: ReportId;
  code: string;
  title: string;
  tagline: string;
  sections: Section[];
  buildEmail: (values: Values) => Email;
};
