import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar (left panel) */}
      <Sidebar />

      {/* Main panel (right side) */}
      <div className="flex-1 flex flex-col pl-0 md:pl-[var(--sidebar-width)] min-w-0">
        <Header />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
