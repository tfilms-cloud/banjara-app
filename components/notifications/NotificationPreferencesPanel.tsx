import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import {
  DEFAULT_PREFS,
  fetchNotificationPreferences,
  isPushRuntimeSupported,
  requestPushPermission,
  type NotificationPreferences,
  updateNotificationPreferences,
} from '@/services/pushNotifications';

type Row = {
  key: keyof NotificationPreferences;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const CATEGORY_ROWS: Row[] = [
  {
    key: 'bookings',
    label: 'Bookings',
    subtitle: 'Requests, confirmations, and cancellations',
    icon: 'calendar-outline',
  },
  {
    key: 'payments',
    label: 'Payments',
    subtitle: 'Successful and failed payments',
    icon: 'card-outline',
  },
  {
    key: 'trips',
    label: 'Trips & pickup',
    subtitle: 'Reminders before departure',
    icon: 'bus-outline',
  },
  {
    key: 'messages',
    label: 'Messages',
    subtitle: 'New chat messages when you are away',
    icon: 'chatbubble-outline',
  },
  {
    key: 'reviews',
    label: 'Reviews',
    subtitle: 'New ratings on your services',
    icon: 'star-outline',
  },
  {
    key: 'offers',
    label: 'Offers',
    subtitle: 'Promotions and seasonal deals',
    icon: 'pricetag-outline',
  },
  {
    key: 'system',
    label: 'Account',
    subtitle: 'Verification and account updates',
    icon: 'shield-checkmark-outline',
  },
];

export function NotificationPreferencesPanel({
  showReviews = true,
}: {
  showReviews?: boolean;
}) {
  const colors = useThemeColors();
  const pushSupported = isPushRuntimeSupported();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotificationPreferences();
      setPrefs(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (key: keyof NotificationPreferences, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(key);
    setError(null);
    try {
      if (key === 'pushEnabled' && value) {
        if (!pushSupported) {
          setPrefs(prefs);
          setError('Push alerts are available in the installed Banjara app. You can still use your in-app notification inbox.');
          return;
        }
        const ok = await requestPushPermission();
        if (!ok) {
          setPrefs({ ...next, pushEnabled: false });
          setError('Enable notifications in system settings to receive alerts.');
          return;
        }
      }
      const saved = await updateNotificationPreferences({ [key]: value });
      setPrefs(saved);
    } catch (err) {
      setPrefs(prefs);
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const rows = CATEGORY_ROWS.filter((r) => (showReviews ? true : r.key !== 'reviews'));

  return (
    <View style={styles.root}>
      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.heroIcon, { backgroundColor: `${colors.primary}14` }]}>
          <Ionicons name="notifications" size={26} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, { color: colors.dark }]}>Push notifications</Text>
          <Text style={[styles.heroSub, { color: colors.muted }]}>
            Stay updated on bookings and trips. You can change this anytime.
          </Text>
        </View>
        <Switch
          value={pushSupported && prefs.pushEnabled}
          onValueChange={(v) => void patch('pushEnabled', v)}
          disabled={!pushSupported || saving === 'pushEnabled'}
          trackColor={{ false: colors.border, true: `${colors.primary}88` }}
          thumbColor={pushSupported && prefs.pushEnabled ? colors.primary : '#f4f3f4'}
        />
      </View>

      {!pushSupported ? (
        <Text style={[styles.heroSub, { color: colors.muted }]}>
          Push alerts are available in the installed Banjara app. Your in-app notification inbox is available here.
        </Text>
      ) : null}

      {error ? (
        <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
      ) : null}

      <Text style={[styles.sectionLabel, { color: colors.muted }]}>Categories</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {rows.map((row, index) => {
          const disabled = !prefs.pushEnabled;
          return (
            <View
              key={row.key}
              style={[
                styles.row,
                index < rows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                disabled && { opacity: 0.45 },
              ]}
            >
              <View style={[styles.rowIcon, { backgroundColor: `${colors.primary}10` }]}>
                <Ionicons name={row.icon} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: colors.dark }]}>{row.label}</Text>
                <Text style={[styles.rowSub, { color: colors.muted }]}>{row.subtitle}</Text>
              </View>
              <Switch
                value={prefs[row.key]}
                onValueChange={(v) => void patch(row.key, v)}
                disabled={disabled || saving === row.key}
                trackColor={{ false: colors.border, true: `${colors.primary}88` }}
                thumbColor={prefs[row.key] ? colors.primary : '#f4f3f4'}
              />
            </View>
          );
        })}
      </View>

      <Pressable onPress={() => void load()} hitSlop={8}>
        <Text style={[styles.refresh, { color: colors.primary }]}>Refresh preferences</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: Spacing.lg },
  center: { paddingVertical: 48, alignItems: 'center' },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
  },
  heroSub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  sectionLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
  },
  rowSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  error: {
    fontFamily: Fonts.body,
    fontSize: 13,
  },
  refresh: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    textAlign: 'center',
  },
});
