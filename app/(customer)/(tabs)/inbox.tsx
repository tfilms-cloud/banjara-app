import { ConversationListScreen } from '@/components/chat/ConversationListScreen';

/** Customer Messages tab — reuses existing chat inbox (Socket.IO unchanged). */
export default function CustomerMessagesTab() {
  return (
    <ConversationListScreen
      threadBasePath="/(customer)/messages"
      backHref="/(customer)/(tabs)"
    />
  );
}
