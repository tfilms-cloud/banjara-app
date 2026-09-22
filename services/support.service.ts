import { get, post } from '@/services/api';

export async function createTicket(payload: {
  subject: string;
  message: string;
  category?: string;
}) {
  return post('/support', payload);
}

export async function listTickets() {
  return get('/support');
}

export async function getTicket(id: string) {
  return get(`/support/${id}`);
}
