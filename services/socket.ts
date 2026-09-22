import { io, type Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMemoryAccessToken, setMemoryAuthTokens } from '@/services/authToken';
import { getApiBaseUrl } from '@/services/apiUrl';

const API_URL = getApiBaseUrl();
const AUTH_STORAGE_KEY = 'banjara-auth';

function socketBaseUrl() {
  return API_URL.replace(/\/api\/?$/, '');
}

async function readAccessToken(): Promise<string | null> {
  const memory = getMemoryAccessToken();
  if (memory && memory !== 'guest-token' && memory !== 'mock-token') return memory;

  try {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { token?: string | null; refreshToken?: string | null } };
    const token = parsed.state?.token;
    if (!token || token === 'guest-token' || token === 'mock-token') return null;
    setMemoryAuthTokens(token, parsed.state?.refreshToken ?? null);
    return token;
  } catch {
    return null;
  }
}

let socket: Socket | null = null;

export function getSocket() {
  return socket;
}

export async function connectSocket() {
  const token = await readAccessToken();
  if (!token) {
    disconnectSocket();
    return null;
  }

  if (socket?.connected) return socket;

  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  socket = io(socketBaseUrl(), {
    transports: ['websocket'],
    autoConnect: true,
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  });

  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}

export function joinConversation(conversationId: string) {
  if (!conversationId || !socket) return;
  socket.emit('joinConversation', conversationId);
  socket.emit('join_conversation', { conversationId });
}

export function leaveConversation(conversationId: string) {
  if (!conversationId || !socket) return;
  socket.emit('leaveConversation', conversationId);
  socket.emit('leave_conversation', { conversationId });
}

export function emitTyping(conversationId: string) {
  socket?.emit('typing', { conversationId });
  socket?.emit('typing_start', { conversationId });
}

export function emitStopTyping(conversationId: string) {
  socket?.emit('stopTyping', { conversationId });
  socket?.emit('typing_stop', { conversationId });
}

export function emitMessageRead(conversationId: string) {
  socket?.emit('messageRead', { conversationId });
  socket?.emit('message_read', { conversationId });
}

export function emitMessageDelivered(conversationId: string) {
  socket?.emit('messageDelivered', { conversationId });
  socket?.emit('message_delivered', { conversationId });
}

export function requestPresence(userId: string) {
  socket?.emit('getPresence', userId);
}

export function sendMessageSocket(payload: {
  receiverId: string;
  message: string;
  bookingId?: string;
  type?: string;
  attachments?: string[];
  clientTempId?: string;
}): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error('Chat is offline. Reconnecting…'));
      return;
    }
    socket.emit('sendMessage', payload, (ack: { success?: boolean; data?: unknown; message?: string }) => {
      if (ack?.success) resolve(ack.data);
      else reject(new Error(ack?.message ?? 'Failed to send message'));
    });
  });
}
