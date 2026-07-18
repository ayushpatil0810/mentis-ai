import { Loading02Icon } from "hugeicons-react";

export default function Loading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <Loading02Icon className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading Mentis...</p>
      </div>
    </div>
  );
}
