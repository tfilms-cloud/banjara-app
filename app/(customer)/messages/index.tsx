import { ConversationListScreen } from '@/components/chat/ConversationListScreen';
import { TravelDesignProvider } from '@/components/ui/TravelDesignProvider';

export default function CustomerMessagesScreen() {
  return (
    <TravelDesignProvider>
      <ConversationListScreen
        threadBasePath="/(customer)/messages"
        backHref="/(customer)/(tabs)/profile"
      />
    </TravelDesignProvider>
  );
}
