import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { type ColorTokens } from '@/constants/colors';
import { Radius, Shadows, Spacing, Size } from '@/constants/spacing';
import { CustomerType, Typography } from '@/constants/typography';
import { formatPresenceLabel } from '@/components/chat/chatTime';

type Props = {
  visible: boolean;
  onClose: () => void;
  name: string;
  role?: string;
  avatarUri?: string;
  online?: boolean;
  lastSeenAt?: string | null;
  onViewProfile?: () => void;
};

export function ChatProfilePreview({
  visible,
  onClose,
  name,
  role,
  avatarUri,
  online,
  lastSeenAt,
  onViewProfile,
}: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Avatar uri={avatarUri} name={name} size={Size.profileAvatar} />
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>
            {role === 'provider' ? 'Travel provider' : role === 'customer' ? 'Customer' : 'Banjara user'}
          </Text>
          <Text style={styles.presence}>{formatPresenceLabel(online, lastSeenAt)}</Text>
          {onViewProfile ? (
            <Button title="View profile" onPress={onViewProfile} style={{ marginTop: Spacing.md }} />
          ) : null}
          <Pressable onPress={onClose} style={styles.close}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: Size.modal,
    backgroundColor: colors.card,
    borderRadius: Radius.xl,
    ...Shadows.float,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: Size.border,
    borderColor: colors.border,
  },
  name: { ...CustomerType.section, textAlign: 'center', color: colors.dark, marginTop: Spacing.md },
  meta: { ...CustomerType.body, color: colors.muted, marginTop: Spacing.xs },
  presence: { ...Typography.caption, color: colors.secondary, marginTop: Spacing.sm },
  close: { marginTop: Spacing.lg, padding: Spacing.sm },
  closeText: { ...Typography.body, color: colors.muted },
});
