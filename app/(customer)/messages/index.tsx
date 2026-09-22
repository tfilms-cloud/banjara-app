import { ConversationListScreen } from '@/components/chat/ConversationListScreen';

export default function CustomerMessagesScreen() {
  return (
    <ConversationListScreen
      threadBasePath="/(customer)/messages"
      backHref="/(customer)/(tabs)/profile"
    />
  );
}
