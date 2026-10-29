import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationPreferencesPanel } from '@/components/notifications/NotificationPreferencesPanel';
import { Header } from '@/components/ui/Header';
import { useThemeColors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';

export default function ProviderNotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title="Notification settings" showBack fallbackHref="/(provider)/settings" />
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + 40,
        }}
      >
        <NotificationPreferencesPanel showReviews />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
