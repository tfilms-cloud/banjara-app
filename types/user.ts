export type UserRole = 'customer' | 'provider' | 'admin';

export type ProviderAccountStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: UserRole;
  providerId?: string;
  providerStatus?: ProviderAccountStatus;
  savedTripIds: string[];
  createdAt: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRole;
  providerId?: string;
  providerStatus?: ProviderAccountStatus;
}
