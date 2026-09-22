import { useLocalSearchParams } from 'expo-router';
import { ChatThread } from '@/components/chat/ChatThread';
import { useChatStore } from '@/store/chatStore';
import { paramId } from '@/utils/navigation';

export default function ProviderChatScreen() {
  const params = useLocalSearchParams<{ id: string | string[]; bookingId?: string | string[] }>();
  const userId = paramId(params.id);
  const bookingId = paramId(params.bookingId) || undefined;
  const conversations = useChatStore((s) => s.conversations);
  const conversation = conversations.find((item) => item.otherUserId === userId);
  const title = conversation?.otherUserName ?? 'Customer';

  return (
    <ChatThread
      otherUserId={userId}
      title={title}
      bookingId={bookingId}
      avatarUri={conversation?.otherUserAvatar}
      backHref="/(provider)/messages"
    />
  );
}
