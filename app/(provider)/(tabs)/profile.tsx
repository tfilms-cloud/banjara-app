import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import * as userService from '@/services/userService';
import { useAuthStore } from '@/store/authStore';
import { useProviderStore } from '@/store/providerStore';
import { normalizeMediaUrl } from '@/utils/mediaUrl';
import { pushPath } from '@/utils/navigation';

export default function ProviderProfileScreen() {
  const insets = useSafeAreaInsets();
  const logout = useAuthStore((s) => s.logout);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const user = useAuthStore((s) => s.user);
  const provider = useProviderStore((s) => s.provider);
  const loadProvider = useProviderStore((s) => s.loadProvider);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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

  const onChangeAvatar = async () => {
    try {
      setUploadingAvatar(true);
      const uploaded = await uploadService.pickAndUpload('avatars', {
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!uploaded) return;
      await userService.updateAvatar(uploaded.url);
      await refreshUser();
    } catch (error) {
      Alert.alert('Avatar update failed', getApiErrorMessage(error));
    } finally {
      setUploadingAvatar(false);
    }
  };

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
          <Image
            source={{
              uri:
                normalizeMediaUrl(provider?.logo) ??
                normalizeMediaUrl(user?.avatar) ??
                'https://i.pravatar.cc/150?u=provider',
            }}
            style={styles.logo}
          />
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={12} color={Colors.white} />
          </View>
        </Pressable>
        <View style={styles.heroCopy}>
          <Text style={styles.name}>{provider?.businessName ?? 'Provider'}</Text>
          <Text style={styles.meta}>{provider?.ownerName}</Text>
          <Text style={styles.hint}>
            {uploadingLogo ? 'Uploading logo…' : 'Tap photo to change logo'}
          </Text>
          <View style={styles.badgeRow}>
            <Badge
              label={
                provider?.verificationStatus === 'approved'
                  ? 'Verified'
                  : provider?.verificationStatus ?? 'pending'
              }
              tone={provider?.verificationStatus === 'approved' ? 'green' : 'amber'}
            />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Contact</Text>
        <Text style={styles.meta}>{provider?.phone || '—'}</Text>
        <Text style={styles.meta}>{provider?.email || '—'}</Text>
        <Text style={styles.meta}>
          {[provider?.address, provider?.city].filter(Boolean).join(', ') || '—'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Services</Text>
        <Text style={styles.meta}>
          {provider?.services?.[0] ? serviceLabel(provider.services[0]) : 'No service yet'}
        </Text>
        <Text style={styles.meta}>
          Rating {provider?.rating ?? 0} · {provider?.reviewCount ?? 0} reviews
        </Text>
        {provider?.description ? (
          <Text style={styles.body}>{provider.description}</Text>
        ) : null}
      </View>

      <MenuList
        items={[
          {
            key: 'avatar',
            label: uploadingAvatar ? 'Uploading photo…' : 'Change account photo',
            icon: 'camera-outline',
            onPress: () => {
              if (!uploadingAvatar) void onChangeAvatar();
            },
          },
          {
            key: 'services',
            label: 'Manage service',
            subtitle: 'Edit your one service',
            icon: 'layers-outline',
            onPress: () => router.push('/(provider)/(tabs)/services'),
          },
          {
            key: 'reviews',
            label: 'Reviews',
            icon: 'star-outline',
            onPress: () => pushPath('/(provider)/reviews'),
          },
          {
            key: 'messages',
            label: 'Messages',
            icon: 'chatbubble-outline',
            onPress: () => pushPath('/(provider)/messages'),
          },
          {
            key: 'notifications',
            label: 'Notifications',
            icon: 'notifications-outline',
            onPress: () => pushPath('/(provider)/notifications'),
          },
          {
            key: 'settings',
            label: 'Settings',
            icon: 'settings-outline',
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  screenTitle: {
    fontFamily: AuthFonts.displayBold,
    fontSize: 28,
    color: Colors.dark,
    letterSpacing: -0.4,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoPress: {
    position: 'relative',
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.border,
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  heroCopy: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    marginTop: Spacing.sm,
  },
  name: {
    fontFamily: AuthFonts.bodyBold,
    fontSize: 18,
    color: Colors.dark,
  },
  hint: {
    ...Typography.small,
    color: Colors.primary,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  section: {
    fontFamily: AuthFonts.bodySemiBold,
    fontSize: 16,
    color: Colors.dark,
    marginBottom: 2,
  },
  meta: {
    fontFamily: AuthFonts.body,
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 18,
  },
  body: {
    fontFamily: AuthFonts.body,
    fontSize: 14,
    color: Colors.dark,
    marginTop: Spacing.sm,
    lineHeight: 21,
  },
});
