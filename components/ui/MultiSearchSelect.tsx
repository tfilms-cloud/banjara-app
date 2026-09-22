import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import {
  LocationPinSheet,
  formatPickedPlace,
} from '@/components/location/LocationPinSheet';
import * as locationService from '@/services/locationService';

type MultiSearchSelectProps = {
  label: string;
  placeholder?: string;
  searchPlaceholder?: string;
  values: string[];
  options: string[];
  onChange: (values: string[]) => void;
  hint?: string;
  error?: string;
  max?: number;
  /** Merge free OSM/Photon place search into the list */
  enableRemoteSearch?: boolean;
};

export function MultiSearchSelect({
  label,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  values,
  options,
  onChange,
  hint,
  error,
  max = 8,
  enableRemoteSearch = false,
}: MultiSearchSelectProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [remoteNames, setRemoteNames] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [mapOpen, setMapOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const local = !q
      ? options
      : options.filter((item) => item.toLowerCase().includes(q));
    const merged = [...local];
    for (const name of remoteNames) {
      if (!merged.some((item) => item.toLowerCase() === name.toLowerCase())) {
        merged.push(name);
      }
    }
    return merged;
  }, [options, query, remoteNames]);

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

  useEffect(() => {
    if (!open || !enableRemoteSearch) return;
    if (timer.current) clearTimeout(timer.current);
    const q = query.trim();
    if (q.length < 2) {
      setRemoteNames([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    timer.current = setTimeout(() => {
      void locationService
        .searchPlaces(q, 8)
        .then((places) => setRemoteNames(places.map((p) => p.name).filter(Boolean)))
        .catch(() => setRemoteNames([]))
        .finally(() => setSearching(false));
    }, 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, open, enableRemoteSearch]);

  const toggle = (item: string) => {
    if (values.includes(item)) {
      onChange(values.filter((v) => v !== item));
      return;
    }
    if (values.length >= max) return;
    onChange([...values, item]);
  };

  const close = () => {
    Keyboard.dismiss();
    setOpen(false);
    setQuery('');
    setRemoteNames([]);
    setKeyboardHeight(0);
  };

  const sheetMaxHeight = Math.max(280, windowHeight - keyboardHeight - insets.top - 24);
  const listMaxHeight = Math.max(140, sheetMaxHeight - 170);

  const summary =
    values.length === 0
      ? placeholder
      : values.length <= 2
        ? values.join(', ')
        : `${values.slice(0, 2).join(', ')} +${values.length - 2}`;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.field, error ? styles.fieldError : null]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Ionicons name="location-outline" size={18} color={Colors.muted} />
        <Text style={[styles.value, values.length === 0 && styles.placeholder]} numberOfLines={1}>
          {summary}
        </Text>
        <Pressable
          onPress={() => setMapOpen(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Pin ${label} on map`}
          style={styles.mapBtn}
        >
          <Ionicons name="map-outline" size={18} color={Colors.action} />
        </Pressable>
        <Ionicons name="chevron-down" size={18} color={Colors.muted} />
      </Pressable>

      {values.length > 0 ? (
        <View style={styles.chips}>
          {values.map((item) => (
            <Pressable key={item} style={styles.chip} onPress={() => toggle(item)}>
              <Text style={styles.chipText}>{item}</Text>
              <Ionicons name="close" size={14} color={Colors.actionDark} />
            </Pressable>
          ))}
        </View>
      ) : null}

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
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable onPress={close} style={styles.doneBtn}>
                <Text style={styles.doneText}>Done</Text>
              </Pressable>
            </View>
            <Text style={styles.count}>
              {values.length} selected{max ? ` · max ${max}` : ''}
              {enableRemoteSearch ? ' · live map search on' : ''}
            </Text>
            <View style={styles.searchField}>
              <Ionicons name="search-outline" size={18} color={Colors.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor={Colors.mutedLight}
                style={styles.searchInput}
                autoFocus
              />
              {searching ? <ActivityIndicator size="small" color={Colors.action} /> : null}
            </View>
            <Pressable
              style={styles.pinRow}
              onPress={() => {
                close();
                setTimeout(() => setMapOpen(true), 280);
              }}
              accessibilityRole="button"
              accessibilityLabel="Pin on map"
            >
              <Ionicons name="map-outline" size={18} color={Colors.action} />
              <Text style={styles.pinRowText}>Pin on map</Text>
            </Pressable>
            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              style={{ maxHeight: listMaxHeight }}
              ListEmptyComponent={
                !searching ? (
                  <Text style={styles.empty}>
                    {enableRemoteSearch && query.trim().length < 2
                      ? 'Type at least 2 letters to search all of Pakistan.'
                      : 'No matches.'}
                  </Text>
                ) : null
              }
              renderItem={({ item }) => {
                const active = values.includes(item);
                return (
                  <Pressable
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => toggle(item)}
                  >
                    <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                      {item}
                    </Text>
                    <Ionicons
                      name={active ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={active ? Colors.action : Colors.muted}
                    />
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      <LocationPinSheet
        visible={mapOpen}
        onClose={() => setMapOpen(false)}
        title={label}
        onConfirm={(picked) => {
          const name = formatPickedPlace(picked);
          if (!values.some((item) => item.toLowerCase() === name.toLowerCase()) && values.length < max) {
            onChange([...values, name]);
          }
          setMapOpen(false);
        }}
      />
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
  value: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.dark,
  },
  mapBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: Colors.actionSoft,
  },
  pinRowText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.actionDark,
  },
  placeholder: { color: Colors.mutedLight },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.actionSoft,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.actionDark,
  },
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
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sheetTitle: { ...Typography.h3, color: Colors.primary },
  doneBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  doneText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.action,
  },
  count: {
    ...Typography.caption,
    color: Colors.muted,
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
    justifyContent: 'space-between',
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
});
