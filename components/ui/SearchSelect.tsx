import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';

export type SearchSelectOption = {
  value: string;
  label: string;
  subtitle?: string;
};

type SearchSelectProps = {
  label: string;
  placeholder?: string;
  value?: string;
  options: SearchSelectOption[];
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  searchable?: boolean;
  emptyText?: string;
};

export function SearchSelect({
  label,
  placeholder = 'Select…',
  value,
  options,
  onChange,
  hint,
  error,
  leftIcon = 'chevron-down',
  searchable = true,
  emptyText = 'No matches',
}: SearchSelectProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.subtitle?.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q)
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) {
      setKeyboardHeight(0);
      return;
    }
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [open]);

  const close = () => {
    Keyboard.dismiss();
    setOpen(false);
    setQuery('');
    setKeyboardHeight(0);
  };

  const sheetMaxHeight = Math.max(280, windowHeight - keyboardHeight - insets.top - 24);
  const listMaxHeight = Math.max(140, sheetMaxHeight - (searchable ? 150 : 100));

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.field, error ? styles.fieldError : null]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {leftIcon !== 'chevron-down' ? (
          <Ionicons name={leftIcon} size={18} color={Colors.muted} style={styles.leftIcon} />
        ) : (
          <Ionicons name="search-outline" size={18} color={Colors.muted} style={styles.leftIcon} />
        )}
        <Text style={[styles.value, !selected && styles.placeholder]} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={Colors.muted} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={close} />
          <View
            style={[
              styles.sheet,
              {
                maxHeight: sheetMaxHeight,
                marginBottom: keyboardHeight,
                paddingBottom: (keyboardHeight > 0 ? Spacing.md : insets.bottom) + Spacing.lg,
              },
            ]}
          >
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{label}</Text>
            {searchable ? (
              <View style={styles.searchField}>
                <Ionicons name="search-outline" size={18} color={Colors.muted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search…"
                  placeholderTextColor={Colors.mutedLight}
                  style={styles.searchInput}
                  autoFocus
                />
                {query ? (
                  <Pressable onPress={() => setQuery('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={Colors.muted} />
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              style={{ maxHeight: listMaxHeight }}
              ListEmptyComponent={<Text style={styles.empty}>{emptyText}</Text>}
              renderItem={({ item }) => {
                const active = item.value === value;
                return (
                  <Pressable
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => {
                      onChange(item.value);
                      close();
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                        {item.label}
                      </Text>
                      {item.subtitle ? (
                        <Text style={styles.optionSub} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </View>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.action} />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
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
  fieldError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.softDanger,
  },
  leftIcon: { marginRight: 2 },
  value: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.dark,
  },
  placeholder: { color: Colors.mutedLight },
  error: { ...Typography.small, color: Colors.danger },
  hint: { ...Typography.small, color: Colors.muted },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: Colors.overlay },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    ...Typography.h3,
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  searchField: {
    minHeight: 48,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.dark,
    paddingVertical: Spacing.sm,
  },
  empty: {
    ...Typography.caption,
    color: Colors.muted,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  optionActive: {
    backgroundColor: Colors.actionSoft,
    borderBottomWidth: 0,
  },
  optionLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.dark,
  },
  optionLabelActive: { color: Colors.actionDark },
  optionSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
});
