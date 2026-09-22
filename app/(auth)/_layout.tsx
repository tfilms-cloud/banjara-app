import { Stack } from 'expo-router';
import { useThemedStackOptions } from '@/hooks/useThemedStackOptions';

export default function AuthLayout() {
  const screenOptions = useThemedStackOptions('fade');

  return <Stack screenOptions={screenOptions} />;
}
