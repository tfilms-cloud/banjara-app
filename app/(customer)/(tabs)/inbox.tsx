import { ConversationListScreen } from '@/components/chat/ConversationListScreen';
import { TravelDesignProvider } from '@/components/ui/TravelDesignProvider';

/** Customer Messages tab — reuses existing chat inbox (Socket.IO unchanged). */
export default function CustomerMessagesTab() {
  return (
    <TravelDesignProvider>
      <ConversationListScreen
        threadBasePath="/(customer)/messages"
        backHref="/(customer)/(tabs)"
        tab
      />
    </TravelDesignProvider>
  );
}
