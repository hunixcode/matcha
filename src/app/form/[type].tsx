import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FieldInput } from '@/components/fields';
import { BottomBar, Button, Eyebrow, IconButton, ProgressBar, tap } from '@/components/ui';
import { getReport } from '@/reports';
import { completion, missingRequired } from '@/reports/values';
import { useDrafts } from '@/store/drafts';
import { colors, fonts, radius, space } from '@/theme';

export default function FormScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const def = getReport(type);
  const insets = useSafeAreaInsets();
  const { drafts, setField, reset } = useDrafts();
  const [showErrors, setShowErrors] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const sectionY = useRef<Record<string, number>>({});

  if (!def) return <NotFound />;

  const values = drafts[def.id];
  const missing = missingRequired(def, values);
  const progress = completion(def, values);

  const generate = () => {
    if (missing.length > 0) {
      setShowErrors(true);
      tap('warning');
      const first = def.sections.find((s) => s.fields.some((f) => missing.includes(f.key)));
      if (first) scrollRef.current?.scrollTo({ y: Math.max(0, (sectionY.current[first.key] ?? 0) - space.lg), animated: true });
      return;
    }
    tap('success');
    router.push({ pathname: '/report/[type]', params: { type: def.id } });
  };

  const confirmReset = () =>
    Alert.alert(
      'Vider le formulaire ?',
      'Les champs seront effacés. Les destinataires sont conservés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vider',
          style: 'destructive',
          onPress: () => {
            reset(def.id);
            setShowErrors(false);
            scrollRef.current?.scrollTo({ y: 0, animated: true });
          },
        },
      ],
    );

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space.md }]}
      >
        <View style={styles.topBar}>
          <IconButton icon="arrow-left" label="Retour" onPress={() => router.back()} />
          <IconButton icon="rotate-ccw" label="Vider le formulaire" onPress={confirmReset} />
        </View>

        <View style={styles.hero}>
          <Eyebrow>Formulaire</Eyebrow>
          <Text style={styles.title}>{def.title}</Text>
          <Text style={styles.tagline}>{def.tagline}</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <ProgressBar value={progress} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress * 100)} %</Text>
          </View>
        </View>

        {def.sections.map((section, index) => (
          <View
            key={section.key}
            style={styles.section}
            onLayout={(e) => {
              sectionY.current[section.key] = e.nativeEvent.layout.y;
            }}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIndex}>{String(index + 1).padStart(2, '0')}</Text>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            {section.description ? <Text style={styles.sectionDescription}>{section.description}</Text> : null}
            <View style={styles.fields}>
              {section.fields.map((field) => (
                <FieldInput
                  key={field.key}
                  field={field}
                  value={values[field.key]}
                  onChange={(v) => setField(def.id, field.key, v)}
                  error={showErrors && missing.includes(field.key)}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <BottomBar bottomInset={insets.bottom}>
        {showErrors && missing.length > 0 ? (
          <Text style={styles.missing}>
            {missing.length === 1 ? '1 champ obligatoire manquant' : `${missing.length} champs obligatoires manquants`}
          </Text>
        ) : null}
        <Button label="Générer le rapport" icon="arrow-right" onPress={generate} />
      </BottomBar>
    </KeyboardAvoidingView>
  );
}

function NotFound() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, styles.notFound, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Rapport introuvable</Text>
      <Button label="Retour à l’accueil" icon="home" onPress={() => router.replace('/')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xxl,
    gap: space.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hero: {
    paddingHorizontal: space.sm,
    paddingTop: space.sm,
    paddingBottom: space.sm,
    gap: space.sm,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 40,
    lineHeight: 44,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.muted,
  },
  progressRow: {
    marginTop: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  progressBar: {
    flex: 1,
  },
  progressText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.matcha700,
    minWidth: 40,
    textAlign: 'right',
  },
  section: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    padding: space.xl,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.md,
  },
  sectionIndex: {
    fontFamily: fonts.black,
    fontSize: 14,
    color: colors.matcha500,
    letterSpacing: 1,
  },
  sectionTitle: {
    flex: 1,
    fontFamily: fonts.serifBold,
    fontSize: 24,
    color: colors.ink,
  },
  sectionDescription: {
    marginTop: space.xs,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },
  fields: {
    marginTop: space.xl,
    gap: space.xl,
  },
  missing: {
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.danger,
  },
  notFound: {
    padding: space.xl,
    gap: space.xl,
    justifyContent: 'center',
  },
});
