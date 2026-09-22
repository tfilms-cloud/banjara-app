import axios, { AxiosError } from 'axios';

export class ApiError extends Error {
  status?: number;
  errors?: unknown[];

  constructor(message: string, status?: number, errors?: unknown[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

const STATUS_MESSAGES: Record<number, string> = {
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This action conflicts with the current state. Please refresh and try again.',
  422: 'Please check your input and try again.',
  500: 'Something went wrong on our server. Please try again later.',
};

function friendlyFromMessage(message?: string): string | null {
  if (!message) return null;
  const lower = message.toLowerCase();
  if (lower.includes('seat') && lower.includes('not available')) {
    return 'This seat is no longer available.';
  }
  if (lower.includes('room') && (lower.includes('not available') || lower.includes('insufficient'))) {
    return 'This room is no longer available.';
  }
  if (lower.includes('booking could not') || lower.includes('booking failed')) {
    return 'Booking could not be completed.';
  }
  return message;
}

function formatValidationErrors(errors?: unknown[]): string | null {
  if (!errors?.length) return null;
  const parts = errors
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as { path?: string; message?: string };
      if (!row.message) return null;
      return row.path ? `${row.path}: ${row.message}` : row.message;
    })
    .filter(Boolean) as string[];
  return parts.length ? parts.join('\n') : null;
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; errors?: unknown[] }>;
    if (!axiosError.response) {
      return new ApiError('Unable to connect to server. Please check your internet connection.');
    }
    const status = axiosError.response.status;
    const serverMessage = axiosError.response.data?.message;
    const details = formatValidationErrors(axiosError.response.data?.errors);
    const message =
      details ||
      friendlyFromMessage(serverMessage) ||
      STATUS_MESSAGES[status] ||
      serverMessage ||
      'Request failed. Please try again.';
    return new ApiError(message, status, axiosError.response.data?.errors);
  }

  if (error instanceof Error) {
    return new ApiError(error.message);
  }

  return new ApiError('Something went wrong. Please try again.');
}

export function getApiErrorMessage(error: unknown): string {
  return normalizeApiError(error).message;
}
