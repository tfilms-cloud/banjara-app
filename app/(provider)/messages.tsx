import { ConversationListScreen } from '@/components/chat/ConversationListScreen';

export default function ProviderMessagesScreen() {
  return (
    <ConversationListScreen
      threadBasePath="/(provider)/messages"
      backHref="/(provider)/(tabs)/profile"
    />
  );
}
