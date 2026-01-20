/**
 * Custom Juma:
 * Description: Recent activity list component for dashboard.
 *
 * Displays a list of recent user activities with timestamps.
 */

interface Activity {
  id: string;
  action: string;
  description: string;
  time: string;
  icon: React.ReactNode;
  iconBg: string;
}

const activities: Activity[] = [
  {
    id: '1',
    action: 'Generated text',
    description: 'Blog post about AI trends',
    time: '2 minutes ago',
    icon: (
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    iconBg: 'bg-blue-500',
  },
  {
    id: '2',
    action: 'API request',
    description: 'GPT-4 completion request',
    time: '15 minutes ago',
    icon: (
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    iconBg: 'bg-purple-500',
  },
  {
    id: '3',
    action: 'Account updated',
    description: 'Profile settings changed',
    time: '1 hour ago',
    icon: (
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    iconBg: 'bg-green-500',
  },
  {
    id: '4',
    action: 'New login',
    description: 'Signed in from Chrome on Mac',
    time: '3 hours ago',
    icon: (
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
      </svg>
    ),
    iconBg: 'bg-amber-500',
  },
];

export default function RecentActivity() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h3>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-full ${activity.iconBg} text-white`}
            >
              {activity.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {activity.action}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {activity.description}
              </p>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
              {activity.time}
            </p>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200 px-6 py-3 dark:border-gray-800">
        <a
          href="/dashboard/activity"
          className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          View all activity →
        </a>
      </div>
    </div>
  );
}
