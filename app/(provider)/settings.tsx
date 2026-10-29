import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppearanceToggle } from '@/components/ui/AppearanceToggle';
import { Header } from '@/components/ui/Header';
import { MenuList } from '@/components/ui/MenuList';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useAuthStore } from '@/store/authStore';
import { useProviderStore } from '@/store/providerStore';
import { pushPath } from '@/utils/navigation';

/** App-level settings only — service operations stay on Dashboard / Service / Bookings. */
export default function ProviderSettingsScreen() {
  const insets = useSafeAreaInsets();
  const logout = useAuthStore((s) => s.logout);
  const provider = useProviderStore((s) => s.provider);
  const termsRole =
    provider?.services?.some((s) => s === 'hotel' || s === 'guestHouse')
      ? 'hotel'
      : provider?.services?.some((s) => s === 'tour')
        ? 'tour'
        : provider?.services?.some((s) => s === 'travelGuide')
          ? 'guide'
          : 'transporter';

  return (
    <View style={styles.container}>
      <Header title="Settings" showBack fallbackHref="/(provider)/(tabs)/profile" />
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + 40,
          gap: Spacing.lg,
        }}
      >
        <AppearanceToggle />
        <MenuList
          items={[
            {
              key: 'cnic',
              label: 'CNIC verification',
              subtitle: 'Verify identity from your CNIC photo',
              icon: 'card-outline',
              onPress: () => pushPath('/(provider)/register/verification'),
            },
            {
              key: 'payment-accounts',
              label: 'Payment accounts',
              subtitle: 'Bank, Easypaisa, JazzCash, Raast',
              icon: 'wallet-outline',
              onPress: () => pushPath('/(provider)/payment-accounts'),
            },
            {
              key: 'notifications',
              label: 'Notifications',
              subtitle: 'Inbox',
              icon: 'notifications-outline',
              onPress: () => pushPath('/(provider)/notifications'),
            },
            {
              key: 'notification-settings',
              label: 'Push settings',
              subtitle: 'Choose what alerts you get',
              icon: 'options-outline',
              onPress: () => pushPath('/(provider)/notification-settings'),
            },
            {
              key: 'phone',
              label: 'Phone number',
              subtitle: provider?.phone || 'Verified mobile',
              icon: 'phone-portrait-outline',
              onPress: () => pushPath('/(provider)/register/business'),
            },
            {
              key: 'terms',
              label: 'Terms & Conditions',
              icon: 'document-text-outline',
              onPress: () => pushPath(`/terms/${termsRole}`),
            },
            {
              key: 'privacy',
              label: 'Privacy',
              icon: 'shield-outline',
              onPress: () => pushPath('/terms/customer'),
            },
          ]}
        />

        <MenuList
          items={[
            {
              key: 'logout',
              label: 'Logout',
              icon: 'log-out-outline',
              danger: true,
              onPress: () => {
                logout();
                router.replace('/(auth)/welcome');
              },
            },
          ]}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
});
