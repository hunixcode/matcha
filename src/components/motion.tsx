import { useEffect, useState, type ReactNode } from 'react';
import {
  Animated,
  LayoutAnimation,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

/** À appeler juste avant un changement de mise en page : les éléments se déplacent avec un ressort. */
export function animateLayout() {
  LayoutAnimation.configureNext({
    duration: 420,
    create: { type: 'easeInEaseOut', property: 'opacity' },
    update: { type: 'spring', springDamping: 0.92 },
    delete: { type: 'easeInEaseOut', property: 'opacity' },
  });
}

type BounceProps = PressableProps & {
  /** Style du conteneur animé (position, flex, largeur…) ; le style de `Pressable` reste sur le bouton. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Échelle atteinte pendant l'appui. */
  scaleTo?: number;
};

/** Pressable qui s'enfonce à l'appui puis rebondit au relâchement. */
export function Bounce({ containerStyle, scaleTo = 0.93, onPressIn, onPressOut, ...rest }: BounceProps) {
  const [scale] = useState(() => new Animated.Value(1));

  const to = (value: number, speed: number, bounciness: number) =>
    Animated.spring(scale, { toValue: value, speed, bounciness, useNativeDriver: true }).start();

  return (
    <Animated.View style={[containerStyle, { transform: [{ scale }] }]}>
      <Pressable
        {...rest}
        onPressIn={(e: GestureResponderEvent) => {
          to(scaleTo, 60, 0);
          onPressIn?.(e);
        }}
        onPressOut={(e: GestureResponderEvent) => {
          to(1, 22, 3);
          onPressOut?.(e);
        }}
      />
    </Animated.View>
  );
}

/** Apparition en fondu, glissée vers le haut avec un petit rebond ; `index` décale les éléments d'une liste. */
export function Reveal({
  index = 0,
  children,
  style,
}: {
  index?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.spring(progress, {
      toValue: 1,
      delay: Math.min(index, 8) * 70,
      friction: 10,
      tension: 80,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, index]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' }),
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Surgit de l'échelle 0 avec rebond à l'affichage (coche, libellé d'onglet…). */
export function Pop({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const [scale] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.spring(scale, { toValue: 1, friction: 9, tension: 180, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [scale]);

  return <Animated.View style={[style, { opacity: scale.interpolate({ inputRange: [0, 0.5], outputRange: [0, 1], extrapolate: 'clamp' }), transform: [{ scale }] }]}>{children}</Animated.View>;
}
