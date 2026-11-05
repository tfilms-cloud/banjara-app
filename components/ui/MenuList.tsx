import { StyleSheet, View, type ViewStyle } from 'react-native';
import { ListRow } from '@/components/ui/ListRow';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/spacing';
import type { MenuListItem } from '@/components/ui/MenuList.types';
import { usePresentationColors, useTravelPresentation } from './TravelDesignProvider';

export type { MenuListItem } from '@/components/ui/MenuList.types';

type MenuListProps = {
  items: MenuListItem[];
  style?: ViewStyle;
};

export function MenuList({ items, style }: MenuListProps) {
  const colors = usePresentationColors();
  const travel = useTravelPresentation();
  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.card, borderColor: colors.border },
        travel && { borderRadius: 32 },
        style,
      ]}
    >
      {items.map((item, index) => (
        <ListRow
          key={item.key}
          icon={item.icon}
          label={item.label}
          subtitle={item.subtitle}
          danger={item.danger}
          onPress={item.onPress}
          trailing={item.trailing}
          divider={!travel && index < items.length - 1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
});
