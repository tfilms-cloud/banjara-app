import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Avatar uri={avatarUri} name={name} size={72} />
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  name: { ...Typography.h2, color: Colors.primary, marginTop: Spacing.md },
  meta: { ...Typography.body, color: Colors.muted, marginTop: 4 },
  presence: { ...Typography.caption, color: Colors.secondary, marginTop: Spacing.sm },
  close: { marginTop: Spacing.lg, padding: Spacing.sm },
  closeText: { ...Typography.body, color: Colors.muted },
});
