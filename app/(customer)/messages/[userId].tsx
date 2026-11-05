import { useLocalSearchParams } from 'expo-router';
import { ChatThread } from '@/components/chat/ChatThread';
import { useChatStore } from '@/store/chatStore';
import { paramId } from '@/utils/navigation';
import { TravelDesignProvider } from '@/components/ui/TravelDesignProvider';
import { useBookingStore } from '@/store/bookingStore';

export default function CustomerChatScreen() {
  const params = useLocalSearchParams<{
    userId: string | string[];
    bookingId?: string | string[];
  }>();
  const userId = paramId(params.userId);
  const bookingId = paramId(params.bookingId) || undefined;
  const conversations = useChatStore((s) => s.conversations);
  const conversation = conversations.find((item) => item.otherUserId === userId);
  const selectedTrip = useBookingStore((state) => state.selectedTrip);
  const agency = selectedTrip?.agency.userId === userId ? selectedTrip.agency : undefined;
  const title = conversation?.otherUserName ?? agency?.name ?? 'Provider';

  return (
    <TravelDesignProvider>
      <ChatThread
        otherUserId={userId}
        title={title}
        bookingId={bookingId}
        avatarUri={conversation?.otherUserAvatar ?? agency?.logo}
        backHref="/(customer)/messages"
      />
    </TravelDesignProvider>
  );
}
