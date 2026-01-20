/**
 * Custom Juma:
 * Description: Client-side form components for settings page.
 *
 * Contains forms for:
 * - Account information updates
 * - Subscription management
 * - Password changes
 * - Account deletion
 */
'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { InputGroup, PasswordInput } from '@/components/ui/inputs';
import {
  updateAccount,
  updatePassword,
  deleteAccount,
  customerPortalAction,
  type AccountState,
  type PasswordState,
  type DeleteState,
} from './actions';

// ============================================
// Account Information Form
// ============================================

interface AccountInformationFormProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function AccountInformationForm({ user }: AccountInformationFormProps) {
  const { update } = useSession();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<AccountState, FormData>(
    updateAccount,
    {}
  );

  // Update session when account is successfully updated
  useEffect(() => {
    if (state.success && formRef.current) {
      const formData = new FormData(formRef.current);
      const name = formData.get('name') as string;
      const email = formData.get('email') as string;
      // Update the JWT session with new data
      update({ name, email });
    }
  }, [state.success, update]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <InputGroup
          label="Name"
          name="name"
          placeholder="Enter your name"
          defaultValue={user?.name || ''}
          required
        />
        <InputGroup
          label="Email"
          name="email"
          type="email"
          placeholder="Enter your email"
          defaultValue={user?.email || ''}
          required
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-green-500">{state.success}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-full bg-primary-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
      >
        {isPending ? (
          <>
            <svg
              className="mr-2 size-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </button>
    </form>
  );
}

// ============================================
// Subscription Section
// ============================================

interface SubscriptionSectionProps {
  subscription?: {
    planId: string;
    planName: string;
    status: string;
    trialEndsAt: Date | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean | null;
  } | null;
}

export function SubscriptionSection({ subscription }: SubscriptionSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const planName = subscription?.planName || 'Free';
  const status = subscription?.status || 'inactive';

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const result = await customerPortalAction();
      if (result.url) {
        window.location.href = result.url;
      } else if (result.redirectTo) {
        router.push(result.redirectTo);
      } else if (result.error) {
        alert(result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusText = () => {
    // Si está programada la cancelación, mostrar como cancelada
    if (subscription?.cancelAtPeriodEnd) {
      return `Canceled - Access until ${formatDate(subscription.currentPeriodEnd)}`;
    }
    if (status === 'active') {
      return `Renews on ${formatDate(subscription?.currentPeriodEnd)}`;
    }
    if (status === 'trialing') {
      return `Trial ends on ${formatDate(subscription?.trialEndsAt)}`;
    }
    if (status === 'past_due') {
      return 'Payment failed - please update your payment method';
    }
    if (status === 'canceled') {
      return 'Subscription canceled';
    }
    return 'No active subscription';
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const showManageButton = status === 'active' || status === 'trialing' || status === 'past_due';

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">
          Current Plan: <span className="text-primary-500">{planName}</span>
          {status === 'trialing' && (
            <span className="ml-2 inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
              Trial
            </span>
          )}
          {status === 'past_due' && (
            <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-500">
              Payment Due
            </span>
          )}
          {subscription?.cancelAtPeriodEnd && (
            <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
              Canceled
            </span>
          )}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {getStatusText()}
        </p>
      </div>
      <div className="flex gap-2">
        {showManageButton ? (
          <button
            onClick={handleManageSubscription}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {isLoading ? 'Loading...' : 'Manage Subscription'}
          </button>
        ) : (
          <button
            onClick={() => router.push('/pricing')}
            className="inline-flex items-center justify-center rounded-full bg-primary-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-600"
          >
            Upgrade Plan
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// Password Form
// ============================================

export function PasswordForm() {
  const [state, formAction, isPending] = useActionState<PasswordState, FormData>(
    updatePassword,
    {}
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <PasswordInput
          label="Current Password"
          name="currentPassword"
          placeholder="Enter current password"
          required
          minLength={8}
        />
        <PasswordInput
          label="New Password"
          name="newPassword"
          placeholder="Enter new password"
          required
          minLength={8}
        />
        <PasswordInput
          label="Confirm Password"
          name="confirmPassword"
          placeholder="Confirm new password"
          required
          minLength={8}
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-green-500">{state.success}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-full bg-primary-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
      >
        {isPending ? (
          <>
            <svg
              className="mr-2 size-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Updating...
          </>
        ) : (
          <>
            <svg
              className="mr-2 size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Update Password
          </>
        )}
      </button>
    </form>
  );
}

// ============================================
// Delete Account Form
// ============================================

export function DeleteAccountForm() {
  const [state, formAction, isPending] = useActionState<DeleteState, FormData>(
    deleteAccount,
    {}
  );

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Once you delete your account, there is no going back. Please be certain.
      </p>

      <div className="max-w-sm">
        <PasswordInput
          label="Confirm Password"
          name="password"
          placeholder="Enter your password to confirm"
          required
          minLength={8}
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-full bg-red-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
      >
        {isPending ? (
          <>
            <svg
              className="mr-2 size-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Deleting...
          </>
        ) : (
          <>
            <svg
              className="mr-2 size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete Account
          </>
        )}
      </button>
    </form>
  );
}
