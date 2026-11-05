import { useBackendFocusEffect as useFocusEffect } from '@/hooks/useBackendFocusEffect';
import { useBackendState } from '@/hooks/useBackendData';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeBenefits, HomeTopBar } from '@/components/home/HomeDiscovery';
import {
  ProfileCountBadge,
  ProfileHeading,
  ProfileIdentityCard,
  ProfileTravelNote,
  ProfileVersion,
} from '@/components/profile/ProfilePresentation';
import { AppearanceToggle } from '@/components/ui/AppearanceToggle';
import { MenuList } from '@/components/ui/MenuList';
import { TravelDesignProvider } from '@/components/ui/TravelDesignProvider';
import { useHomeDesign } from '@/constants/homeDesign';
import { Fonts } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import { getAllMyBookings } from '@/services/bookingService';
import * as uploadService from '@/services/uploadService';
import * as userService from '@/services/userService';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useUserStore } from '@/store/userStore';
import {
  profileAccountPerson,
  profileBookingStats,
  profileSavedCount,
} from '@/utils/profilePresentation';

export default function ProfileScreen() {
  return (
    <TravelDesignProvider>
      <ProfileContent />
    </TravelDesignProvider>
  );
}

function ProfileContent() {
  const theme = useHomeDesign();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const profile = useUserStore((state) => state.profile);
  const loadProfile = useUserStore((state) => state.loadProfile);
  const notifications = useUserStore((state) => state.notifications);
  const loadNotifications = useUserStore((state) => state.loadNotifications);
  const unreadTotal = useChatStore((state) => state.unreadTotal);
  const [uploading, setUploading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [overview, setOverview] = useBackendState<{
    userId: string;
    journeys: number;
    active: number;
  } | null>(null);
  const signedIn = Boolean(user && user.id !== 'guest');
  const userId = signedIn ? user?.id : undefined;
  const person = profileAccountPerson(user, profile);
  const counts = overview?.userId === userId ? overview : null;

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let current = true;
      void loadProfile();
      void loadNotifications();
      void getAllMyBookings()
        .then((records) => {
          if (current) setOverview({ userId, ...profileBookingStats(records) });
        })
        .catch(() => {
          if (current) setOverview(null);
        });
      return () => {
        current = false;
      };
    }, [userId, loadProfile, loadNotifications]),
  );

  const onChangeAvatar = async () => {
    if (!signedIn || uploading) return;
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
  const onLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
      router.replace('/(auth)/welcome');
    } catch (error) {
      Alert.alert('Could not sign out', getApiErrorMessage(error));
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <HomeTopBar
        name={person?.name}
        avatar={person?.avatar}
        unread={signedIn && notifications.some((item) => !item.read)}
        onSearch={() => router.push('/(customer)/(tabs)/search')}
        onNotifications={() => router.push('/(customer)/(tabs)/notifications')}
        onProfile={() => scroll.current?.scrollTo({ y: 0, animated: true })}
      />
      <ScrollView
        ref={scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: insets.bottom + 24,
          gap: 16,
        }}
      >
        <ProfileHeading signedIn={signedIn} />
        <ProfileIdentityCard
          person={person}
          uploading={uploading}
          journeys={signedIn ? counts?.journeys : 0}
          saved={profileSavedCount(person?.savedTripIds ?? [])}
          onPhoto={signedIn ? () => void onChangeAvatar() : undefined}
          onEdit={() => router.push(signedIn ? '/(customer)/settings' : '/(auth)/login')}
        />
        <AppearanceToggle />
        <MenuList
          items={[
            {
              key: 'bookings',
              label: 'My bookings',
              subtitle: 'Your rides, stays, tours and guides',
              icon: 'bag-outline',
              onPress: () => router.push('/(customer)/(tabs)/bookings'),
              trailing: counts ? <ProfileCountBadge value={counts.active} active /> : undefined,
            },
            {
              key: 'payments',
              label: 'Payments / Transactions',
              subtitle: 'Payment details and booking transactions',
              icon: 'wallet-outline',
              onPress: () => router.push('/(customer)/payments'),
            },
            {
              key: 'messages',
              label: 'Messages',
              subtitle: 'Chats with your travel providers',
              icon: 'chatbubbles-outline',
              onPress: () => router.push('/(customer)/(tabs)/inbox'),
              trailing: signedIn ? <ProfileCountBadge value={unreadTotal} /> : undefined,
            },
            {
              key: 'favorites',
              label: 'Favorites',
              subtitle: 'Stays and places to discover',
              icon: 'heart-outline',
              onPress: () => router.push('/(customer)/(tabs)/hotels'),
            },
            {
              key: 'notifications',
              label: 'Notifications',
              subtitle: 'Booking updates and travel notifications',
              icon: 'notifications-outline',
              onPress: () => router.push('/(customer)/(tabs)/notifications'),
            },
            {
              key: 'settings',
              label: 'Settings',
              subtitle: 'Manage your profile and preferences',
              icon: 'options-outline',
              onPress: () => router.push('/(customer)/settings'),
            },
            {
              key: 'help',
              label: 'Help & support',
              subtitle: 'Account settings and support options',
              icon: 'headset-outline',
              onPress: () => router.push('/(customer)/settings'),
            },
          ]}
        />
        <ProfileTravelNote />
        <HomeBenefits />
        {signingOut ? (
          <Text
            accessibilityRole="alert"
            style={{
              fontFamily: Fonts.body,
              fontSize: 12,
              color: theme.muted,
              textAlign: 'center',
            }}
          >
            Signing out…
          </Text>
        ) : (
          <MenuList
            items={[
              {
                key: 'logout',
                label: signedIn ? 'Log out' : 'Sign in',
                subtitle: signedIn
                  ? 'Safely sign out on this device'
                  : 'Access your bookings and account',
                icon: signedIn ? 'log-out-outline' : 'log-in-outline',
                danger: signedIn,
                onPress: () => {
                  if (signedIn) void onLogout();
                  else router.push('/(auth)/login');
                },
              },
            ]}
          />
        )}
        <ProfileVersion version={Constants.expoConfig?.version} />
      </ScrollView>
    </View>
  );
}
