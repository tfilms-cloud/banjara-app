import { createContext } from 'react';

export type AuthContextValue = {
  onInputFocus?: (target: any) => void;
  isKeyboardOpen?: boolean;
};

export const AuthContext = createContext<AuthContextValue>({});
