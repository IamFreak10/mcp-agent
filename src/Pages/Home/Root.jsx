import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Outlet } from 'react-router';

export default function Home() {
  return (
    <SidebarProvider>
      <AppSidebar />

      {/* h-screen সরিয়ে ফেলা হয়েছে যাতে এটি কন্টেন্ট অনুযায়ী বড় হতে পারে */}
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="p-4 border-b">
          <SidebarTrigger />
        </header>

        {/* overflow-y-auto যোগ করা হয়েছে যাতে কন্টেন্ট বড় হলে স্ক্রল হয় */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  );
}
