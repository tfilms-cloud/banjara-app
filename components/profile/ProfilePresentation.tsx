import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { TravelSurface } from '@/components/ui/TravelPrimitives';
import { useHomeDesign } from '@/constants/homeDesign';
import { Radius } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import type { User } from '@/types/user';

export function ProfileHeading({ signedIn }: { signedIn: boolean }) {
  const theme = useHomeDesign();
  return (
    <View style={s.heading}>
      <View style={s.flex}>
        <Text style={[s.eyebrow, { color: theme.primary }]}>NOMAD EXPLORER</Text>
        <Text accessibilityRole="header" style={[s.headingTitle, { color: theme.text }]}>
          Profile & Account
        </Text>
      </View>
      <View style={[s.role, { backgroundColor: theme.soft, borderColor: theme.border }]}>
        <View style={[s.dot, { backgroundColor: theme.action }]} />
        <Text style={[s.roleText, { color: theme.primary }]}>
          {signedIn ? 'Traveler' : 'Guest'}
        </Text>
      </View>
    </View>
  );
}

export function ProfileIdentityCard({
  person,
  uploading,
  journeys,
  saved,
  onPhoto,
  onEdit,
}: {
  person?: User | null;
  uploading: boolean;
  journeys?: number;
  saved: number;
  onPhoto?: () => void;
  onEdit: () => void;
}) {
  const theme = useHomeDesign();
  return (
    <TravelSurface style={[s.identity, { borderColor: theme.border }]}>
      <Pressable
        onPress={onPhoto}
        disabled={!onPhoto || uploading}
        accessibilityRole="button"
        accessibilityLabel="Change profile photo"
        accessibilityState={{ disabled: !onPhoto || uploading, busy: uploading }}
        style={s.photo}
      >
        <Avatar name={person?.name || 'Guest'} uri={person?.avatar} size={80} />
        {onPhoto ? (
          <View style={[s.camera, { backgroundColor: theme.action, borderColor: theme.surface }]}>
            {uploading ? (
              <ActivityIndicator size="small" color={theme.background} />
            ) : (
              <Ionicons name="camera-outline" size={16} color={theme.background} />
            )}
          </View>
        ) : null}
      </Pressable>
      <View style={s.identityCopy}>
        <Text style={[s.name, { color: theme.text }]}>{person?.name || 'Guest traveler'}</Text>
        {person?.email ? (
          <Text style={[s.email, { color: theme.text }]}>{person.email}</Text>
        ) : null}
        <Text style={[s.hint, { color: theme.primary }]}>
          {uploading
            ? 'Uploading…'
            : onPhoto
              ? person?.avatar
                ? 'Tap photo to change'
                : 'Tap to add profile photo'
              : 'Sign in to manage your account'}
        </Text>
      </View>
      <View style={[s.stats, { backgroundColor: theme.field }]}>
        <ProfileStat label="Journeys" value={journeys === undefined ? '—' : String(journeys)} />
        <ProfileStat label="Saved" value={String(saved)} accent />
        <ProfileStat label="Guest score" value="—" unavailable />
      </View>
      <Pressable
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={person ? 'Edit profile' : 'Sign in'}
        style={[s.edit, { backgroundColor: theme.field }]}
      >
        <Ionicons
          name={person ? 'pencil-outline' : 'log-in-outline'}
          size={17}
          color={theme.text}
        />
        <Text style={[s.editText, { color: theme.text }]}>
          {person ? 'Edit profile' : 'Sign in'}
        </Text>
      </Pressable>
    </TravelSurface>
  );
}

function ProfileStat({
  label,
  value,
  accent,
  unavailable,
}: {
  label: string;
  value: string;
  accent?: boolean;
  unavailable?: boolean;
}) {
  const theme = useHomeDesign();
  return (
    <View style={s.stat} accessibilityLabel={`${label}: ${unavailable ? 'not available' : value}`}>
      <Text
        style={[
          s.statValue,
          { color: unavailable ? theme.coral : accent ? theme.primary : theme.text },
        ]}
      >
        {value}
      </Text>
      <Text style={[s.statLabel, { color: theme.text }]}>{label}</Text>
    </View>
  );
}

export function ProfileCountBadge({ value, active = false }: { value: number; active?: boolean }) {
  const theme = useHomeDesign();
  if (value <= 0) return null;
  return (
    <View
      style={[
        s.badge,
        { backgroundColor: active ? theme.soft : theme.coral, borderRadius: active ? 12 : 20 },
      ]}
    >
      <Text style={[s.badgeText, { color: active ? theme.primary : theme.background }]}>
        {value > 99 ? '99+' : value}
        {active ? ' Active' : ''}
      </Text>
    </View>
  );
}

export function ProfileTravelNote() {
  const theme = useHomeDesign();
  return (
    <View style={[s.note, { backgroundColor: theme.field }]}>
      <Ionicons name="compass-outline" size={22} color={theme.primary} />
      <View style={s.flex}>
        <Text style={[s.noteTitle, { color: theme.text }]}>Explore with local providers</Text>
        <Text style={[s.noteBody, { color: theme.text }]}>
          Find rides, stays, tours and guides for your next journey through the north.
        </Text>
      </View>
    </View>
  );
}

export function ProfileVersion({ version }: { version?: string }) {
  const theme = useHomeDesign();
  return (
    <View style={s.version}>
      <Text style={[s.versionText, { color: theme.muted }]}>
        BANJARA{version ? ` v${version}` : ''}
      </Text>
      <Text style={[s.versionText, { color: theme.muted }]}>
        Made for journeys through the north
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 6 },
  eyebrow: { fontFamily: Fonts.bodySemiBold, fontSize: 11, lineHeight: 17, letterSpacing: 0.4 },
  headingTitle: { fontFamily: Fonts.displayBold, fontSize: 20, lineHeight: 27 },
  role: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  roleText: { fontFamily: Fonts.bodyMedium, fontSize: 11 },
  identity: { borderWidth: 1, borderRadius: 32, padding: 24, alignItems: 'center', gap: 16 },
  photo: { width: 80, height: 80 },
  camera: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCopy: { alignItems: 'center', gap: 3, alignSelf: 'stretch' },
  name: { fontFamily: Fonts.displayBold, fontSize: 20, lineHeight: 27, textAlign: 'center' },
  email: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  hint: { fontFamily: Fonts.bodyMedium, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  stats: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  stat: { flex: 1, alignItems: 'center', gap: 3, paddingHorizontal: 3 },
  statValue: { fontFamily: Fonts.displayBold, fontSize: 16, lineHeight: 21 },
  statLabel: { fontFamily: Fonts.body, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  edit: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minHeight: 48,
    borderRadius: 26,
  },
  editText: { fontFamily: Fonts.bodySemiBold, fontSize: 13 },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: Fonts.bodyMedium, fontSize: 10, lineHeight: 14 },
  note: { flexDirection: 'row', gap: 10, padding: 16, borderRadius: 32, alignItems: 'flex-start' },
  noteTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 12, lineHeight: 18 },
  noteBody: { fontFamily: Fonts.body, fontSize: 11, lineHeight: 18, marginTop: 3 },
  version: { alignItems: 'center', gap: 4, paddingTop: 8, paddingBottom: 12 },
  versionText: { fontFamily: Fonts.bodyMedium, fontSize: 11, lineHeight: 18, textAlign: 'center' },
});
