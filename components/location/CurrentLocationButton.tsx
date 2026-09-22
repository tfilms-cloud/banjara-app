import { StyleSheet, View } from 'react-native';
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
        title={loading ? 'Finding your location...' : 'Use My Current Location'}
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
