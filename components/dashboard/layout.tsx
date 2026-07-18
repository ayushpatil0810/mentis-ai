import { DashboardSidebar } from './sidebar';
import { DashboardTopbar } from './topbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { CSSProperties } from 'react';

export default function DashboardLayout({children}:{children:React.ReactNode}) {
  return (
    <SidebarProvider
      className="bg-background text-foreground min-h-screen font-sans"
      style={
        {
          '--sidebar-width': '16rem', // 64 spacing
          '--sidebar-width-icon': '3.5rem', // 14 spacing
        } as CSSProperties
      }
    >
      <DashboardSidebar />
      <SidebarInset className="flex flex-col flex-1 h-screen overflow-hidden">
        <DashboardTopbar />
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
