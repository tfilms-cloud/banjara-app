import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useProviderStore } from '@/store/providerStore';

export default function ProviderNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const notifications = useProviderStore((s) => s.notifications);

  return (
    <View style={styles.container}>
      <Header title="Notifications" showBack fallbackHref={'/(provider)/(tabs)' as never} />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md, paddingBottom: insets.bottom + 24 }}
        ListEmptyComponent={<EmptyState title="No notifications" icon="notifications-outline" />}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.read && styles.unread]}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.meta}>
              {item.type.replace('_', ' ')} · {new Date(item.createdAt).toLocaleString()}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  unread: { borderColor: Colors.secondary, backgroundColor: Colors.softBlue },
  title: { ...Typography.h3, color: Colors.primary },
  body: { ...Typography.body, color: Colors.dark },
  meta: { ...Typography.caption, color: Colors.muted, textTransform: 'capitalize' },
});
