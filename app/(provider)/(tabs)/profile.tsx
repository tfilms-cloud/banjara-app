import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { MenuList } from '@/components/ui/MenuList';
import { AuthFonts } from '@/constants/authFonts';
import { Colors } from '@/constants/colors';
import { serviceLabel } from '@/constants/providerOptions';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as providerService from '@/services/providerService';
import * as uploadService from '@/services/uploadService';
import { useAuthStore } from '@/store/authStore';
import { useProviderStore } from '@/store/providerStore';
import { pushPath } from '@/utils/navigation';

/** Provider profile — app settings only (not a second business dashboard). */
export default function ProviderProfileScreen() {
  const insets = useSafeAreaInsets();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const provider = useProviderStore((s) => s.provider);
  const loadProvider = useProviderStore((s) => s.loadProvider);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const onChangeLogo = async () => {
    try {
      setUploadingLogo(true);
      const uploaded = await uploadService.pickAndUpload('logos', {
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!uploaded) return;
      await providerService.updateProviderLogo(uploaded.url);
      if (provider?.id) await loadProvider(provider.id);
    } catch (error) {
      Alert.alert('Logo update failed', getApiErrorMessage(error));
    } finally {
      setUploadingLogo(false);
    }
  };

  const termsRole =
    provider?.services?.some((s) => s === 'hotel' || s === 'guestHouse')
      ? 'hotel'
      : provider?.services?.some((s) => s === 'tour')
        ? 'tour'
        : provider?.services?.some((s) => s === 'travelGuide')
          ? 'guide'
          : provider?.services?.some((s) => s === 'restaurant')
            ? 'restaurant'
            : 'transporter';

  const displayName = provider?.businessName || user?.name || 'Provider';
  const photoUri = provider?.logo || user?.avatar;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.lg,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>Profile</Text>

      <View style={styles.heroCard}>
        <Pressable
          onPress={() => void onChangeLogo()}
          accessibilityRole="button"
          accessibilityLabel="Change business logo"
          style={styles.logoPress}
        >
          <Avatar uri={photoUri} name={displayName} size={72} />
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={12} color={Colors.white} />
          </View>
        </Pressable>
        <View style={styles.heroCopy}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.meta}>{provider?.phone || user?.phone || '—'}</Text>
          <Text style={styles.hint}>
            {uploadingLogo
              ? 'Uploading logo…'
              : photoUri
                ? provider?.services?.[0]
                  ? serviceLabel(provider.services[0])
                  : 'Tap photo to change logo'
                : 'Tap to add your logo'}
          </Text>
          <View style={styles.badgeRow}>
            <Badge
              label={
                provider?.verificationStatus === 'approved'
                  ? provider?.services?.some((s) => s === 'restaurant')
                    ? '✓ Restaurant approved'
                    : 'Verified'
                  : provider?.verificationStatus === 'rejected'
                    ? 'Rejected'
                    : provider?.verificationStatus === 'suspended'
                      ? 'Suspended'
                      : 'Pending approval'
              }
              tone={
                provider?.verificationStatus === 'approved'
                  ? 'green'
                  : provider?.verificationStatus === 'rejected' ||
                      provider?.verificationStatus === 'suspended'
                    ? 'red'
                    : 'amber'
              }
            />
          </View>
        </View>
      </View>

      <MenuList
        items={[
          {
            key: 'settings',
            label: 'App settings',
            subtitle: 'Appearance, notifications, account',
            icon: 'settings-outline',
            onPress: () => pushPath('/(provider)/settings'),
          },
          {
            key: 'payments',
            label: 'Payments / Earnings',
            subtitle: 'Verify transfers and view transaction history',
            icon: 'wallet-outline',
            onPress: () => pushPath('/(provider)/payments'),
          },
          {
            key: 'payment-accounts',
            label: 'Payment accounts',
            subtitle: 'Bank, Easypaisa, JazzCash, Raast',
            icon: 'card-outline',
            onPress: () => pushPath('/(provider)/payment-accounts'),
          },
          {
            key: 'notifications',
            label: 'Notifications',
            icon: 'notifications-outline',
            onPress: () => pushPath('/(provider)/notifications'),
          },
          {
            key: 'messages',
            label: 'Messages',
            icon: 'chatbubble-outline',
            onPress: () => pushPath('/(provider)/messages'),
          },
          {
            key: 'terms',
            label: 'Terms & Conditions',
            icon: 'document-text-outline',
            onPress: () => pushPath(`/terms/${termsRole}`),
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  screenTitle: {
    fontFamily: AuthFonts.display,
    fontSize: 28,
    color: Colors.dark,
  },
  heroCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  logoPress: { position: 'relative' },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: { flex: 1, gap: 4 },
  name: { ...Typography.h3, color: Colors.dark },
  meta: { ...Typography.caption, color: Colors.muted },
  hint: { ...Typography.caption, color: Colors.mutedLight },
  badgeRow: { flexDirection: 'row', marginTop: 4 },
});
