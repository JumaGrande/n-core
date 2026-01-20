/**
 * Custom Juma:
 * Description: Settings page for user profile management.
 *
 * Includes sections for:
 * - Account information (name, email)
 * - Subscription management (Stripe)
 * - Password change
 * - Account deletion
 */
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SettingsCard from '@/components/dashboard/settings-card';
import {
  AccountInformationForm,
  SubscriptionSection,
  PasswordForm,
  DeleteAccountForm,
} from './settings-forms';

export const metadata = {
  title: 'Settings',
  description: 'Manage your account settings',
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session) {
    redirect('/signin');
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Account Information */}
      <SettingsCard
        title="Account Information"
        description="Update your personal information."
      >
        <AccountInformationForm user={session.user} />
      </SettingsCard>

      {/* Subscription */}
      <SettingsCard
        title="Subscription"
        description="Manage your subscription and billing."
      >
        <SubscriptionSection />
      </SettingsCard>

      {/* Password */}
      <SettingsCard
        title="Password"
        description="Change your password to keep your account secure."
      >
        <PasswordForm />
      </SettingsCard>

      {/* Delete Account */}
      <SettingsCard
        title="Delete Account"
        description="Permanently delete your account and all associated data."
        variant="danger"
      >
        <DeleteAccountForm />
      </SettingsCard>
    </div>
  );
}
