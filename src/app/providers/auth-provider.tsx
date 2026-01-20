/**
 * Description: Auth.js (NextAuth v5) Session Provider wrapper.
 *
 * This provider wraps the application to enable session management
 * in client components. It allows using hooks like `useSession()`
 * to access the current user's authentication state.
 *
 * Usage:
 * - Wrap your app layout with <AuthProvider>
 * - Use `useSession()` hook in client components to get session data
 * - Use `signIn()` and `signOut()` from 'next-auth/react' for auth actions
 */
'use client';

import { SessionProvider } from 'next-auth/react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
