import { create } from 'zustand';
import * as messageService from '@/services/message.service';
import { mapMessage } from '@/services/message.service';
import type { AnyRecord } from '@/services/mappers';
import * as socketService from '@/services/socket';
import { useAuthStore } from '@/store/authStore';
import type { ChatConversation, ChatMessage, UserPresence } from '@/types/chat';
import { buildConversationId } from '@/types/chat';

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

type ChatState = {
  conversations: ChatConversation[];
  messages: ChatMessage[];
  activeOtherUserId: string | null;
  activeConversationId: string | null;
  activeBookingId?: string;
  typingUserId: string | null;
  presenceByUser: Record<string, UserPresence>;
  unreadTotal: number;
  loadingInbox: boolean;
  loadingThread: boolean;
  loadingOlder: boolean;
  hasMoreOlder: boolean;
  messagePage: number;
  sending: boolean;
  error: string | null;
  connected: boolean;
  connectionStatus: ConnectionStatus;
  listenersBound: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  loadInbox: () => Promise<void>;
  refreshUnread: () => Promise<void>;
  openThread: (otherUserId: string, opts?: { bookingId?: string }) => Promise<void>;
  closeThread: () => void;
  loadOlder: () => Promise<void>;
  send: (text: string, opts?: { type?: ChatMessage['type']; attachments?: string[] }) => Promise<void>;
  retryFailed: (messageId: string) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  markRead: () => Promise<void>;
  requestPresence: (userId: string) => void;
};

function myUserId() {
  return useAuthStore.getState().user?.id ?? '';
}

