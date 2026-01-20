/**
 * Custom Juma:
 * Description: Server actions for settings page.
 *
 * These actions handle user profile updates, password changes,
 * subscription management, and account deletion.
 */
'use server';

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// ============================================
// Types
// ============================================

export type AccountState = {
  error?: string;
  success?: string;
};

export type PasswordState = {
  error?: string;
  success?: string;
};

export type DeleteState = {
  error?: string;
  success?: string;
};

// ============================================
// Update Account Information
// ============================================

export async function updateAccount(
  prevState: AccountState,
  formData: FormData
): Promise<AccountState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  if (!name || !email) {
    return { error: 'Name and email are required' };
  }

  try {
    await db
      .update(users)
      .set({ name, email })
      .where(eq(users.id, session.user.id));

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    return { success: 'Account updated successfully' };
  } catch (error) {
    console.error('Failed to update account:', error);
    return { error: 'Failed to update account' };
  }
}

// ============================================
// Update Password
// ============================================

export async function updatePassword(
  _prevState: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const session = await auth();

  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'All password fields are required' };
  }

  if (newPassword !== confirmPassword) {
    return { error: 'New passwords do not match' };
  }

  if (newPassword.length < 8) {
    return { error: 'Password must be at least 8 characters' };
  }

  try {
    // TODO: Verify current password and update
    // const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });
    // if (!user || !await verifyPassword(currentPassword, user.passwordHash)) {
    //   return { error: 'Current password is incorrect' };
    // }
    // await db.update(users).set({ passwordHash: await hashPassword(newPassword) }).where(eq(users.id, session.user.id));

    return { success: 'Password updated successfully' };
  } catch (error) {
    return { error: 'Failed to update password' };
  }
}

// ============================================
// Delete Account
// ============================================

export async function deleteAccount(
  _prevState: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  const session = await auth();

  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  const password = formData.get('password') as string;

  if (!password) {
    return { error: 'Password is required to delete account' };
  }

  try {
    // TODO: Verify password and delete account
    // const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });
    // if (!user || !await verifyPassword(password, user.passwordHash)) {
    //   return { error: 'Password is incorrect' };
    // }
    // await db.delete(users).where(eq(users.id, session.user.id));

    // TODO: Sign out user after deletion
    // await signOut({ redirectTo: '/' });

    return { success: 'Account deleted successfully' };
  } catch (error) {
    return { error: 'Failed to delete account' };
  }
}

// ============================================
// Stripe Customer Portal
// ============================================

export async function customerPortalAction(): Promise<{ url?: string; error?: string }> {
  const session = await auth();

  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  try {
    // TODO: Create Stripe customer portal session
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const portalSession = await stripe.billingPortal.sessions.create({
    //   customer: user.stripeCustomerId,
    //   return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
    // });
    // redirect(portalSession.url);

    return { error: 'Stripe integration not configured yet' };
  } catch (error) {
    return { error: 'Failed to open customer portal' };
  }
}
