import { get, post } from '@/services/api';
import { asArray, idOf, type AnyRecord } from '@/services/mappers';
import type { ChatConversation, ChatMessage, MessageStatus, MessageType } from '@/types/chat';

function mapConversation(raw: AnyRecord): ChatConversation {
  const otherUserId = String(raw.otherUserId ?? raw.id ?? '');
  return {
    id: otherUserId,
    conversationId: String(raw.conversationId ?? ''),
    otherUserId,
    otherUserName: String(raw.otherUserName ?? raw.customerName ?? 'User'),
    otherUserRole: String(raw.otherUserRole ?? 'customer'),
    otherUserAvatar: raw.otherUserAvatar ? String(raw.otherUserAvatar) : undefined,
    lastMessage: String(raw.lastMessage ?? raw.message ?? ''),
    bookingId: raw.bookingId ? String(raw.bookingId) : undefined,
    unreadCount: Number(raw.unreadCount ?? raw.unread ?? 0),
    updatedAt: String(raw.updatedAt ?? raw.createdAt ?? new Date().toISOString()),
  };
}

function resolveStatus(raw: AnyRecord): MessageStatus {
  if (raw.status === 'sending' || raw.status === 'sent' || raw.status === 'delivered' || raw.status === 'read' || raw.status === 'failed') {
    return raw.status;
  }
  if (raw.readAt) return 'read';
  if (raw.deliveredAt) return 'delivered';
  return 'sent';
}

export function mapMessage(raw: AnyRecord): ChatMessage {
  return {
    id: idOf(raw),
    conversationId: String(raw.conversationId ?? ''),
    senderId: idOf(raw.senderId),
    receiverId: idOf(raw.receiverId),
    bookingId: raw.bookingId ? idOf(raw.bookingId) : undefined,
    type: (raw.type as MessageType) || 'text',
    text: String(raw.message ?? raw.text ?? ''),
    attachments: Array.isArray(raw.attachments) ? raw.attachments.map(String) : [],
    status: resolveStatus(raw),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    deliveredAt: raw.deliveredAt ? String(raw.deliveredAt) : null,
    readAt: raw.readAt ? String(raw.readAt) : null,
    clientTempId: raw.clientTempId ? String(raw.clientTempId) : undefined,
  };
}

export async function listConversations(): Promise<ChatConversation[]> {
  const data = await get<unknown>('/messages');
  return asArray<AnyRecord>(data).map(mapConversation);
}

export async function getUnreadCount(): Promise<number> {
  try {
    const data = await get<AnyRecord>('/messages/unread-count');
    return Number(data?.total ?? 0);
  } catch {
    return 0;
  }
}

export async function getConversation(
  withUserId: string,
  opts?: { page?: number; limit?: number }
): Promise<{ items: ChatMessage[]; page: number; total: number; hasMore: boolean }> {
  const data = await get<unknown>('/messages', {
    params: {
      withUserId,
      page: opts?.page ?? 1,
      limit: opts?.limit ?? 40,
    },
  });

  if (data && typeof data === 'object' && !Array.isArray(data) && 'items' in (data as object)) {
    const pageData = data as AnyRecord;
    const items = asArray<AnyRecord>(pageData.items).map(mapMessage);
    const pagination = (pageData.pagination as AnyRecord | undefined) ?? {};
    const page = Number(pagination.page ?? opts?.page ?? 1);
    const total = Number(pagination.total ?? items.length);
    const limit = Number(pagination.limit ?? opts?.limit ?? 40);
    const totalPages = Number(pagination.totalPages ?? Math.max(1, Math.ceil(total / Math.max(limit, 1))));
    return {
      items,
      page,
      total,
      hasMore: page < totalPages,
    };
  }

  const items = asArray<AnyRecord>(data).map(mapMessage);
  return { items, page: 1, total: items.length, hasMore: false };
}

export async function sendMessageRest(input: {
  receiverId: string;
  message: string;
  bookingId?: string;
  type?: MessageType;
  attachments?: string[];
}): Promise<ChatMessage> {
  const data = await post<AnyRecord>('/messages', {
    receiverId: input.receiverId,
    message: input.message,
    bookingId: input.bookingId,
    type: input.type ?? 'text',
    attachments: input.attachments ?? [],
  });
  return mapMessage(data);
}

export async function markRead(conversationId: string): Promise<void> {
  await post('/messages/read', { conversationId });
}
