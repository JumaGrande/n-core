/**
 * Custom Juma:
 * Description: Dashboard statistics card component.
 *
 * Displays a metric with label, value, change percentage,
 * and an icon. Supports different color variants.
 */

interface StatsCardProps {
  title: string;
  value: string;
  change?: {
    value: string;
    positive: boolean;
  };
  icon: React.ReactNode;
  iconBg?: string;
}

export default function StatsCard({
  title,
  value,
  change,
  icon,
  iconBg = 'bg-primary-500',
}: StatsCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {change && (
            <p className="mt-2 flex items-center gap-1 text-sm">
              <span
                className={`flex items-center gap-0.5 ${
                  change.positive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {change.positive ? (
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                ) : (
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                )}
                {change.value}
              </span>
              <span className="text-gray-500 dark:text-gray-400">vs last month</span>
            </p>
          )}
        </div>
        <div
          className={`flex size-12 items-center justify-center rounded-xl ${iconBg} text-white`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
