/**
 * Custom Juma:
 * Description: Dashboard layout with sidebar and header.
 *
 * This layout wraps all dashboard pages with a consistent
 * structure including navigation sidebar and top header.
 * Protected by middleware - requires authentication.
 */
'use client';

import { useState } from 'react';
import Sidebar from '@/components/dashboard/sidebar';
import DashboardHeader from '@/components/dashboard/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 xl:flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        {/* Header */}
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto max-w-screen-2xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
