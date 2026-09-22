import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type MenuListItem = {
  key: string;
  label: string;
  subtitle?: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  danger?: boolean;
};
