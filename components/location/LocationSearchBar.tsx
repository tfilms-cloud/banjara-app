import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import type { PlaceSearchResult } from '@/types/location';
import { isRtlLocationText } from '@/utils/locationText';

interface LocationSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  results: PlaceSearchResult[];
  searching?: boolean;
  error?: string | null;
  onSelect: (place: PlaceSearchResult) => void;
  onClear?: () => void;
}

export function LocationSearchBar({
  value,
  onChangeText,
  results,
  searching,
  error,
  onSelect,
  onClear,
}: LocationSearchBarProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <View style={[styles.inputRow, focused && styles.inputFocused]}>
        <View style={styles.searchIcon}>
          <Ionicons name="search-outline" size={20} color={focused ? Colors.action : Colors.muted} />
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Search city, area or address"
          placeholderTextColor={Colors.muted}
          style={[styles.input, isRtlLocationText(value) && styles.rtlInput]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel="Search location"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          blurOnSubmit
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        <View style={styles.trailing}>
        {searching ? <ActivityIndicator size="small" color={Colors.action} /> : null}
        {value && !searching ? (
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              onClear?.();
              if (!onClear) onChangeText('');
            }}
            hitSlop={8}
            style={styles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={18} color={Colors.muted} />
          </Pressable>
        ) : null}
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {results.length > 0 ? (
        <View style={styles.dropdown}>
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.resultsScroll}>
          {results.map((item, index) => (
            <Pressable
              key={`${item.latitude}-${item.longitude}-${index}`}
              style={[styles.result, index === results.length - 1 && styles.resultLast]}
              accessibilityRole="button"
              onPress={() => {
                Keyboard.dismiss();
                onSelect(item);
              }}
            >
              <Ionicons name="location-outline" size={16} color={Colors.secondary} />
              <View style={styles.resultCopy}>
                <Text style={[styles.resultTitle, isRtlLocationText(item.name) && styles.rtlCopy]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.resultSub, isRtlLocationText(item.address.formattedAddress ?? '') && styles.rtlCopy]} numberOfLines={2}>
                  {item.address.formattedAddress}
                </Text>
              </View>
            </Pressable>
          ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { zIndex: 20 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    minHeight: 56,
  },
  inputFocused: { borderColor: Colors.action },
  searchIcon: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  trailing: { width: 36, alignItems: 'center', justifyContent: 'center' },
  clearButton: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1,
    minWidth: 0,
    // UIKit centers its native single-line font metrics. A forced lineHeight
    // from Typography.body pushed typed characters below the icons on iOS.
    fontFamily: Platform.OS === 'ios' ? 'System' : Fonts.body,
    fontSize: 16,
    color: Colors.dark,
    minHeight: 28,
    paddingVertical: 0,
    paddingHorizontal: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
    textAlign: 'left',
  },
  rtlInput: { textAlign: 'right', writingDirection: 'rtl', fontFamily: undefined },
  rtlCopy: { textAlign: 'right', writingDirection: 'rtl', fontFamily: undefined, lineHeight: 26 },
  resultCopy: { flex: 1, minWidth: 0 },
  resultsScroll: { maxHeight: 240 },
  error: {
    ...Typography.caption,
    color: Colors.danger,
    marginTop: Spacing.xs,
  },
  dropdown: {
    marginTop: Spacing.sm,
    maxHeight: 240,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  resultLast: { borderBottomWidth: 0 },
  resultTitle: { ...Typography.bodyBold, color: Colors.primary },
  resultSub: { ...Typography.caption, color: Colors.muted, marginTop: 2 },
});
