import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { DEFAULT_DOCUMENTS } from '@/constants/providerOptions';

const toneMap = {
  not_submitted: 'gray' as const,
  pending: 'amber' as const,
  verified: 'green' as const,
  rejected: 'red' as const,
};

const labelMap = {
  not_submitted: 'Not Submitted',
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected',
};

export default function ProviderVerificationScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Header title="Verification" showBack fallbackHref="/(provider)/register/business" />
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40, gap: Spacing.md }}>
        <Text style={styles.heading}>Business Verification</Text>
        <Text style={styles.sub}>
          Document upload is disabled in this prototype. Statuses are placeholders for a future secure verification flow.
        </Text>

        {DEFAULT_DOCUMENTS.map((doc) => (
          <View key={doc.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{doc.label}</Text>
              <Text style={styles.meta}>{doc.category}</Text>
            </View>
            <Badge label={labelMap[doc.status]} tone={toneMap[doc.status]} />
          </View>
        ))}

        <Button title="Continue to Review" onPress={() => router.push('/(provider)/register/review')} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heading: { ...Typography.h2, color: Colors.primary },
  sub: { ...Typography.body, color: Colors.muted, marginBottom: Spacing.md, lineHeight: 22 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: { ...Typography.bodyBold, color: Colors.primary },
  meta: { ...Typography.caption, color: Colors.muted, textTransform: 'capitalize' },
});
