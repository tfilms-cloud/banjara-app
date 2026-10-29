import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { TERMS_CONTENT, TERMS_ROLES, type TermsRole } from '@/constants/terms';
import { Fonts, Typography } from '@/constants/typography';

function isTermsRole(value: string | undefined): value is TermsRole {
  return Boolean(value && value in TERMS_CONTENT);
}

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ role?: string | string[] }>();
  const raw = Array.isArray(params.role) ? params.role[0] : params.role;
  const role: TermsRole = isTermsRole(raw) ? raw : 'customer';
  const doc = TERMS_CONTENT[role];

  return (
    <View style={styles.container}>
      <Header title="Terms & Conditions" showBack />
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + 40,
          gap: Spacing.lg,
        }}
      >
        <Text style={styles.title}>{doc.title}</Text>
        <Text style={styles.updated}>Updated {doc.updated}</Text>
        <View style={styles.roleRow}>
          {TERMS_ROLES.map((item) => (
            <Text
              key={item.id}
              style={[styles.roleChip, item.id === role && styles.roleChipOn]}
            >
              {item.label}
            </Text>
          ))}
        </View>
        {doc.sections.map((section) => (
          <View key={section.heading} style={styles.card}>
            <Text style={styles.heading}>{section.heading}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { ...Typography.h2, color: Colors.primary },
  updated: { ...Typography.caption, color: Colors.muted },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  roleChip: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleChipOn: {
    color: Colors.primary,
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
    fontFamily: Fonts.bodySemiBold,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  heading: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.dark },
  body: { ...Typography.body, color: Colors.muted, lineHeight: 22 },
});
