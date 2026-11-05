import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useExploreDesign } from '@/constants/exploreDesign';
import type { ExploreServiceTab } from '@/constants/exploreCatalog';
import { Fonts } from '@/constants/typography';
import {
  DEFAULT_REFINE,
  exploreRefineOptions,
  isRefineActive,
  toggleRefine,
  type ExploreRefine,
} from '@/utils/exploreRefine';

type Props = {
  service: ExploreServiceTab;
  value: ExploreRefine;
  onChange: (next: ExploreRefine) => void;
  /** Number of results after refining — announced to screen readers. */
  resultCount?: number;
};

/** One chip row: sort options first, then quick filters. Same on every service. */
export function ExploreRefineBar({ service, value, onChange, resultCount }: Props) {
  const theme = useExploreDesign();
  const options = exploreRefineOptions(service);
  if (!options) return null;
  const active = isRefineActive(value);

  const chip = (selected: boolean) => ({
    backgroundColor: selected ? theme.accent : theme.field,
    borderColor: selected ? theme.primary : theme.border,
  });

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.row}
        accessibilityLabel="Sort and filter"
      >
        {options.sorts.map((item) => {
          const selected = value.sort === item.id;
          return (
            <Pressable
              key={`sort-${item.id}`}
              accessibilityRole="radio"
              accessibilityLabel={`Sort by ${item.label}`}
              accessibilityState={{ checked: selected }}
              onPress={() => onChange({ ...value, sort: item.id })}
              style={[s.chip, chip(selected)]}
            >
              {selected && item.id !== 'recommended' ? (
                <Ionicons name="swap-vertical" size={14} color={theme.primary} accessible={false} />
              ) : null}
              <Text style={[s.text, { color: selected ? theme.primary : theme.text }]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
        {options.toggles.length ? <View style={[s.divider, { backgroundColor: theme.border }]} /> : null}
        {options.toggles.map((item) => {
          const selected = value.toggles.includes(item.id);
          return (
            <Pressable
              key={`toggle-${item.id}`}
              accessibilityRole="checkbox"
              accessibilityLabel={item.label}
              accessibilityState={{ checked: selected }}
              onPress={() => onChange(toggleRefine(value, item.id))}
              style={[s.chip, chip(selected)]}
            >
              {selected ? (
                <Ionicons name="checkmark" size={14} color={theme.primary} accessible={false} />
              ) : null}
              <Text style={[s.text, { color: selected ? theme.primary : theme.text }]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
        {active ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear sort and filters"
            onPress={() => onChange(DEFAULT_REFINE)}
            style={s.clear}
          >
            <Text style={[s.text, { color: theme.primary }]}>Clear</Text>
          </Pressable>
        ) : null}
      </ScrollView>
      {resultCount !== undefined ? (
        <Text accessibilityLiveRegion="polite" style={[s.count, { color: theme.muted }]}>
          {resultCount} {resultCount === 1 ? 'result' : 'results'}
        </Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  row: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    minHeight: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  text: { fontFamily: Fonts.bodySemiBold, fontSize: 13 },
  divider: { width: 1, height: 20, marginHorizontal: 2 },
  clear: { paddingHorizontal: 10, minHeight: 36, justifyContent: 'center' },
  count: { fontFamily: Fonts.body, fontSize: 12, paddingHorizontal: 16, paddingBottom: 4 },
});
