import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';

type HotelGuestPickerModalProps = {
  visible: boolean;
  adults: number;
  children: number;
  rooms: number;
  onChangeAdults: (value: number) => void;
  onChangeChildren: (value: number) => void;
  onChangeRooms: (value: number) => void;
  onClose: () => void;
};

function CounterRow({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.counterRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.counterLabel}>{label}</Text>
        {hint ? <Text style={styles.counterHint}>{hint}</Text> : null}
      </View>
      <View style={styles.controls}>
        <Pressable
          style={[styles.btn, value <= min && styles.btnDisabled]}
          onPress={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          accessibilityLabel={`Decrease ${label}`}
        >
          <Ionicons name="remove" size={16} color={Colors.dark} />
        </Pressable>
        <Text style={styles.value}>{value}</Text>
        <Pressable
          style={[styles.btn, value >= max && styles.btnDisabled]}
          onPress={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          accessibilityLabel={`Increase ${label}`}
        >
          <Ionicons name="add" size={16} color={Colors.dark} />
        </Pressable>
      </View>
    </View>
  );
}

export function HotelGuestPickerModal({
  visible,
  adults,
  children,
  rooms,
  onChangeAdults,
  onChangeChildren,
  onChangeRooms,
  onClose,
}: HotelGuestPickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>Guests & rooms</Text>
          <Text style={styles.sub}>Choose who is staying and how many rooms you need.</Text>
          <CounterRow
            label="Adults"
            hint="Age 13+"
            value={adults}
            min={1}
            max={8}
            onChange={onChangeAdults}
          />
          <CounterRow
            label="Children"
            hint="Age 0–12"
            value={children}
            min={0}
            max={6}
            onChange={onChangeChildren}
          />
          <CounterRow label="Rooms" value={rooms} min={1} max={5} onChange={onChangeRooms} />
          <Pressable style={styles.done} onPress={onClose}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11,31,51,0.45)',
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  title: { ...Typography.h3, color: Colors.primary },
  sub: { ...Typography.caption, color: Colors.muted, marginTop: -Spacing.sm },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  counterLabel: { ...Typography.bodyBold, color: Colors.dark },
  counterHint: { ...Typography.small, color: Colors.muted, marginTop: 2 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  btn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  value: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.dark,
    minWidth: 24,
    textAlign: 'center',
  },
  done: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  doneText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.white,
  },
});
