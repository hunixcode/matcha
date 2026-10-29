import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ComponentProps, ReactNode } from 'react';
import { Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, radius, space } from '@/theme';

import { Bounce } from './motion';

export type IconName = ComponentProps<typeof Feather>['name'];

/** Retour haptique léger ; silencieux là où il n'est pas disponible (web). */
export function tap(kind: 'selection' | 'success' | 'warning' = 'selection') {
  if (Platform.OS === 'web') return;
  const run =
    kind === 'selection'
      ? Haptics.selectionAsync()
      : Haptics.notificationAsync(
          kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
        );
  run.catch(() => {});
}

type ButtonVariant = 'primary' | 'dark' | 'outline';

const buttonTheme: Record<ButtonVariant, { bg: string; fg: string; border: string; pressed: string }> = {
  primary: { bg: colors.matcha700, fg: colors.paper, border: colors.matcha700, pressed: colors.matcha900 },
  dark: { bg: colors.ink, fg: colors.paper, border: colors.ink, pressed: colors.inkSoft },
  outline: { bg: colors.paper, fg: colors.ink, border: colors.ink, pressed: colors.matcha50 },
};

export function Button({
  label,
  onPress,
  icon,
  variant = 'primary',
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = buttonTheme[variant];
  return (
    <Bounce scaleTo={0.96} containerStyle={style}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? theme.pressed : theme.bg, borderColor: theme.border },
        style,
      ]}
    >
      <Text style={[styles.buttonLabel, { color: theme.fg }]}>{label}</Text>
      {icon ? <Feather name={icon} size={18} color={theme.fg} /> : null}
    </Bounce>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  tone = 'light',
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';
  return (
    <Bounce scaleTo={0.86}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: dark ? colors.ink : pressed ? colors.matcha100 : colors.paper,
          borderColor: dark ? colors.ink : colors.line,
        },
      ]}
    >
      <Feather name={icon} size={20} color={dark ? colors.paper : colors.ink} />
    </Bounce>
  );
}

export function Eyebrow({ children, color = colors.matcha700 }: { children: ReactNode; color?: string }) {
  return <Text style={[styles.eyebrow, { color }]}>{children}</Text>;
}

export function ProgressBar({ value, track = colors.matcha100, fill = colors.matcha700 }: { value: number; track?: string; fill?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={[styles.progressTrack, { backgroundColor: track }]}>
      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: fill }]} />
    </View>
  );
}

/** Barre d'actions collée en bas de l'écran. */
export function BottomBar({ children, bottomInset }: { children: ReactNode; bottomInset: number }) {
  return <View style={[styles.bottomBar, { paddingBottom: Math.max(bottomInset, space.lg) }]}>{children}</View>;
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  buttonLabel: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  bottomBar: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    gap: space.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
