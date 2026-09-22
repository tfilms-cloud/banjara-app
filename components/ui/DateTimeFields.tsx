import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors, useIsDarkMode } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { formatDate, toISODate } from '@/utils/formatDate';

function parseISODateLocal(value: string) {
  if (!value) return new Date();
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) {
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
  }
  return new Date(y, m - 1, d);
}

function parseTime(value: string) {
  const [h = '0', m = '0'] = (value || '00:00').split(':');
  const date = new Date();
  date.setHours(Number(h) || 0, Number(m) || 0, 0, 0);
  return date;
}

function formatTimeValue(date: Date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function displayTime(value: string) {
  return parseTime(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

type PickerSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

function PickerSheet({ visible, title, onClose, children }: PickerSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{title}</Text>
          {children}
          <View style={styles.sheetActions}>
            <Pressable onPress={onClose} style={styles.sheetCancel}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.sheetDone}>
              <Text style={styles.sheetDoneText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type DateFieldProps = {
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
  hint?: string;
  minimumDate?: Date;
};

export function DateField({
  label,
  value,
  onChange,
  hint,
  minimumDate,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const date = useMemo(() => parseISODateLocal(value), [value]);
  const minDate = minimumDate ?? new Date();
  const darkMode = useIsDarkMode();

  const onPick = (_: unknown, selected?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (selected) onChange(toISODate(selected));
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={styles.field}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Ionicons name="calendar-outline" size={18} color={Colors.muted} />
        <Text style={styles.value}>{value ? formatDate(value) : 'Pick a date'}</Text>
        <Ionicons name="chevron-down" size={18} color={Colors.muted} />
      </Pressable>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      {Platform.OS === 'android' && open ? (
        <DateTimePicker
          value={date}
          mode="date"
          minimumDate={minDate}
          display="default"
          onChange={onPick}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <PickerSheet visible={open} title={label} onClose={() => setOpen(false)}>
          <DateTimePicker
            value={date}
            mode="date"
            minimumDate={minDate}
            display="spinner"
            themeVariant={darkMode ? 'dark' : 'light'}
            onChange={onPick}
            style={styles.spinner}
          />
        </PickerSheet>
      ) : null}
    </View>
  );
}

type TimeFieldProps = {
  label: string;
  value: string;
  onChange: (hhmm: string) => void;
  hint?: string;
};

export function TimeField({ label, value, onChange, hint }: TimeFieldProps) {
  const [open, setOpen] = useState(false);
  const date = useMemo(() => parseTime(value), [value]);
  const darkMode = useIsDarkMode();

  const onPick = (_: unknown, selected?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (selected) onChange(formatTimeValue(selected));
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={styles.field}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Ionicons name="time-outline" size={18} color={Colors.muted} />
        <Text style={styles.value}>{value ? displayTime(value) : 'Pick a time'}</Text>
        <Ionicons name="chevron-down" size={18} color={Colors.muted} />
      </Pressable>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      {Platform.OS === 'android' && open ? (
        <DateTimePicker value={date} mode="time" display="default" onChange={onPick} />
      ) : null}

      {Platform.OS === 'ios' ? (
        <PickerSheet visible={open} title={label} onClose={() => setOpen(false)}>
          <DateTimePicker
            value={date}
            mode="time"
            display="spinner"
            themeVariant={darkMode ? 'dark' : 'light'}
            onChange={onPick}
            style={styles.spinner}
          />
        </PickerSheet>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.sm },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.dark,
    letterSpacing: 0.1,
  },
  field: {
    minHeight: 56,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  value: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.dark,
  },
  hint: { ...Typography.small, color: Colors.muted },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: Colors.overlay },
  sheet: {
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
    zIndex: 1,
  },
  sheetTitle: {
    ...Typography.h2,
    color: Colors.primary,
    textAlign: 'center',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sheetCancel: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceSecondary,
  },
  sheetCancelText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.muted,
  },
  sheetDone: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.action,
  },
  sheetDoneText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.white,
  },
  spinner: {
    alignSelf: 'center',
    width: '100%',
    height: 196,
  },
});
