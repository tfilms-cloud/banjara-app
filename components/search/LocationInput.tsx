import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

interface LocationInputProps {
  label: string;
  value: string;
  placeholder?: string;
  onPress?: () => void;
  onChangeText?: (text: string) => void;
  editable?: boolean;
}

export function LocationInput({
  label,
  value,
  placeholder,
  onPress,
}: LocationInputProps) {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={styles.dot} />
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
          {value || placeholder || 'Select location'}
        </Text>
      </View>
      <Ionicons name="chevron-down" size={16} color={Colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.secondary,
  },
  content: {
    flex: 1,
  },
  label: {
    ...Typography.small,
    color: Colors.muted,
    marginBottom: 2,
  },
  value: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  placeholder: {
    color: Colors.muted,
    fontWeight: '400',
  },
});
