import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { LightColors } from '@/constants/colors';

const LOGO = require('../../assets/logo-gold.png');

type BrandSplashProps = {
  onReady?: () => void;
};

export function BrandSplash({ onReady }: BrandSplashProps) {
  return (
    <View style={styles.root} onLayout={onReady} accessibilityLabel="BANJARA" accessibilityState={{ busy: true }}>
      <View style={styles.clip}>
        <Image source={LOGO} style={styles.logo} contentFit="cover" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // Renders before the store hydrates, so it pins the light canvas directly.
    backgroundColor: LightColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clip: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  logo: {
    width: 160,
    height: 160,
  },
});
