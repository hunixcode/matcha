import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { animateLayout, Bounce, Reveal } from '@/components/motion';
import { NAVBAR_SPACE } from '@/components/NavBar';
import { Button, Eyebrow, IconButton, tap } from '@/components/ui';
import { fetchSchedules, type RoomSchedule } from '@/salles/api';
import { availabilityAt, formatHour, slotsOfDay } from '@/salles/ics';
import { colors, fonts, radius, space } from '@/theme';

const CLOCK_MS = 30_000;

export default function Salles() {
  const insets = useSafeAreaInsets();
  const [rooms, setRooms] = useState<RoomSchedule[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(Date.now);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await fetchSchedules();
      setRooms(result);
      setFailed(result.length === 0);
    } catch {
      setFailed(true);
    }
    setNow(Date.now());
  }, []);

  useEffect(() => {
    let alive = true;
    fetchSchedules()
      .then((result) => {
        if (!alive) return;
        setRooms(result);
        setFailed(result.length === 0);
        setNow(Date.now());
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), CLOCK_MS);
    return () => clearInterval(timer);
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const statuses = (rooms ?? []).map((room) => ({
    room,
    availability: room.slots ? availabilityAt(room.slots, now) : null,
  }));
  const freeCount = statuses.filter((s) => s.availability?.state === 'free').length;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + NAVBAR_SPACE }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.matcha700} colors={[colors.matcha700]} />}
    >
      <View style={styles.topBar}>
        <IconButton icon="refresh-cw" label="Actualiser" onPress={refresh} />
      </View>

      <View style={styles.hero}>
        <Eyebrow>Bâtiment B · {formatHour(now)}</Eyebrow>
        <Text style={styles.title}>Salles libres</Text>
        {rooms ? (
          <Text style={styles.tagline}>
            {freeCount} libre{freeCount > 1 ? 's' : ''} sur {rooms.length}. Tire vers le bas pour actualiser.
          </Text>
        ) : null}
      </View>

      {!rooms && !failed ? <ActivityIndicator size="large" color={colors.matcha700} style={styles.loader} /> : null}

      {failed && !rooms?.length ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Impossible de charger les emplois du temps. Vérifie ta connexion.</Text>
          <Button label="Réessayer" icon="refresh-cw" onPress={refresh} />
        </View>
      ) : null}

      <View style={styles.list}>
        {statuses.map(({ room, availability }, index) => (
          <Reveal key={room.id} index={index}>
          <RoomCard
            room={room}
            availability={availability}
            now={now}
            open={openId === room.id}
            onToggle={() => {
              tap();
              animateLayout();
              setOpenId(openId === room.id ? null : room.id);
            }}
          />
          </Reveal>
        ))}
      </View>
    </ScrollView>
  );
}

function RoomCard({
  room,
  availability,
  now,
  open,
  onToggle,
}: {
  room: RoomSchedule;
  availability: ReturnType<typeof availabilityAt> | null;
  now: number;
  open: boolean;
  onToggle: () => void;
}) {
  const busy = availability?.state === 'busy';
  const unknown = availability === null;

  let status = 'Emploi du temps indisponible';
  let detail = '';
  if (availability?.state === 'busy') {
    status = `Occupée jusqu’à ${formatHour(availability.until)}`;
    detail = availability.title;
  } else if (availability) {
    status = 'Libre';
    detail = availability.nextStart
      ? `Prochain cours à ${formatHour(availability.nextStart)}`
      : 'Aucun cours prévu';
  }

  const today = room.slots ? slotsOfDay(room.slots, now) : [];

  return (
    <Bounce scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={`${room.label} : ${status}`}
      accessibilityState={{ expanded: open }}
      onPress={onToggle}
      style={[styles.card, busy && styles.cardBusy, unknown && styles.cardUnknown]}
    >
      <View style={styles.cardRow}>
        <View style={[styles.dot, { backgroundColor: unknown ? colors.muted : busy ? colors.danger : colors.matcha500 }]} />
        <View style={styles.cardText}>
          <Text style={styles.roomName}>{room.label.replace(/_/g, ' ')}</Text>
          <Text style={[styles.status, busy && { color: colors.danger }]}>{status}</Text>
          {detail ? (
            <Text style={styles.detail} numberOfLines={open ? undefined : 1}>
              {detail}
            </Text>
          ) : null}
        </View>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.muted} />
      </View>

      {open ? (
        <View style={styles.day}>
          <Text style={styles.dayTitle}>Aujourd’hui</Text>
          {today.length === 0 ? (
            <Text style={styles.detail}>Aucun cours.</Text>
          ) : (
            today.map((slot) => (
              <View key={`${slot.start}-${slot.title}`} style={styles.slot}>
                <Text style={[styles.slotHours, slot.end <= now && styles.slotPast]}>
                  {formatHour(slot.start)} – {formatHour(slot.end)}
                </Text>
                <Text style={[styles.slotTitle, slot.end <= now && styles.slotPast]} numberOfLines={2}>
                  {slot.title}
                </Text>
              </View>
            ))
          )}
        </View>
      ) : null}
    </Bounce>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: space.lg,
    gap: space.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  hero: {
    paddingHorizontal: space.sm,
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
  loader: {
    marginTop: space.xxl,
  },
  errorBox: {
    gap: space.lg,
    padding: space.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSoft,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.danger,
  },
  list: {
    gap: space.md,
  },
  card: {
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.matcha300,
    backgroundColor: colors.matcha50,
    gap: space.md,
  },
  cardBusy: {
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  cardUnknown: {
    borderColor: colors.line,
    backgroundColor: colors.paper,
    opacity: 0.7,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  roomName: {
    fontFamily: fonts.serifBold,
    fontSize: 22,
    color: colors.ink,
  },
  status: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.matcha700,
  },
  detail: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
  },
  day: {
    gap: space.sm,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  dayTitle: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.matcha700,
  },
  slot: {
    flexDirection: 'row',
    gap: space.md,
  },
  slotHours: {
    width: 108,
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.ink,
  },
  slotTitle: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
  },
  slotPast: {
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
});
