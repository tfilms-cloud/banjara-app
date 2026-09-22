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
  toPlaceSearchResult,
} from '@/components/location/LocationPinSheet';
import { getApiErrorMessage } from '@/services/apiError';
import * as locationService from '@/services/locationService';
import type { PlaceSearchResult } from '@/types/location';

type PlaceAutocompleteSelectProps = {
  label: string;
  value?: string;
  onChange: (placeName: string, place?: PlaceSearchResult) => void;
  placeholder?: string;
  hint?: string;
  /** Local favorites shown when query is empty / as boost */
  suggestions?: string[];
  leftIcon?: keyof typeof Ionicons.glyphMap;
};

/**
 * Free Google-like place search:
 * curated BANJARA places + OpenStreetMap Photon/Nominatim via backend.
 */
export function PlaceAutocompleteSelect({
  label,
  value,
  onChange,
  placeholder = 'Search place…',
  hint,
  suggestions = [],
  leftIcon = 'search-outline',
}: PlaceAutocompleteSelectProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [mapOpen, setMapOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestionRows = useMemo(
    () =>
      suggestions
        .filter((name) => !query || name.toLowerCase().includes(query.trim().toLowerCase()))
        .slice(0, 8)
        .map((name) => ({ kind: 'suggestion' as const, name })),
    [suggestions, query]
  );

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
    if (!open) return;
    if (timer.current) clearTimeout(timer.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      setError(null);
      return;
    }
    setSearching(true);
    timer.current = setTimeout(() => {
      void locationService
        .searchPlaces(q, 8)
        .then((data) => {
          setResults(data);
          setError(data.length ? null : 'No places found. Try another spelling.');
        })
        .catch((err) => {
          setResults([]);
          setError(getApiErrorMessage(err));
        })
        .finally(() => setSearching(false));
    }, 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, open]);

  const close = () => {
    Keyboard.dismiss();
    setOpen(false);
    setQuery('');
    setResults([]);
    setError(null);
    setKeyboardHeight(0);
  };

  const pickName = (name: string, place?: PlaceSearchResult) => {
    onChange(name, place);
    close();
  };

  const sheetMaxHeight = Math.max(
    280,
    windowHeight - keyboardHeight - insets.top - 24
  );
  const listMaxHeight = Math.max(
    140,
    sheetMaxHeight - 160 - (error ? 28 : 0)
  );

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        style={[styles.field, !label && styles.fieldFlush]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
      >
        <Ionicons name={leftIcon} size={18} color={label ? Colors.muted : Colors.primary} />
        {label ? (
          <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
            {value || placeholder}
          </Text>
        ) : (
          <View style={styles.valueWrap}>
            <Text style={styles.fieldCaption}>Destination</Text>
            <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
              {value || placeholder}
            </Text>
          </View>
        )}
        <Pressable
          onPress={() => setMapOpen(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Pin ${label || 'location'} on map`}
          style={styles.mapBtn}
        >
          <Ionicons name="map-outline" size={18} color={Colors.action} />
        </Pressable>
        <Ionicons name="chevron-down" size={18} color={Colors.muted} />
      </Pressable>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

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
            <Text style={styles.sheetTitle}>{label || 'Destination'}</Text>
            <View style={styles.searchField}>
              <Ionicons name="search-outline" size={18} color={Colors.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Type a city, stop, or area…"
                placeholderTextColor={Colors.mutedLight}
                style={styles.searchInput}
                autoFocus
                autoCorrect={false}
              />
              {searching ? <ActivityIndicator size="small" color={Colors.action} /> : null}
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}

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
              data={[
                ...suggestionRows,
                ...results
                  .filter(
                    (place) =>
                      !suggestionRows.some(
                        (s) => s.name.toLowerCase() === place.name.toLowerCase()
                      )
                  )
                  .map((place) => ({ kind: 'remote' as const, place })),
              ]}
              keyExtractor={(item, index) =>
                item.kind === 'suggestion'
                  ? `s-${item.name}`
                  : `r-${item.place.latitude}-${item.place.longitude}-${index}`
              }
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              style={{ maxHeight: listMaxHeight }}
              ListEmptyComponent={
                !searching ? (
                  <Text style={styles.empty}>
                    {query.trim().length < 2
                      ? 'Popular places appear above — or type to search all of Pakistan.'
                      : 'No matches yet.'}
                  </Text>
                ) : null
              }
              renderItem={({ item }) => {
                if (item.kind === 'suggestion') {
                  return (
                    <Pressable style={styles.option} onPress={() => pickName(item.name)}>
                      <Ionicons name="star-outline" size={16} color={Colors.accent} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.optionTitle}>{item.name}</Text>
                        <Text style={styles.optionSub}>Popular on BANJARA</Text>
                      </View>
                    </Pressable>
                  );
                }
                const place = item.place;
                return (
                  <Pressable
                    style={styles.option}
                    onPress={() => pickName(place.name, place)}
                  >
                    <Ionicons name="location-outline" size={16} color={Colors.action} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.optionTitle}>{place.name}</Text>
                      <Text style={styles.optionSub} numberOfLines={2}>
                        {place.address.formattedAddress}
                      </Text>
                    </View>
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
        title={label || 'Pin location'}
        onConfirm={(picked) => {
          onChange(formatPickedPlace(picked), toPlaceSearchResult(picked));
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
  fieldFlush: {
    borderWidth: 0,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.md,
    minHeight: 52,
    paddingHorizontal: Spacing.sm,
  },
  valueWrap: { flex: 1, minWidth: 0 },
  fieldCaption: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.muted,
    marginBottom: 1,
  },
  value: { flex: 1, fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.dark },
  placeholder: { color: Colors.mutedLight, fontFamily: Fonts.body },
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
  sheetTitle: { ...Typography.h3, color: Colors.primary, marginBottom: Spacing.md },
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
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.dark,
    paddingVertical: Spacing.sm,
  },
  error: { ...Typography.caption, color: Colors.danger, marginBottom: Spacing.sm },
  empty: {
    ...Typography.caption,
    color: Colors.muted,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
    lineHeight: 18,
  },
  option: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  optionTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.dark },
  optionSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.muted, marginTop: 2 },
});
