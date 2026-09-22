import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { PlaceSearchResult } from '@/types/location';

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
  return (
    <View style={styles.wrap}>
      <View style={styles.inputRow}>
        <Ionicons name="search" size={18} color={Colors.muted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Search location..."
          placeholderTextColor={Colors.muted}
          style={styles.input}
          autoCorrect={false}
          returnKeyType="search"
        />
        {searching ? <ActivityIndicator size="small" color={Colors.secondary} /> : null}
        {value && !searching ? (
          <Pressable onPress={onClear} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={Colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {results.length > 0 ? (
        <View style={styles.dropdown}>
          {results.map((item, index) => (
            <Pressable
              key={`${item.latitude}-${item.longitude}-${index}`}
              style={[styles.result, index === results.length - 1 && styles.resultLast]}
              onPress={() => onSelect(item)}
            >
              <Ionicons name="location-outline" size={16} color={Colors.secondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.resultTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.resultSub} numberOfLines={2}>
                  {item.address.formattedAddress}
                </Text>
              </View>
            </Pressable>
          ))}
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
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.dark,
    paddingVertical: Spacing.sm,
  },
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
