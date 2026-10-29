import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { isGuideService } from '@/constants/providerOptions';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as tourItineraryService from '@/services/tourItineraryService';
import { useProviderStore } from '@/store/providerStore';
import type { TourItinerary } from '@/types/tourItinerary';
import { formatCurrency } from '@/utils/formatCurrency';
import { normalizeMediaUrl } from '@/utils/mediaUrl';
import { pushPath } from '@/utils/navigation';

function statusTone(status: string): 'green' | 'amber' | 'red' | 'gray' {
  if (status === 'published') return 'green';
  if (status === 'pending') return 'amber';
  if (status === 'rejected') return 'red';
  return 'gray';
}

export default function ProviderItinerariesScreen() {
  const insets = useSafeAreaInsets();
  const provider = useProviderStore((s) => s.provider);
  const isGuide = provider?.services?.some((s) => isGuideService(s));
  const [items, setItems] = useState<TourItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isGuide) {
      router.replace('/(provider)/(tabs)/services');
    }
  }, [isGuide]);

  const load = useCallback(async (soft = false) => {
    if (soft) setRefreshing(true);
    else setLoading(true);
    try {
      setItems(await tourItineraryService.listMine());
    } catch (error) {
      Alert.alert('Could not load', getApiErrorMessage(error));
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const onDelete = (item: TourItinerary) => {
    Alert.alert(
      item.status === 'published' ? 'Unpublish itinerary?' : 'Delete itinerary?',
      item.status === 'published'
        ? 'This will take the package off the traveler catalog.'
        : 'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: item.status === 'published' ? 'Unpublish' : 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await tourItineraryService.deleteItinerary(item.id);
                void load(true);
              } catch (error) {
                Alert.alert('Failed', getApiErrorMessage(error));
              }
            })();
          },
        },
      ]
    );
  };

  if (loading) return <LoadingState title="Loading itineraries..." />;

  return (
    <View style={styles.container}>
      <Header title="Tour itineraries" showBack fallbackHref="/(provider)/(tabs)/services" />
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + 40,
          gap: Spacing.md,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={Colors.primary} />
        }
      >
        <Button
          title="Add itinerary"
          onPress={() => router.push('/(provider)/itineraries/add')}
        />

        {!items.length ? (
          <EmptyState
            icon="compass-outline"
            title="No itineraries yet"
            message="Create trek, expedition or summit packages travelers can browse."
          />
        ) : (
          items.map((item) => (
            <Pressable
              key={item.id}
              style={styles.card}
              onPress={() => pushPath(`/(provider)/itineraries/add?id=${item.id}`)}
            >
              <Image
                source={{ uri: normalizeMediaUrl(item.coverImage) ?? item.coverImage }}
                style={styles.cover}
                contentFit="cover"
              />
              <View style={styles.body}>
                <View style={styles.row}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Badge label={item.status} tone={statusTone(item.status)} />
                </View>
                <Text style={styles.meta} numberOfLines={1}>
                  {item.tourType} · {item.destination} · {item.durationDays}d
                </Text>
                <Text style={styles.price}>{formatCurrency(item.pricePerPerson)} / person</Text>
                {item.rejectionReason ? (
                  <Text style={styles.reject} numberOfLines={2}>
                    Rejected: {item.rejectionReason}
                  </Text>
                ) : null}
                <View style={styles.actions}>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => pushPath(`/(provider)/itineraries/add?id=${item.id}`)}
                  >
                    <Ionicons name="create-outline" size={16} color={Colors.primary} />
                    <Text style={styles.actionText}>Edit</Text>
                  </Pressable>
                  <Pressable style={styles.actionBtn} onPress={() => onDelete(item)}>
                    <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                    <Text style={[styles.actionText, { color: Colors.danger }]}>
                      {item.status === 'published' ? 'Unpublish' : 'Delete'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cover: { width: '100%', height: 140 },
  body: { padding: Spacing.md, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontFamily: Fonts.display, fontSize: 16, color: Colors.dark },
  meta: { ...Typography.caption, color: Colors.muted, textTransform: 'capitalize' },
  price: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.primary },
  reject: { ...Typography.caption, color: Colors.danger },
  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.primary },
});