function sortConversations(list: ChatConversation[]) {
  return [...list].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

function upsertMessage(list: ChatMessage[], message: ChatMessage) {
  const byId = list.findIndex((item) => item.id === message.id);
  if (byId >= 0) {
    const next = [...list];
    next[byId] = { ...next[byId], ...message };
    return next;
  }

  if (message.clientTempId) {
    const byTemp = list.findIndex(
      (item) => item.clientTempId === message.clientTempId || item.id === message.clientTempId
    );
    if (byTemp >= 0) {
      const next = [...list];
      next[byTemp] = { ...next[byTemp], ...message, clientTempId: undefined };
      return next;
    }
  }

  // Reconcile socket echo of our own send against optimistic temp rows
  // (echo often arrives without clientTempId before/after the ack).
  const pendingIdx = list.findIndex((item) => {
    const isTemp = item.id.startsWith('temp-') || item.status === 'sending';
    if (!isTemp) return false;
    if (item.senderId !== message.senderId || item.receiverId !== message.receiverId) return false;
    if ((item.text || '') !== (message.text || '')) return false;
    const sameAttachments =
      JSON.stringify(item.attachments ?? []) === JSON.stringify(message.attachments ?? []);
    if (!sameAttachments) return false;
    const delta = Math.abs(
      new Date(item.createdAt).getTime() - new Date(message.createdAt).getTime()
    );
    return delta < 90_000;
  });
  if (pendingIdx >= 0) {
    const next = [...list];
    next[pendingIdx] = { ...next[pendingIdx], ...message, clientTempId: undefined };
    return next;
  }

  return [...list, message].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

function totalUnread(conversations: ChatConversation[]) {
  return conversations.reduce((sum, item) => sum + (item.unreadCount || 0), 0);
}

function applyIncomingToInbox(
  conversations: ChatConversation[],
  message: ChatMessage,
  me: string,
  activeOtherUserId: string | null
) {
  const counterpart = message.senderId === me ? message.receiverId : message.senderId;
  const involvesActive =
    Boolean(activeOtherUserId) &&
    (message.senderId === activeOtherUserId || message.receiverId === activeOtherUserId);
  const existing = conversations.find((item) => item.otherUserId === counterpart);
  const unreadBump = involvesActive || message.senderId === me ? 0 : 1;

  if (existing) {
    return sortConversations(
      conversations.map((item) =>
        item.otherUserId === counterpart
          ? {
              ...item,
              lastMessage: message.text,
              updatedAt: message.createdAt,
              conversationId: message.conversationId || item.conversationId,
              unreadCount: involvesActive || message.senderId === me ? 0 : item.unreadCount + unreadBump,
            }
          : item
      )
    );
  }

  return sortConversations([
    {
      id: counterpart,
      conversationId: message.conversationId,
      otherUserId: counterpart,
      otherUserName: 'User',
      otherUserRole: 'customer',
      lastMessage: message.text,
      bookingId: message.bookingId,
      unreadCount: involvesActive || message.senderId === me ? 0 : 1,
      updatedAt: message.createdAt,
    },
    ...conversations,
  ]);
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: [],
  activeOtherUserId: null,
  activeConversationId: null,
  activeBookingId: undefined,
  typingUserId: null,
  presenceByUser: {},
  unreadTotal: 0,
  loadingInbox: false,
  loadingThread: false,
  loadingOlder: false,
  hasMoreOlder: false,
  messagePage: 1,
  sending: false,
  error: null,
  connected: false,
  connectionStatus: 'disconnected',
  listenersBound: false,

  connect: async () => {
    set({ connectionStatus: 'connecting' });
    const socket = await socketService.connectSocket();
    if (!socket) {
      set({ connected: false, connectionStatus: 'disconnected' });
      return;
    }

    if (!get().listenersBound) {
      socket.on('connect', () => {
        set({ connected: true, connectionStatus: 'connected' });
        const { activeConversationId, activeOtherUserId } = get();
        if (activeConversationId) {
          socketService.joinConversation(activeConversationId);
          void get().markRead();
        }
        if (activeOtherUserId) socketService.requestPresence(activeOtherUserId);
        void get().refreshUnread();
      });

      socket.on('disconnect', () => {
        set({ connected: false, connectionStatus: 'disconnected' });
      });

      socket.on('reconnect_attempt', () => {
        set({ connectionStatus: 'connecting' });
      });

      const recentMessageIds = new Map<string, number>();

      const onMessage = (raw: AnyRecord) => {
        const message = mapMessage(raw);
        if (!message.id) return;

        // Deduplicate dual socket events (receiveMessage + new_message)
        const seenKey = `msg:${message.id}`;
        const now = Date.now();
        const prev = recentMessageIds.get(seenKey);
        if (prev && now - prev < 2500) return;
        recentMessageIds.set(seenKey, now);

        const me = myUserId();
        const { activeOtherUserId, activeConversationId, messages, conversations } = get();
        const involvesActive =
          Boolean(activeOtherUserId) &&
          (message.senderId === activeOtherUserId || message.receiverId === activeOtherUserId);

        const nextConversations = applyIncomingToInbox(conversations, message, me, activeOtherUserId);

        if (involvesActive) {
          set({
            messages: upsertMessage(messages, message),
            conversations: nextConversations,
            unreadTotal: totalUnread(nextConversations),
          });
          if (message.receiverId === me) {
            if (activeConversationId || message.conversationId) {
              socketService.emitMessageDelivered(activeConversationId || message.conversationId);
            }
            void get().markRead();
          }
        } else {
          set({
            conversations: nextConversations,
            unreadTotal: totalUnread(nextConversations),
          });
          if (message.receiverId === me && message.conversationId) {
            socketService.emitMessageDelivered(message.conversationId);
          }
        }
      };

      socket.on('receiveMessage', onMessage);
      socket.on('new_message', onMessage);

      const onTyping = (payload: { userId?: string; conversationId?: string }) => {
        const { activeOtherUserId, activeConversationId } = get();
        if (!activeOtherUserId || payload.userId !== activeOtherUserId) return;
        if (payload.conversationId && activeConversationId && payload.conversationId !== activeConversationId) {
          return;
        }
        set({ typingUserId: payload.userId ?? null });
      };
      const onStopTyping = (payload: { userId?: string }) => {
        const { typingUserId } = get();
        if (payload.userId && payload.userId === typingUserId) {
          set({ typingUserId: null });
        }
      };
      socket.on('typing', onTyping);
      socket.on('user_typing', onTyping);
      socket.on('stopTyping', onStopTyping);
      socket.on('user_stopped_typing', onStopTyping);

      const onDelivered = (payload: { conversationId?: string; deliveredAt?: string }) => {
        const me = myUserId();
        const { messages, activeConversationId } = get();
        if (!payload.conversationId || payload.conversationId !== activeConversationId) return;
        set({
          messages: messages.map((item) =>
            item.senderId === me && item.status === 'sent'
              ? {
                  ...item,
                  status: 'delivered',
                  deliveredAt: payload.deliveredAt ?? item.deliveredAt ?? new Date().toISOString(),
                }
              : item
          ),
        });
      };
      socket.on('message_delivered', onDelivered);
      socket.on('messageDelivered', onDelivered);

      const onRead = (payload: { conversationId?: string; messageIds?: string[]; readAt?: string }) => {
        const me = myUserId();
        const { messages, activeConversationId } = get();
        if (!payload.conversationId || payload.conversationId !== activeConversationId) return;
        const ids = new Set(payload.messageIds ?? []);
        set({
          messages: messages.map((item) => {
            if (item.senderId !== me) return item;
            if (ids.size > 0 && !ids.has(item.id)) return item;
            return {
              ...item,
              status: 'read',
              readAt: payload.readAt ?? new Date().toISOString(),
              deliveredAt: item.deliveredAt ?? payload.readAt ?? new Date().toISOString(),
            };
          }),
        });
      };
      socket.on('message_read', onRead);
      socket.on('messageRead', onRead);

      socket.on('user_status_changed', (payload: UserPresence) => {
        if (!payload?.userId) return;
        set({
          presenceByUser: {
            ...get().presenceByUser,
            [payload.userId]: {
              userId: payload.userId,
              online: Boolean(payload.online),
              lastSeenAt: payload.lastSeenAt ?? null,
            },
          },
          conversations: get().conversations.map((item) =>
            item.otherUserId === payload.userId
              ? { ...item, online: Boolean(payload.online), lastSeenAt: payload.lastSeenAt ?? null }
              : item
          ),
        });
      });

      socket.on('conversation_updated', () => {
        void get().refreshUnread();
      });

      set({ listenersBound: true });
    }

    set({ connected: socket.connected, connectionStatus: socket.connected ? 'connected' : 'connecting' });
  },

  disconnect: () => {
    socketService.disconnectSocket();
    set({
      connected: false,
      connectionStatus: 'disconnected',
      listenersBound: false,
      conversations: [],
      messages: [],
      activeOtherUserId: null,
      activeConversationId: null,
      typingUserId: null,
      unreadTotal: 0,
      presenceByUser: {},
    });
  },

  refreshUnread: async () => {
    try {
      const total = await messageService.getUnreadCount();
      set({ unreadTotal: total });
    } catch {
      set({ unreadTotal: totalUnread(get().conversations) });
    }
  },

  loadInbox: async () => {
    set({ loadingInbox: true, error: null });
    try {
      await get().connect();
      const conversations = await messageService.listConversations();
      set({
        conversations,
        unreadTotal: totalUnread(conversations),
        loadingInbox: false,
      });
      void get().refreshUnread();
    } catch (error) {
      set({
        loadingInbox: false,
        error: error instanceof Error ? error.message : 'Failed to load messages',
      });
    }
  },

  openThread: async (otherUserId, opts) => {
    if (!otherUserId) return;
    const me = myUserId();
    const conversationId = me ? buildConversationId(me, otherUserId) : '';
    set({
      loadingThread: true,
      error: null,
      activeOtherUserId: otherUserId,
      activeConversationId: conversationId || null,
      activeBookingId: opts?.bookingId,
      messages: [],
      typingUserId: null,
      messagePage: 1,
      hasMoreOlder: false,
    });
    try {
      await get().connect();
      if (conversationId) socketService.joinConversation(conversationId);
      socketService.requestPresence(otherUserId);
      const result = await messageService.getConversation(otherUserId, { page: 1, limit: 40 });
      const resolvedConversationId = result.items[0]?.conversationId || conversationId;
      if (resolvedConversationId) {
        socketService.joinConversation(resolvedConversationId);
        socketService.emitMessageDelivered(resolvedConversationId);
      }
      set({
        messages: result.items,
        activeConversationId: resolvedConversationId || null,
        loadingThread: false,
        hasMoreOlder: result.hasMore,
        messagePage: result.page,
      });
      await get().markRead();
    } catch (error) {
      set({
        loadingThread: false,
        error: error instanceof Error ? error.message : 'Failed to open chat',
      });
    }
  },

  closeThread: () => {
    const { activeConversationId } = get();
    if (activeConversationId) socketService.leaveConversation(activeConversationId);
    set({
      activeOtherUserId: null,
      activeConversationId: null,
      activeBookingId: undefined,
      messages: [],
      typingUserId: null,
      hasMoreOlder: false,
      messagePage: 1,
    });
  },

  loadOlder: async () => {
    const { activeOtherUserId, loadingOlder, hasMoreOlder, messagePage, messages } = get();
    if (!activeOtherUserId || loadingOlder || !hasMoreOlder) return;
    set({ loadingOlder: true });
    try {
      const nextPage = messagePage + 1;
      const result = await messageService.getConversation(activeOtherUserId, {
        page: nextPage,
        limit: 40,
      });
      const merged = [...result.items, ...messages];
      const deduped = merged.reduce<ChatMessage[]>((acc, item) => {
        if (acc.some((m) => m.id === item.id)) return acc;
        acc.push(item);
        return acc;
      }, []);
      deduped.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      set({
        messages: deduped,
        messagePage: nextPage,
        hasMoreOlder: result.hasMore,
        loadingOlder: false,
      });
    } catch {
      set({ loadingOlder: false });
    }
  },

  send: async (text, opts) => {
    const trimmed = text.trim();
    const attachments = opts?.attachments ?? [];
    const type = opts?.type ?? (attachments.length ? 'image' : 'text');
    const { activeOtherUserId, activeBookingId, messages, conversations } = get();
    const me = myUserId();
    if ((!trimmed && !attachments.length) || !activeOtherUserId || !me) return;

    const messageText = trimmed || (type === 'image' ? 'Photo' : '');
    const tempId = `temp-${Date.now()}`;
    const conversationId =
      get().activeConversationId || buildConversationId(me, activeOtherUserId);
    const optimistic: ChatMessage = {
      id: tempId,
      clientTempId: tempId,
      conversationId,
      senderId: me,
      receiverId: activeOtherUserId,
      bookingId: activeBookingId,
      type,
      text: messageText,
      attachments,
      status: 'sending',
      createdAt: new Date().toISOString(),
    };

    set({
      sending: true,
      error: null,
      messages: upsertMessage(messages, optimistic),
      conversations: applyIncomingToInbox(conversations, optimistic, me, activeOtherUserId),
    });

    try {
      await get().connect();
      let saved: ChatMessage;
      try {
        const raw = (await socketService.sendMessageSocket({
          receiverId: activeOtherUserId,
          message: messageText,
          bookingId: activeBookingId,
          type,
          attachments,
          clientTempId: tempId,
        })) as AnyRecord;
        saved = mapMessage({ ...raw, clientTempId: tempId });
      } catch {
        saved = await messageService.sendMessageRest({
          receiverId: activeOtherUserId,
          message: messageText,
          bookingId: activeBookingId,
          type,
          attachments,
        });
        saved = { ...saved, clientTempId: tempId };
      }

      if (saved.conversationId) {
        socketService.joinConversation(saved.conversationId);
        socketService.emitStopTyping(saved.conversationId);
      }

      set((state) => ({
        messages: upsertMessage(state.messages, saved),
        sending: false,
        typingUserId: null,
        activeConversationId: saved.conversationId || state.activeConversationId,
        conversations: applyIncomingToInbox(state.conversations, saved, me, activeOtherUserId),
        unreadTotal: totalUnread(
          applyIncomingToInbox(state.conversations, saved, me, activeOtherUserId)
        ),
      }));
    } catch (error) {
      set((state) => ({
        sending: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
        messages: state.messages.map((item) =>
          item.id === tempId ? { ...item, status: 'failed' } : item
        ),
      }));
      throw error;
    }
  },

  retryFailed: async (messageId) => {
    const failed = get().messages.find((item) => item.id === messageId && item.status === 'failed');
    if (!failed) return;
    set((state) => ({
      messages: state.messages.filter((item) => item.id !== messageId),
    }));
    await get().send(failed.text, {
      type: failed.type,
      attachments: failed.attachments,
    });
  },

  setTyping: (isTyping) => {
    const me = myUserId();
    const { activeOtherUserId, activeConversationId } = get();
    if (!activeOtherUserId || !me) return;
    const conversationId = activeConversationId || buildConversationId(me, activeOtherUserId);
    if (isTyping) socketService.emitTyping(conversationId);
    else socketService.emitStopTyping(conversationId);
  },

  markRead: async () => {
    const me = myUserId();
    const { activeOtherUserId, activeConversationId, conversations } = get();
    if (!activeOtherUserId || !me) return;
    const conversationId = activeConversationId || buildConversationId(me, activeOtherUserId);
    try {
      socketService.emitMessageRead(conversationId);
      await messageService.markRead(conversationId);
      const next = conversations.map((item) =>
        item.otherUserId === activeOtherUserId ? { ...item, unreadCount: 0 } : item
      );
      set({
        conversations: next,
        unreadTotal: totalUnread(next),
      });
      void get().refreshUnread();
    } catch {
      // non-blocking
    }
  },

  requestPresence: (userId) => {
    if (!userId) return;
    socketService.requestPresence(userId);
  },
}));
