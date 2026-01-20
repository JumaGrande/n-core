/**
 * Custom Juma:
 * Description: Auth.js (NextAuth v5) configuration file.
 *
 * This file configures authentication for the application using Auth.js v5.
 * It exports handlers for API routes, auth() for server-side session access,
 * and signIn/signOut functions for authentication actions.
 *
 * Database: PostgreSQL with Drizzle ORM adapter for user persistence.
 * Sessions: JWT strategy (compatible with Edge Runtime/Middleware).
 *
 * Providers configured:
 * - Google OAuth
 *
 * Usage:
 * - Server Components: const session = await auth()
 * - Client Components: useSession() hook (requires AuthProvider)
 * - API Routes: import { handlers } from "@/lib/auth"
 */
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { db } from "@/db"
import * as schema from "@/db/schema"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
    authenticatorsTable: schema.authenticators,
  }),
  session: {
    strategy: "jwt",
  },
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
    jwt: async ({ token, user }) => {
      // On first sign in, add user id to token
      if (user) {
        token.id = user.id
      }
      return token
    },
    session: async ({ session, token }) => {
      // Add user id to session from JWT token
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
