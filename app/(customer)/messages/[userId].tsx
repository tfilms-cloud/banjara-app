import { useLocalSearchParams } from 'expo-router';
import { ChatThread } from '@/components/chat/ChatThread';
import { useChatStore } from '@/store/chatStore';
import { paramId } from '@/utils/navigation';

export default function CustomerChatScreen() {
  const params = useLocalSearchParams<{ userId: string | string[]; bookingId?: string | string[] }>();
  const userId = paramId(params.userId);
  const bookingId = paramId(params.bookingId) || undefined;
  const conversations = useChatStore((s) => s.conversations);
  const conversation = conversations.find((item) => item.otherUserId === userId);
  const title = conversation?.otherUserName ?? 'Provider';

  return (
    <ChatThread
      otherUserId={userId}
      title={title}
      bookingId={bookingId}
      avatarUri={conversation?.otherUserAvatar}
      backHref="/(customer)/messages"
    />
  );
}
