import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { AppearanceToggle } from '@/components/ui/AppearanceToggle';
import { Header } from '@/components/ui/Header';
import { Colors, useThemeColors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';

export default function SettingsScreen() {
  const logout = useAuthStore((state) => state.logout);
  const { settings, updateSettings } = useUserStore();
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Settings" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.sm }}>
        <SettingRow
          icon="language-outline"
          label="Language"
          value={settings.language}
          onPress={() => updateSettings({ language: settings.language === 'English' ? 'Urdu' : 'English' })}
        />
        <AppearanceToggle />
        <SettingRow
          icon="notifications-outline"
          label="Notifications"
          value="Manage"
          onPress={() => router.push('/(customer)/notification-settings' as never)}
        />
        <ToggleRow
          icon="locate-outline"
          label="Location"
          value={settings.locationEnabled}
          onChange={(locationEnabled) => updateSettings({ locationEnabled })}
        />
        <SettingRow icon="shield-checkmark-outline" label="Privacy" value="Manage" />
        <SettingRow
          icon="document-text-outline"
          label="Terms"
          value="View"
          onPress={() => router.push('/terms/customer' as never)}
        />
        <SettingRow icon="help-circle-outline" label="Help" value="Support" />
        <SettingRow icon="information-circle-outline" label="About Banjara" value="v1.0.0" />

        <Pressable
          style={[styles.logout, { backgroundColor: colors.softDanger }]}
          onPress={() => {
            logout();
            router.replace('/(auth)/welcome');
          }}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>Logout</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={[styles.icon, { backgroundColor: colors.filterBg }]}>
        <Ionicons name={icon} size={18} color={colors.action} />
      </View>
      <Text style={[styles.label, { color: colors.dark }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.muted }]}>{value}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </Pressable>
  );
}

function ToggleRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const colors = useThemeColors();
  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.icon, { backgroundColor: colors.filterBg }]}>
        <Ionicons name={icon} size={18} color={colors.action} />
      </View>
      <Text style={[styles.label, { color: colors.dark }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.action, false: colors.border }}
        thumbColor={colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...Typography.bodyBold, color: Colors.primary, flex: 1 },
  value: { ...Typography.caption, color: Colors.muted },
  logout: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: '#FEE2E2',
  },
  logoutText: { ...Typography.bodyBold, color: Colors.danger },
});
