/**
 * Custom Juma:
 * Description: Auth.js (NextAuth v5) configuration file.
 *
 * This file configures authentication for the application using Auth.js v5.
 * It exports handlers for API routes, auth() for server-side session access,
 * and signIn/signOut functions for authentication actions.
 *
 * Providers configured:
 * - Google OAuth
 *
 * Usage:
 * - Server Components: const session = await auth()
 * - Client Components: useSession() hook (requires AuthProvider)
 * - API Routes: import { handlers } from "@/lib/auth"
 */
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/signin",
    signOut: "/signout",
    error: "/signin",
  },
  callbacks: {
    authorized: async ({ auth }) => {
      return !!auth
    },
  },
})
