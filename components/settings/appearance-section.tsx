"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { LaptopIcon, Moon02Icon, Sun01Icon } from "hugeicons-react";
import { cn } from "@/lib/utils";

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">Customize how the application looks.</p>
      </div>

      <div className="space-y-4">
        <label className="text-sm font-medium">Theme Preference</label>
        <div className="flex gap-4">
          <button 
            onClick={() => setTheme("light")}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all w-32 h-24 gap-3 bg-white",
              theme === "light" ? "border-foreground shadow-sm" : "border-border hover:border-foreground/30 text-muted-foreground"
            )}
          >
            <Sun01Icon className="w-6 h-6 text-orange-500" />
            <span className="text-sm font-medium text-foreground">Light</span>
          </button>
          
          <button 
            onClick={() => setTheme("dark")}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all w-32 h-24 gap-3 bg-zinc-950",
              theme === "dark" ? "border-foreground shadow-sm" : "border-border hover:border-foreground/30 text-muted-foreground"
            )}
          >
            <Moon02Icon className="w-6 h-6 text-zinc-300" />
            <span className="text-sm font-medium text-white">Dark</span>
          </button>
          
          <button 
            onClick={() => setTheme("system")}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all w-32 h-24 gap-3 bg-gradient-to-br from-white to-zinc-950",
              theme === "system" ? "border-foreground shadow-sm" : "border-border hover:border-foreground/30 text-muted-foreground"
            )}
          >
            <div className="bg-background rounded-full p-1"><LaptopIcon className="w-5 h-5 text-foreground" /></div>
            <span className="text-sm font-medium text-background mix-blend-difference">System</span>
          </button>
        </div>
      </div>
    </div>
  );
}
