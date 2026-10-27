import { Feather } from '@expo/vector-icons';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatLongDate, parseIsoDate, toIsoDate } from '@/reports/format';
import type { Field, FieldValue, RepeaterField, RepeaterItem, SimpleField } from '@/reports/types';
import { emptyItem } from '@/reports/values';
import { colors, fonts, radius, space } from '@/theme';

import { tap } from './ui';

type FieldProps<F extends Field = Field> = {
  field: F;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  error?: boolean;
};

export function FieldInput(props: FieldProps) {
  const { field } = props;
  const control = (() => {
    switch (field.type) {
      case 'text':
      case 'textarea':
        return <TextControl {...(props as FieldProps<SimpleField>)} />;
      case 'date':
        return <PickerControl {...(props as FieldProps<SimpleField>)} />;
      case 'time':
      case 'select':
      case 'multiselect':
        return <ChipsControl {...(props as FieldProps<SimpleField>)} />;
      case 'toggle':
        return <YesNoControl {...props} />;
      case 'number':
        return <StepperControl {...(props as FieldProps<SimpleField>)} />;
      case 'repeater':
        return <RepeaterControl {...(props as FieldProps<RepeaterField>)} />;
    }
  })();

  // Le répéteur affiche ses propres intitulés : pas de libellé au-dessus.
  if (field.type === 'repeater') return control;

  return (
    <FieldShell label={field.label} required={field.required} hint={field.hint} error={props.error}>
      {control}
    </FieldShell>
  );
}

