import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, useIsDarkMode } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { formatDate, toISODate } from '@/utils/formatDate';

type DatePickerModalProps = {
  visible: boolean;
  title?: string;
  value: string;
  minimumDate?: Date;
  onChange: (isoDate: string) => void;
  onClose: () => void;
};

function parseISODateLocal(value: string) {
  if (!value) return new Date();
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) {
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
  }
  return new Date(y, m - 1, d);
}

/**
 * Centered popup date picker — same presentation pattern as PassengerPicker.
 * iOS: spinner inside modal. Android: native dialog when opened.
 */
export function DatePickerModal({
  visible,
  title = 'Select date',
  value,
  minimumDate,
  onChange,
  onClose,
}: DatePickerModalProps) {
  const minDate = minimumDate ?? new Date();
  const [draft, setDraft] = useState(() => parseISODateLocal(value));
  const darkMode = useIsDarkMode();

  useEffect(() => {
    if (visible) setDraft(parseISODateLocal(value));
  }, [visible, value]);

  const onPick = (_: unknown, selected?: Date) => {
    if (Platform.OS === 'android') {
      onClose();
      if (selected) onChange(toISODate(selected));
      return;
    }
    if (selected) setDraft(selected);
  };

  const onConfirm = () => {
    onChange(toISODate(draft));
    onClose();
  };

  if (Platform.OS === 'android') {
    if (!visible) return null;
    return (
      <DateTimePicker
        value={parseISODateLocal(value)}
        mode="date"
        minimumDate={minDate}
        display="default"
        onChange={onPick}
      />
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>{formatDate(toISODate(draft), false)}</Text>

          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={draft}
              mode="date"
              minimumDate={minDate}
              display="spinner"
              themeVariant={darkMode ? 'dark' : 'light'}
              onChange={onPick}
              style={styles.spinner}
            />
          </View>

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={styles.doneBtn}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
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
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
    zIndex: 1,
    maxHeight: '78%',
  },
  title: {
    ...Typography.h2,
    color: Colors.primary,
    textAlign: 'center',
  },
  sub: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.action,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  pickerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  spinner: {
    width: '100%',
    height: 196,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceSecondary,
  },
  cancelText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.muted,
  },
  doneBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.action,
  },
  doneText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.white,
  },
});
