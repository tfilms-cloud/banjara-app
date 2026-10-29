import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

const LOGO = require('../../assets/logo-gold.png');

type BrandMarkProps = {
  size?: number;
};

export function BrandMark({ size = 36 }: BrandMarkProps) {
  return (
    <View style={[styles.clip, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image
        source={LOGO}
        style={{ width: size, height: size }}
        contentFit="cover"
        accessibilityLabel="BANJARA"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
});
