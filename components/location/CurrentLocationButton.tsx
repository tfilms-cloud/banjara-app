import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';

interface CurrentLocationButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function CurrentLocationButton({
  onPress,
  loading,
  disabled,
}: CurrentLocationButtonProps) {
  return (
    <View style={styles.wrap}>
      <Button
        title={loading ? 'Finding your location…' : 'Use current location'}
        icon={<Ionicons name="locate-outline" size={18} color={Colors.action} />}
        variant="outline"
        onPress={onPress}
        loading={loading}
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.sm,
  },
});
