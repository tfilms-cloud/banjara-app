import { Redirect } from 'expo-router';

/** Email login is now the primary `/login` screen. */
export default function LoginEmailRedirect() {
  return <Redirect href="/(auth)/login" />;
}