function FieldShell({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={styles.shell}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {children}
      {error ? <Text style={styles.error}>Champ obligatoire</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function TextControl({ field, value, onChange, error }: FieldProps<SimpleField>) {
  const [focused, setFocused] = useState(false);
  const multiline = field.type === 'textarea';
  const keyboard = field.type === 'text' ? field.keyboard : undefined;
  return (
    <TextInput
      value={typeof value === 'string' ? value : ''}
      onChangeText={onChange}
      placeholder={field.placeholder}
      placeholderTextColor={colors.muted}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      keyboardType={keyboard ?? 'default'}
      autoCapitalize={keyboard === 'email-address' ? 'none' : 'sentences'}
      autoCorrect={keyboard !== 'email-address'}
      cursorColor={colors.matcha700}
      selectionColor={colors.matcha300}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[
        styles.input,
        multiline && styles.textarea,
        focused && styles.inputFocused,
        error && styles.inputError,
      ]}
    />
  );
}

/** Créneaux de 30 minutes, de 7h30 à 18h. */
const TIME_SLOTS = Array.from({ length: 22 }, (_, i) => {
  const minutes = 7 * 60 + 30 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${minutes % 60 === 0 ? '00' : '30'}`;
});

function PickerControl({ field, value, onChange, error }: FieldProps<SimpleField>) {
  const text = typeof value === 'string' ? value : '';

  // Hors Android (aperçu web), saisie libre au format de stockage.
  if (Platform.OS !== 'android') {
    return (
      <TextInput
        value={text}
        onChangeText={onChange}
        placeholder="AAAA-MM-JJ"
        placeholderTextColor={colors.muted}
        style={[styles.input, error && styles.inputError]}
      />
    );
  }

  const open = () => {
    const current = parseIsoDate(text) ?? new Date();
    DateTimePickerAndroid.open({
      value: current,
      mode: 'date',
      is24Hour: true,
      design: 'material',
      title: field.label,
      positiveButton: { label: 'Valider', textColor: colors.matcha700 },
      negativeButton: { label: 'Annuler', textColor: colors.muted },
      onValueChange: (_event, date) => onChange(toIsoDate(date)),
    });
  };

  const display = text ? formatLongDate(text) : 'Choisir une date';

  return (
    <View style={styles.pickerRow}>
      <Pressable
        onPress={open}
        style={({ pressed }) => [styles.input, styles.picker, pressed && styles.inputFocused, error && styles.inputError]}
      >
        <Feather name="calendar" size={18} color={colors.matcha700} />
        <Text style={[styles.pickerText, !text && { color: colors.muted }]} numberOfLines={1}>
          {display}
        </Text>
        {text && !field.required ? (
          <Pressable hitSlop={10} onPress={() => onChange('')} accessibilityLabel="Effacer">
            <Feather name="x" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </Pressable>
    </View>
  );
}

function ChipsControl({ field, value, onChange }: FieldProps<SimpleField>) {
  if (field.type !== 'select' && field.type !== 'multiselect' && field.type !== 'time') return null;
  const options = field.type === 'time' ? TIME_SLOTS : field.options;
  const multi = field.type === 'multiselect';
  const selected: string[] = multi ? ((value as string[] | undefined) ?? []) : value ? [String(value)] : [];

  const toggle = (option: string) => {
    tap();
    if (multi) {
      onChange(selected.includes(option) ? selected.filter((o) => o !== option) : [...selected, option]);
    } else {
      onChange(selected.includes(option) ? '' : option);
    }
  };

  return (
    <View style={styles.chips}>
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <Pressable
            key={option}
            onPress={() => toggle(option)}
            accessibilityRole={multi ? 'checkbox' : 'radio'}
            accessibilityState={{ checked: active }}
            style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && !active && styles.chipPressed]}
          >
            {active && multi ? <Feather name="check" size={14} color={colors.paper} /> : null}
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function YesNoControl({ value, onChange }: FieldProps) {
  const choices: { label: string; value: boolean; bg: string }[] = [
    { label: 'Oui', value: true, bg: colors.matcha700 },
    { label: 'Non', value: false, bg: colors.ink },
  ];
  return (
    <View style={styles.segment}>
      {choices.map((choice) => {
        const active = value === choice.value;
        return (
          <Pressable
            key={choice.label}
            onPress={() => {
              tap();
              onChange(active ? undefined : choice.value);
            }}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            style={[styles.segmentItem, active && { backgroundColor: choice.bg }]}
          >
            <Text style={[styles.segmentText, active && { color: colors.paper }]}>{choice.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function StepperControl({ field, value, onChange }: FieldProps<SimpleField>) {
  const min = field.type === 'number' ? (field.min ?? 0) : 0;
  const max = field.type === 'number' ? (field.max ?? 9999) : 9999;
  const current = typeof value === 'number' ? value : min;
  const set = (next: number) => {
    tap();
    onChange(Math.max(min, Math.min(max, next)));
  };
  return (
    <View style={styles.stepper}>
      <Pressable onPress={() => set(current - 1)} style={styles.stepperButton} accessibilityLabel="Diminuer">
        <Feather name="minus" size={20} color={colors.ink} />
      </Pressable>
      <TextInput
        value={String(current)}
        onChangeText={(t) => {
          const n = parseInt(t.replace(/\D/g, ''), 10);
          onChange(Number.isNaN(n) ? min : Math.max(min, Math.min(max, n)));
        }}
        keyboardType="number-pad"
        selectTextOnFocus
        style={styles.stepperValue}
      />
      <Pressable
        onPress={() => set(current + 1)}
        style={[styles.stepperButton, styles.stepperButtonPlus]}
        accessibilityLabel="Augmenter"
      >
        <Feather name="plus" size={20} color={colors.paper} />
      </Pressable>
    </View>
  );
}

function RepeaterControl({ field, value, onChange }: FieldProps<RepeaterField>) {
  const items = (value as RepeaterItem[] | undefined) ?? [];

  const update = (id: string, key: string, next: FieldValue) =>
    onChange(items.map((item) => (item.id === id ? { ...item, [key]: next as RepeaterItem[string] } : item)));

  return (
    <View style={styles.repeater}>
      {items.length === 0 ? <Text style={styles.empty}>Aucun {field.itemLabel.toLowerCase()} pour l’instant.</Text> : null}
      {items.map((item, index) => (
        <View key={item.id} style={styles.repeaterItem}>
          <View style={styles.repeaterHeader}>
            <Text style={styles.repeaterTitle}>
              {field.itemLabel} <Text style={styles.repeaterIndex}>{String(index + 1).padStart(2, '0')}</Text>
            </Text>
            <Pressable
              hitSlop={10}
              accessibilityLabel={`Supprimer ${field.itemLabel.toLowerCase()} ${index + 1}`}
              onPress={() => {
                tap('warning');
                onChange(items.filter((i) => i.id !== item.id));
              }}
            >
              <Feather name="trash-2" size={18} color={colors.danger} />
            </Pressable>
          </View>
          {field.fields.map((sub) => (
            <FieldInput key={sub.key} field={sub} value={item[sub.key]} onChange={(v) => update(item.id, sub.key, v)} />
          ))}
        </View>
      ))}
      <Pressable
        onPress={() => {
          tap();
          onChange([...items, emptyItem(field.fields)]);
        }}
        style={({ pressed }) => [styles.addButton, pressed && { backgroundColor: colors.matcha100 }]}
      >
        <Feather name="plus" size={18} color={colors.matcha700} />
        <Text style={styles.addButtonText}>{field.addLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    gap: space.sm,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.ink,
  },
  required: {
    color: colors.matcha700,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.danger,
  },
  input: {
    minHeight: 52,
    backgroundColor: colors.paper,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.sm + 2,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
  },
  textarea: {
    minHeight: 112,
    paddingTop: space.md,
  },
  inputFocused: {
    borderColor: colors.matcha500,
    backgroundColor: colors.matcha50,
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  picker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  pickerText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  chipActive: {
    backgroundColor: colors.matcha700,
    borderColor: colors.matcha700,
  },
  chipPressed: {
    backgroundColor: colors.matcha50,
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
  },
  chipTextActive: {
    color: colors.paper,
  },
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: radius.pill,
  },
  segmentText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.ink,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.sm,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonPlus: {
    backgroundColor: colors.ink,
  },
  stepperValue: {
    width: 80,
    textAlign: 'center',
    fontFamily: fonts.serifBold,
    fontSize: 28,
    color: colors.ink,
    paddingVertical: 4,
  },
  repeater: {
    gap: space.md,
  },
  empty: {
    fontFamily: fonts.serifItalic,
    fontSize: 16,
    color: colors.muted,
  },
  repeaterItem: {
    gap: space.lg,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.matcha50,
    borderWidth: 1,
    borderColor: colors.matcha100,
  },
  repeaterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  repeaterTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 18,
    color: colors.ink,
  },
  repeaterIndex: {
    fontFamily: fonts.serifItalic,
    color: colors.matcha700,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: 52,
    borderRadius: radius.sm + 2,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.matcha500,
  },
  addButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.matcha700,
  },
});
