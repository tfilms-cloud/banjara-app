import { Image, StyleSheet, View } from 'react-native';
import type { CustomerPaymentMethodId, PayoutChannel } from '@/constants/payments';

const ICONS = {
  bank: require('../../assets/payments/bank.png'),
  easypaisa: require('../../assets/payments/easypaisa.jpg'),
  jazzcash: require('../../assets/payments/jazzcash.png'),
  raast: require('../../assets/payments/raast.png'),
} as const;

type ChannelKey = keyof typeof ICONS;

type Props = {
  channel: Exclude<PayoutChannel, 'other'> | 'bankTransfer';
  size?: number;
};

function toChannelKey(channel: Props['channel']): ChannelKey {
  if (channel === 'bankTransfer') return 'bank';
  return channel;
}

/** Brand logos only — no colored background plates. */
export function PayoutChannelIcon({ channel, size = 40 }: Props) {
  const key = toChannelKey(channel);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Image source={ICONS[key]} style={styles.image} resizeMode="contain" />
    </View>
  );
}

export function PaymentMethodIcon({
  methodId,
  size = 40,
}: {
  methodId: CustomerPaymentMethodId | string;
  size?: number;
}) {
  if (
    methodId === 'bankTransfer' ||
    methodId === 'easypaisa' ||
    methodId === 'jazzcash' ||
    methodId === 'raast' ||
    methodId === 'bank'
  ) {
    return <PayoutChannelIcon channel={methodId as Props['channel']} size={size} />;
  }
  return null;
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
