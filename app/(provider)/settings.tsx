import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppearanceToggle } from '@/components/ui/AppearanceToggle';
import { Header } from '@/components/ui/Header';
import { MenuList } from '@/components/ui/MenuList';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useAuthStore } from '@/store/authStore';
import { pushPath } from '@/utils/navigation';

export default function ProviderSettingsScreen() {
  const insets = useSafeAreaInsets();
  const logout = useAuthStore((s) => s.logout);

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
              key: 'business',
              label: 'Business information',
              icon: 'briefcase-outline',
              onPress: () => pushPath('/(provider)/register/business'),
            },
            {
              key: 'location',
              label: 'Business location',
              icon: 'location-outline',
              onPress: () => pushPath('/(provider)/location'),
            },
            {
              key: 'account',
              label: 'Account information',
              icon: 'person-outline',
              onPress: () => pushPath('/(provider)/(tabs)/profile'),
            },
            {
              key: 'notifications',
              label: 'Notifications',
              icon: 'notifications-outline',
              onPress: () => pushPath('/(provider)/notifications'),
            },
            {
              key: 'payments',
              label: 'Payment settings',
              icon: 'card-outline',
              onPress: () => pushPath('/(provider)/(tabs)/earnings'),
            },
            {
              key: 'availability',
              label: 'Availability',
              icon: 'calendar-outline',
              onPress: () => pushPath('/(provider)/hotel/availability'),
            },
          ]}
        />

        <MenuList
          items={[
            {
              key: 'privacy',
              label: 'Privacy',
              icon: 'shield-outline',
              onPress: () => pushPath('/(provider)/settings'),
            },
            {
              key: 'security',
              label: 'Security',
              icon: 'lock-closed-outline',
              onPress: () => pushPath('/(provider)/settings'),
            },
            {
              key: 'terms',
              label: 'Terms',
              icon: 'document-text-outline',
              onPress: () => pushPath('/(provider)/settings'),
            },
            {
              key: 'help',
              label: 'Help & support',
              icon: 'help-circle-outline',
              onPress: () => pushPath('/(provider)/settings'),
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
