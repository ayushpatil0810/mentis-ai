"use client";

import React, { useState } from 'react';
import { DashboardSidebar } from './sidebar';
import { SidebarLeft01Icon } from 'hugeicons-react';
import { CommandPalette } from './command-palette';
import { useShortcuts } from '@/hooks/use-shortcuts';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  useShortcuts();

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      <DashboardSidebar 
        isMobileMenuOpen={isMobileMenuOpen} 
        setIsMobileMenuOpen={setIsMobileMenuOpen} 
        isDesktopCollapsed={isDesktopCollapsed}
        setIsDesktopCollapsed={setIsDesktopCollapsed}
      />
      <main className={cn(
        "flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background relative z-10 transition-all duration-300 md:border-l md:border-t md:border-border/40 md:shadow-[-8px_0_32px_rgba(0,0,0,0.02)] dark:md:shadow-none [&_header]:pl-14",
        !isDesktopCollapsed ? "md:rounded-tl-2xl [&_header]:md:pl-6" : "[&_header]:md:pl-16"
      )}>
        {children}
        
        {/* Header Actions Area (Floating) */}
        <div className="absolute top-[10px] left-4 z-30 flex items-center gap-2">
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-background/80 backdrop-blur-md border border-border/50 text-muted-foreground hover:text-foreground shadow-sm transition-colors cursor-pointer"
            title="Open Sidebar"
          >
            <SidebarLeft01Icon className="w-5 h-5" />
          </button>

          {/* Desktop Expand Toggle (only shown when collapsed) */}
          {isDesktopCollapsed && (
            <button 
              onClick={() => setIsDesktopCollapsed(false)}
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg bg-background/50 hover:bg-background backdrop-blur-md border border-transparent hover:border-border/50 text-muted-foreground hover:text-foreground shadow-none hover:shadow-sm transition-all cursor-pointer"
              title="Expand Sidebar"
            >
              <SidebarLeft01Icon className="w-5 h-5 rotate-180" />
            </button>
          )}
        </div>
      </main>
      <CommandPalette />
    </div>
  );
}
