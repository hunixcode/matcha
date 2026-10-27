import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Eyebrow, ProgressBar, tap } from '@/components/ui';
import { reportList } from '@/reports';
import { capitalize, formatLongDate, toIsoDate } from '@/reports/format';
import type { ReportDefinition } from '@/reports/types';
import { completion } from '@/reports/values';
import { useDrafts } from '@/store/drafts';
import { colors, fonts, radius, space } from '@/theme';

const cardThemes = [
  { bg: colors.matcha500, fg: colors.ink, sub: colors.matcha900, code: colors.ink, track: colors.matcha300, fill: colors.ink },
  { bg: colors.ink, fg: colors.paper, sub: colors.matcha300, code: colors.matcha300, track: colors.inkSoft, fill: colors.matcha500 },
];

export default function Home() {
  const insets = useSafeAreaInsets();
  const today = formatLongDate(toIsoDate(new Date()));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xxl }]}
    >
      <View style={styles.brandRow}>
        <View style={styles.brandDot} />
        <Eyebrow color={colors.ink}>Matcha · Rapports</Eyebrow>
      </View>

      <Text style={styles.title}>
        Quel rapport{'\n'}
        <Text style={styles.titleItalic}>aujourd’hui</Text> ?
      </Text>
      <Text style={styles.lede}>
        {capitalize(today)}. Choisis un modèle, remplis le formulaire, envoie le rapport par
        mail.
      </Text>

      <View style={styles.cards}>
        {reportList.map((def, index) => (
          <ReportCard key={def.id} def={def} index={index} />
        ))}
      </View>

      <View style={styles.footer}>
        <Feather name="save" size={14} color={colors.muted} />
        <Text style={styles.footerText}>Brouillons enregistrés automatiquement sur l’appareil.</Text>
      </View>
    </ScrollView>
  );
}

function ReportCard({ def, index }: { def: ReportDefinition; index: number }) {
  const { drafts } = useDrafts();
  const theme = cardThemes[index % cardThemes.length];
  const progress = completion(def, drafts[def.id]);
  const started = progress > 0.08;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir le formulaire ${def.code}`}
      onPress={() => {
        tap();
        router.push({ pathname: '/form/[type]', params: { type: def.id } });
      }}
      style={({ pressed }) => [styles.card, { backgroundColor: theme.bg, transform: [{ scale: pressed ? 0.985 : 1 }] }]}
    >
      <View style={[styles.ring, { borderColor: theme.sub }]} />
      <View style={[styles.ring, styles.ringInner, { borderColor: theme.sub }]} />

      <View style={styles.cardTop}>
        <Text style={[styles.cardIndex, { color: theme.sub }]}>{String(index + 1).padStart(2, '0')}</Text>
        <View style={[styles.cardArrow, { backgroundColor: theme.fg }]}>
          <Feather name="arrow-up-right" size={22} color={theme.bg} />
        </View>
      </View>

      <Text style={[styles.cardCode, { color: theme.code }]}>{def.code}</Text>
      <Text style={[styles.cardTitle, { color: theme.fg }]}>{def.title}</Text>
      <Text style={[styles.cardTagline, { color: theme.fg }]}>{def.tagline}</Text>

      <View style={styles.cardStatus}>
        <ProgressBar value={started ? progress : 0} track={theme.track} fill={theme.fill} />
        <Text style={[styles.cardStatusText, { color: theme.fg }]}>
          {started ? `Brouillon en cours · ${Math.round(progress * 100)} %` : 'Nouveau rapport'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: space.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.matcha500,
  },
  title: {
    marginTop: space.xl,
    fontFamily: fonts.serif,
    fontSize: 46,
    lineHeight: 50,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  titleItalic: {
    fontFamily: fonts.serifItalic,
    color: colors.matcha700,
  },
  lede: {
    marginTop: space.md,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
  },
  cards: {
    marginTop: space.xxl,
    gap: space.lg,
  },
  card: {
    borderRadius: radius.lg + 4,
    padding: space.xl,
    overflow: 'hidden',
  },
  ring: {
    position: 'absolute',
    right: -70,
    bottom: -90,
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1.5,
    opacity: 0.35,
  },
  ringInner: {
    right: -20,
    bottom: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIndex: {
    fontFamily: fonts.serifItalic,
    fontSize: 20,
  },
  cardArrow: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCode: {
    marginTop: space.lg,
    fontFamily: fonts.black,
    fontSize: 76,
    lineHeight: 80,
    letterSpacing: -3,
  },
  cardTitle: {
    marginTop: space.xs,
    fontFamily: fonts.serifBold,
    fontSize: 22,
  },
  cardTagline: {
    marginTop: space.xs,
    fontFamily: fonts.regular,
    fontSize: 14,
    opacity: 0.8,
  },
  cardStatus: {
    marginTop: space.xl,
    gap: space.sm,
  },
  cardStatusText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  footer: {
    marginTop: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
  },
});
