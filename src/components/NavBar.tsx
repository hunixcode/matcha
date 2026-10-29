import { Feather } from '@expo/vector-icons';
import { router, usePathname, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius, space } from '@/theme';

import { Bounce } from './motion';
import { tap, type IconName } from './ui';

const items: { href: Href; path: string; label: string; icon: IconName }[] = [
  { href: '/', path: '/', label: 'Rapports', icon: 'file-text' },
  { href: '/salles', path: '/salles', label: 'Salles', icon: 'clock' },
];

/** Hauteur à réserver en bas des écrans pour que le contenu ne passe pas sous la barre. */
export const NAVBAR_SPACE = 96;

const PADDING = 6;
const ITEM_WIDTH = 116;
const ITEM_HEIGHT = 48;

/** Barre flottante en forme de pilule, façon Dynamic Island ; la pastille de l'onglet actif glisse de l'un à l'autre. */
export function NavBar() {
  const pathname = usePathname();

  // Uniquement sur les écrans principaux, pas dans les formulaires ni le rapport.
  if (!items.some((item) => item.path === pathname)) return null;
  return <Island pathname={pathname} />;
}

function Island({ pathname }: { pathname: string }) {
  const insets = useSafeAreaInsets();
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.path === pathname),
  );
  const [enter] = useState(() => new Animated.Value(0));
  const [position] = useState(() => new Animated.Value(activeIndex));

  // Apparition douce depuis le bas à chaque retour sur un écran principal.
  useEffect(() => {
    const animation = Animated.spring(enter, { toValue: 1, stiffness: 180, damping: 22, mass: 1, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [enter]);

  // La pastille glisse jusqu'à l'onglet actif.
  useEffect(() => {
    const animation = Animated.spring(position, {
      toValue: activeIndex,
      stiffness: 260,
      damping: 28,
      mass: 1,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [position, activeIndex]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          bottom: Math.max(insets.bottom, space.md),
          opacity: enter.interpolate({ inputRange: [0, 0.5], outputRange: [0, 1], extrapolate: 'clamp' }),
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }],
        },
      ]}
    >
      <View style={styles.island}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.highlight,
            {
              transform: [
                { translateX: position.interpolate({ inputRange: [0, 1], outputRange: [0, ITEM_WIDTH] }) },
              ],
            },
          ]}
        />
        {items.map((item) => {
          const active = item.path === pathname;
          return (
            <Bounce
              key={item.path}
              scaleTo={0.92}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
              onPress={() => {
                if (active) return;
                tap();
                router.replace(item.href);
              }}
              style={styles.item}
            >
              <Feather name={item.icon} size={19} color={active ? colors.ink : colors.matcha300} />
              <Text style={[styles.label, { color: active ? colors.ink : colors.matcha300 }]}>{item.label}</Text>
            </Bounce>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  island: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: PADDING,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  highlight: {
    position: 'absolute',
    left: PADDING,
    top: PADDING,
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.matcha500,
  },
  item: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderRadius: radius.pill,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
});
