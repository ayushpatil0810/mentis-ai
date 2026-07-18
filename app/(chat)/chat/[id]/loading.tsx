import { Loading02Icon } from "hugeicons-react";

export default function ChatLoading() {
  return (
    <div className="flex-1 flex flex-col h-full items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <Loading02Icon className="size-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading conversation...</p>
      </div>
    </div>
  );
}
