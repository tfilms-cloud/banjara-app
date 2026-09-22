export type ChatRole = 'customer' | 'provider' | 'admin' | string;
export type MessageType = 'text' | 'image' | 'file' | 'location' | 'trip';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatConversation {
  id: string;
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserRole: ChatRole;
  otherUserAvatar?: string;
  lastMessage: string;
  bookingId?: string;
  unreadCount: number;
  updatedAt: string;
  online?: boolean;
  lastSeenAt?: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  bookingId?: string;
  type: MessageType;
  text: string;
  attachments?: string[];
  status: MessageStatus;
  createdAt: string;
  deliveredAt?: string | null;
  readAt?: string | null;
  clientTempId?: string;
}

export interface UserPresence {
  userId: string;
  online: boolean;
  lastSeenAt: string | null;
}

export function buildConversationId(a: string, b: string) {
  return [a, b].sort().join(':');
}
