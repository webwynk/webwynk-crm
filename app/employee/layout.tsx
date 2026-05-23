import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import EmployeeSidebar from '@/components/layout/EmployeeSidebar';
import TopBar from '@/components/layout/TopBar';
import MobileNav from '@/components/layout/MobileNav';
import OnboardingModal from '@/components/auth/OnboardingModal';

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }

  if (session.user.role !== 'EMPLOYEE') {
    redirect('/');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans">
      {/* Sidebar - Hidden on mobile, flex on desktop */}
      <EmployeeSidebar user={session.user} />

      {/* Main Content Wrapper */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <TopBar />
        
        {/* Scrollable Main content area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation */}
      <MobileNav />

      {/* Onboarding Enforcer Modal */}
      <OnboardingModal />
    </div>
  );
}
