import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';

type PassengerPickerProps = {
  visible: boolean;
  value: number;
  min?: number;
  max?: number;
  onChange: (count: number) => void;
  onClose: () => void;
};

export function PassengerPicker({
  visible,
  value,
  min = 1,
  max = 8,
  onChange,
  onClose,
}: PassengerPickerProps) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>Passengers</Text>
          <Text style={styles.sub}>How many seats do you need?</Text>
          <View style={styles.grid}>
            {options.map((count) => {
              const active = count === value;
              return (
                <Pressable
                  key={count}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => {
                    onChange(count);
                    onClose();
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.optionNum, active && styles.optionNumActive]}>{count}</Text>
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                    {count === 1 ? 'seat' : 'seats'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelText}>Cancel</Text>
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
    paddingHorizontal: Spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    padding: Spacing.xl,
    gap: Spacing.md,
    zIndex: 1,
  },
  title: {
    ...Typography.h2,
    color: Colors.primary,
    textAlign: 'center',
  },
  sub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  option: {
    width: '22%',
    minWidth: 64,
    aspectRatio: 1,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  optionActive: {
    borderColor: Colors.action,
    backgroundColor: Colors.actionSoft,
  },
  optionNum: {
    fontFamily: Fonts.bodyBold,
    fontSize: 22,
    color: Colors.dark,
  },
  optionNumActive: { color: Colors.actionDark },
  optionLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
  },
  optionLabelActive: { color: Colors.actionDark },
  cancel: {
    alignSelf: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  cancelText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.muted,
  },
});
