"use client";

import React, { useState } from 'react';
import { DashboardSidebar } from './sidebar';
import { SidebarLeft01Icon } from 'hugeicons-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      <DashboardSidebar 
        isMobileMenuOpen={isMobileMenuOpen} 
        setIsMobileMenuOpen={setIsMobileMenuOpen} 
        isDesktopCollapsed={isDesktopCollapsed}
        setIsDesktopCollapsed={setIsDesktopCollapsed}
      />
      <main className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background relative z-10 transition-all duration-300 md:border-l md:border-t md:border-border/40 md:shadow-[-8px_0_32px_rgba(0,0,0,0.02)] dark:md:shadow-none ${!isDesktopCollapsed ? "md:rounded-tl-2xl" : ""}`}>
        
        {/* Header Actions Area (Floating) */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-background/80 backdrop-blur-md border border-border/50 text-muted-foreground hover:text-foreground shadow-sm transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          {/* Desktop Expand Toggle (only shown when collapsed) */}
          {isDesktopCollapsed && (
            <button 
              onClick={() => setIsDesktopCollapsed(false)}
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg bg-background/50 hover:bg-background backdrop-blur-md border border-transparent hover:border-border/50 text-muted-foreground hover:text-foreground shadow-none hover:shadow-sm transition-all"
              title="Expand Sidebar"
            >
              <SidebarLeft01Icon className="w-5 h-5 rotate-180" />
            </button>
          )}
        </div>

        {children}
      </main>
    </div>
  );
}
