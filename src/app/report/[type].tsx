import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as MailComposer from 'expo-mail-composer';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomBar, Button, Eyebrow, IconButton, tap } from '@/components/ui';
import { getReport } from '@/reports';
import type { Email } from '@/reports/types';
import { useDrafts } from '@/store/drafts';
import { colors, fonts, radius, space } from '@/theme';

function mailtoUrl({ to, cc, subject, body }: Email): string {
  const params = [`subject=${encodeURIComponent(subject)}`, `body=${encodeURIComponent(body)}`];
  if (cc.length) params.unshift(`cc=${encodeURIComponent(cc.join(','))}`);
  return `mailto:${to.map(encodeURIComponent).join(',')}?${params.join('&')}`;
}

export default function ReportScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const def = getReport(type);
  const insets = useSafeAreaInsets();
  const { drafts, reset } = useDrafts();
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const email = useMemo(() => (def ? def.buildEmail(drafts[def.id]) : null), [def, drafts]);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  if (!def || !email) return <Redirect href="/" />;

  const send = async () => {
    try {
      if (await MailComposer.isAvailableAsync()) {
        await MailComposer.composeAsync({
          recipients: email.to,
          ccRecipients: email.cc,
          subject: email.subject,
          body: email.body,
        });
      } else {
        await Linking.openURL(mailtoUrl(email));
      }
      setSent(true);
    } catch {
      Alert.alert('Aucune application mail', 'Copie le rapport ou partage-le avec une autre application.');
    }
  };

  const copy = async () => {
    await Clipboard.setStringAsync(`${email.subject}\n\n${email.body}`);
    tap('success');
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  const share = () => Share.share({ title: email.subject, message: email.body }).catch(() => {});

  const startNew = () => {
    reset(def.id);
    router.dismissTo('/');
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + space.md }]}>
        <View style={styles.topBar}>
          <IconButton icon="arrow-left" label="Modifier le formulaire" onPress={() => router.back()} />
          <IconButton icon="home" label="Accueil" onPress={() => router.dismissTo('/')} />
        </View>

        <View style={styles.hero}>
          <Eyebrow>Aperçu · {def.code}</Eyebrow>
          <Text style={styles.title}>
            Rapport <Text style={styles.titleItalic}>prêt</Text>.
          </Text>
        </View>

        <View style={styles.envelope}>
          <MetaRow label="À" value={email.to.join(', ')} placeholder="à choisir dans l’appli mail" />
          {email.cc.length ? <MetaRow label="Cc" value={email.cc.join(', ')} /> : null}
          <MetaRow label="Objet" value={email.subject} last />
        </View>

        <View style={styles.paper}>
          <Text selectable style={styles.body}>
            {email.body}
          </Text>
        </View>

        {sent ? (
          <View style={styles.sentCard}>
            <Feather name="check-circle" size={20} color={colors.matcha700} />
            <View style={styles.sentTextWrap}>
              <Text style={styles.sentTitle}>Mail préparé</Text>
              <Text style={styles.sentText}>Une fois envoyé, tu peux vider le formulaire pour le prochain rapport.</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <BottomBar bottomInset={insets.bottom}>
        {sent ? (
          <Button label="Nouveau rapport" icon="plus" variant="dark" onPress={startNew} />
        ) : (
          <Button label="Envoyer par mail" icon="send" onPress={send} />
        )}
        <View style={styles.secondary}>
          <Button
            label={copied ? 'Copié' : 'Copier'}
            icon={copied ? 'check' : 'copy'}
            variant="outline"
            onPress={copy}
            style={styles.secondaryButton}
          />
          <Button label="Partager" icon="share-2" variant="outline" onPress={share} style={styles.secondaryButton} />
        </View>
      </BottomBar>
    </View>
  );
}

function MetaRow({ label, value, placeholder, last }: { label: string; value: string; placeholder?: string; last?: boolean }) {
  return (
    <View style={[styles.metaRow, !last && styles.metaRowBorder]}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={[styles.metaValue, !value && styles.metaPlaceholder]}>{value || placeholder}</Text>
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
    gap: space.sm,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 40,
    lineHeight: 44,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  titleItalic: {
    fontFamily: fonts.serifItalic,
    color: colors.matcha700,
  },
  envelope: {
    backgroundColor: colors.matcha100,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
  },
  metaRow: {
    flexDirection: 'row',
    gap: space.md,
    paddingVertical: space.md,
  },
  metaRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.matcha300,
  },
  metaLabel: {
    width: 48,
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.matcha900,
    paddingTop: 2,
  },
  metaValue: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
  },
  metaPlaceholder: {
    fontFamily: fonts.serifItalic,
    color: colors.matcha900,
  },
  paper: {
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    padding: space.xl,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopWidth: 4,
    borderTopColor: colors.matcha500,
  },
  body: {
    fontFamily: fonts.serif,
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
  },
  sentCard: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.matcha50,
    borderWidth: 1,
    borderColor: colors.matcha300,
  },
  sentTextWrap: {
    flex: 1,
    gap: 2,
  },
  sentTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  sentText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  secondary: {
    flexDirection: 'row',
    gap: space.sm,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
  },
});
