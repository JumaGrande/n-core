/**
 * Custom Juma:
 * Description: Auth.js (NextAuth v5) middleware for route protection.
 *
 * This middleware intercepts requests to protected routes and checks
 * if the user is authenticated. If not, redirects to the signin page.
 *
 * Protected routes are defined in the `matcher` config below.
 * Add or remove paths as needed for your application.
 */
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard');
  const isOnSettings = req.nextUrl.pathname.startsWith('/settings');

  if ((isOnDashboard || isOnSettings) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/signin', req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*'],
};
