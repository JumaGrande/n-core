/**
 * Custom Juma:
 * Description: Reusable card component for settings sections.
 *
 * Provides consistent styling for settings page cards
 * with title, description, and content areas.
 */

interface SettingsCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
}

export default function SettingsCard({
  title,
  description,
  children,
  variant = 'default',
}: SettingsCardProps) {
  return (
    <div
      className={`rounded-xl border bg-white dark:bg-gray-900 ${
        variant === 'danger'
          ? 'border-red-200 dark:border-red-900/50'
          : 'border-gray-200 dark:border-gray-800'
      }`}
    >
      <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <h3
          className={`text-lg font-semibold ${
            variant === 'danger'
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-900 dark:text-white'
          }`}
        >
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
