import { StyleSheet, View, type ViewStyle } from 'react-native';
import { ListRow } from '@/components/ui/ListRow';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/spacing';
import type { MenuListItem } from '@/components/ui/MenuList.types';

export type { MenuListItem } from '@/components/ui/MenuList.types';

type MenuListProps = {
  items: MenuListItem[];
  style?: ViewStyle;
};

export function MenuList({ items, style }: MenuListProps) {
  return (
    <View style={[styles.wrap, style]}>
      {items.map((item, index) => (
        <ListRow
          key={item.key}
          icon={item.icon}
          label={item.label}
          subtitle={item.subtitle}
          danger={item.danger}
          onPress={item.onPress}
          divider={index < items.length - 1}
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
