"use client";

import { useTheme } from "next-themes";
import { LaptopIcon, Moon02Icon, Sun01Icon, CheckmarkBadge01Icon } from "hugeicons-react";
import { cn } from "@/lib/utils";

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-xl font-semibold tracking-tight">Appearance</h3>
        <p className="text-[14px] text-muted-foreground mt-1">Customize the interface theme to your preference.</p>
      </div>

      <div className="space-y-4">
        <label className="text-[14px] font-medium block">Theme Preference</label>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Light Theme */}
          <button 
            onClick={() => setTheme("light")}
            className={cn(
              "relative flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300",
              theme === "light" 
                ? "border-foreground bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.04)] scale-[1.02]" 
                : "border-border/60 bg-card/40 hover:bg-card hover:border-border text-muted-foreground"
            )}
          >
            {theme === "light" && (
              <div className="absolute top-3 right-3 text-foreground animate-in fade-in zoom-in duration-300">
                <CheckmarkBadge01Icon className="w-5 h-5" />
              </div>
            )}
            <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors", theme === "light" ? "bg-foreground/5" : "bg-muted")}>
              <Sun01Icon className={cn("w-7 h-7", theme === "light" ? "text-foreground" : "text-muted-foreground")} />
            </div>
            <span className={cn("text-[14px] font-semibold", theme === "light" ? "text-foreground" : "text-muted-foreground")}>Light Mode</span>
          </button>
          
          {/* Dark Theme */}
          <button 
            onClick={() => setTheme("dark")}
            className={cn(
              "relative flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300",
              theme === "dark" 
                ? "border-foreground bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.04)] scale-[1.02]" 
                : "border-border/60 bg-card/40 hover:bg-card hover:border-border text-muted-foreground"
            )}
          >
            {theme === "dark" && (
              <div className="absolute top-3 right-3 text-foreground animate-in fade-in zoom-in duration-300">
                <CheckmarkBadge01Icon className="w-5 h-5" />
              </div>
            )}
            <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors", theme === "dark" ? "bg-foreground/5" : "bg-muted")}>
              <Moon02Icon className={cn("w-7 h-7", theme === "dark" ? "text-foreground" : "text-muted-foreground")} />
            </div>
            <span className={cn("text-[14px] font-semibold", theme === "dark" ? "text-foreground" : "text-muted-foreground")}>Dark Mode</span>
          </button>
          
          {/* System Theme */}
          <button 
            onClick={() => setTheme("system")}
            className={cn(
              "relative flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300",
              theme === "system" 
                ? "border-foreground bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.04)] scale-[1.02]" 
                : "border-border/60 bg-card/40 hover:bg-card hover:border-border text-muted-foreground"
            )}
          >
            {theme === "system" && (
              <div className="absolute top-3 right-3 text-foreground animate-in fade-in zoom-in duration-300">
                <CheckmarkBadge01Icon className="w-5 h-5" />
              </div>
            )}
            <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors", theme === "system" ? "bg-foreground/5" : "bg-muted")}>
              <LaptopIcon className={cn("w-7 h-7", theme === "system" ? "text-foreground" : "text-muted-foreground")} />
            </div>
            <span className={cn("text-[14px] font-semibold", theme === "system" ? "text-foreground" : "text-muted-foreground")}>System Sync</span>
          </button>
        </div>
        
        <p className="text-[13px] text-muted-foreground mt-4">
          System Sync will automatically switch between Light and Dark mode based on your operating system preferences.
        </p>
      </div>
    </div>
  );
}
