import { Calendar, ChevronRight, MapPin, Moon, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { PlaceAutocompleteSelect } from '@/components/ui/PlaceAutocompleteSelect';
import { Colors, useThemeColors } from '@/constants/colors';
import { POPULAR_DESTINATIONS } from '@/constants/destinations';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import { useHotelStore } from '@/store/hotelStore';
import { formatDate } from '@/utils/formatDate';
import { calculateNights } from '@/utils/hotelPricing';
import { HotelGuestPickerModal } from './HotelGuestPickerModal';

interface HotelSearchCardProps {
  onSearch: () => void;
  showGuestControls?: boolean;
  embedded?: boolean;
  showCta?: boolean;
}

function Field({
  icon,
  label,
  value,
  onPress,
  compact,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress: () => void;
  compact?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.field,
        compact && styles.fieldCompact,
        { backgroundColor: colors.inputBg },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={[styles.fieldIcon, { backgroundColor: colors.card }]}>{icon}</View>
      <View style={styles.fieldCopy}>
        <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
        <Text style={[styles.fieldValue, { color: colors.dark }]} numberOfLines={1}>
          {value || 'Select'}
        </Text>
      </View>
      <ChevronRight size={16} color={colors.mutedLight} strokeWidth={2} />
    </Pressable>
  );
}

export function HotelSearchCard({ onSearch, embedded = false, showCta = true }: HotelSearchCardProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const {
    destination,
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    setDestination,
    setCheckIn,
    setCheckOut,
    setAdults,
    setChildren,
    setRooms,
  } = useHotelStore();

  const [showDestination, setShowDestination] = useState(false);
  const [showGuests, setShowGuests] = useState(false);
  const [dateMode, setDateMode] = useState<'in' | 'out' | null>(null);

  const citySuggestions = useMemo(
    () => POPULAR_DESTINATIONS.map((dest) => dest.name),
    []
  );

  const nights = calculateNights(checkIn, checkOut);
  const guestLabel =
    children > 0
      ? `${adults + children} guests · ${rooms} room${rooms > 1 ? 's' : ''}`
      : `${adults} adult${adults > 1 ? 's' : ''} · ${rooms} room${rooms > 1 ? 's' : ''}`;

  return (
    <View
      style={[
        styles.card,
        embedded && styles.embedded,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.intentHint, { color: colors.muted }]}>
        Stay when you arrive · place, dates & rooms
      </Text>

      <Field
        icon={<MapPin size={16} color={colors.primary} strokeWidth={2} />}
        label="Where are you going?"
        value={destination || 'Search destination'}
        onPress={() => setShowDestination(true)}
      />

      <View style={styles.metaRow}>
        <View style={styles.metaCell}>
          <Field
            compact
            icon={<Calendar size={16} color={colors.primary} strokeWidth={2} />}
            label="Check-in"
            value={formatDate(checkIn, false)}
            onPress={() => setDateMode('in')}
          />
        </View>
        <View style={styles.metaGap} />
        <View style={styles.metaCell}>
          <Field
            compact
            icon={<Calendar size={16} color={colors.action} strokeWidth={2} />}
            label="Check-out"
            value={formatDate(checkOut, false)}
            onPress={() => setDateMode('out')}
          />
        </View>
      </View>

      <View style={styles.nightsRow}>
        <View style={[styles.nightsPill, { backgroundColor: colors.actionSoft }]}>
          <Moon size={13} color={colors.action} strokeWidth={2.2} />
          <Text style={[styles.nightsText, { color: colors.action }]}>
            {nights} night{nights === 1 ? '' : 's'}
          </Text>
        </View>
        <Text style={[styles.nightsSub, { color: colors.muted }]}>Stay length from your dates</Text>
      </View>

      <Field
        icon={<Users size={16} color={colors.primary} strokeWidth={2} />}
        label="Guests & rooms"
        value={guestLabel}
        onPress={() => setShowGuests(true)}
      />

      {showCta ? <Button title="Search hotels" onPress={onSearch} style={styles.cta} /> : null}

      <Modal
        visible={showDestination}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDestination(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setShowDestination(false)} />
          <View
            style={[
              styles.sheet,
              { paddingBottom: insets.bottom + Spacing.lg, backgroundColor: colors.card },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.primary }]}>Destination</Text>
            <PlaceAutocompleteSelect
              label="Search place"
              leftIcon="location-outline"
              placeholder="Hunza, Gilgit, Skardu…"
              value={destination}
              suggestions={citySuggestions}
              onChange={(name) => {
                setDestination(name);
                setShowDestination(false);
              }}
              hint="City, town, or tourist area"
            />
            <Pressable style={styles.closeBtn} onPress={() => setShowDestination(false)}>
              <Text style={[styles.closeText, { color: colors.muted }]}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <HotelGuestPickerModal
        visible={showGuests}
        adults={adults}
        children={children}
        rooms={rooms}
        onChangeAdults={setAdults}
        onChangeChildren={setChildren}
        onChangeRooms={setRooms}
        onClose={() => setShowGuests(false)}
      />

      <DatePickerModal
        visible={dateMode === 'in'}
        title="Check-in"
        value={checkIn}
        minimumDate={new Date()}
        onChange={(date) => {
          setCheckIn(date);
          if (new Date(date) >= new Date(checkOut)) {
            const next = new Date(date);
            next.setDate(next.getDate() + 1);
            setCheckOut(next.toISOString().slice(0, 10));
          }
        }}
        onClose={() => setDateMode(null)}
      />
      <DatePickerModal
        visible={dateMode === 'out'}
        title="Check-out"
        value={checkOut}
        minimumDate={new Date(checkIn)}
        onChange={setCheckOut}
        onClose={() => setDateMode(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.float,
  },
  embedded: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadows.float,
  },
  intentHint: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.muted,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  metaCell: { flex: 1 },
  metaGap: { width: Spacing.sm },
  nightsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: 2,
  },
  nightsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.actionSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  nightsText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.action,
  },
  nightsSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
    flex: 1,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.md,
  },
  fieldCompact: {
    minHeight: 44,
    paddingVertical: 6,
  },
  fieldIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  fieldCopy: {
    flex: 1,
    minWidth: 0,
    marginRight: 4,
  },
  fieldLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.muted,
  },
  fieldValue: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.dark,
    marginTop: 1,
  },
  cta: {
    marginTop: Spacing.xs,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  sheetTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    color: Colors.primary,
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  closeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.muted,
  },
});
