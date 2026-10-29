import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { AppearanceToggle } from '@/components/ui/AppearanceToggle';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { MenuList } from '@/components/ui/MenuList';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as uploadService from '@/services/uploadService';
import * as userService from '@/services/userService';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const { profile, loadProfile } = useUserStore();
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const person = profile ?? user;

  const onChangeAvatar = async () => {
    try {
      setUploading(true);
      const uploaded = await uploadService.pickAndUpload('avatars', {
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!uploaded) return;
      await userService.updateAvatar(uploaded.url);
      await Promise.all([loadProfile(), refreshUser()]);
    } catch (error) {
      Alert.alert('Avatar update failed', getApiErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Profile" />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.screen,
          paddingBottom: insets.bottom + 24,
          gap: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Pressable
            onPress={() => void onChangeAvatar()}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
          >
            <Avatar uri={person?.avatar} name={person?.name} size={80} />
          </Pressable>
          <Text style={styles.name}>{person?.name ?? 'Guest'}</Text>
          <Text style={styles.meta}>{person?.email}</Text>
          <Text style={styles.hint}>
            {uploading ? 'Uploading…' : person?.avatar ? 'Tap photo to change' : 'Tap to add profile photo'}
          </Text>
          <Button
            title="Edit profile"
            variant="outline"
            onPress={() => router.push('/(customer)/settings')}
            style={{ marginTop: Spacing.sm, alignSelf: 'stretch' }}
          />
        </View>

        <AppearanceToggle />

        <MenuList
          items={[
            {
              key: 'bookings',
              label: 'My bookings',
              icon: 'ticket-outline',
              onPress: () => router.push('/(customer)/(tabs)/bookings'),
            },
            {
              key: 'payments',
              label: 'Payments / Transactions',
              icon: 'wallet-outline',
              onPress: () => router.push('/(customer)/payments'),
            },
            {
              key: 'messages',
              label: 'Messages',
              icon: 'chatbubble-outline',
              onPress: () => router.push('/(customer)/(tabs)/inbox'),
            },
            {
              key: 'favorites',
              label: 'Favorites',
              icon: 'heart-outline',
              onPress: () => router.push('/(customer)/(tabs)/hotels'),
            },
            {
              key: 'notifications',
              label: 'Notifications',
              icon: 'notifications-outline',
              onPress: () => router.push('/(customer)/(tabs)/notifications'),
            },
            {
              key: 'settings',
              label: 'Settings',
              icon: 'settings-outline',
              onPress: () => router.push('/(customer)/settings'),
            },
            {
              key: 'help',
              label: 'Help & support',
              icon: 'help-circle-outline',
              onPress: () => router.push('/(customer)/settings'),
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
  root: { flex: 1, backgroundColor: Colors.background },
  hero: {
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing['2xl'],
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontFamily: Fonts.bodyBold,
    fontSize: 20,
    color: Colors.dark,
    marginTop: Spacing.sm,
  },
  meta: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
  },
  hint: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
  },
});
