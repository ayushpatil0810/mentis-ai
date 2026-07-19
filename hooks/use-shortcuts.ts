import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function useShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Cmd+K or Ctrl+K (Toggle Command Palette)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("open-command-palette"));
      }

      // 2. Ctrl+/ (Focus Chat Input)
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        const chatInput = document.querySelector("textarea") as HTMLTextAreaElement | null;
        if (chatInput) {
          chatInput.focus();
        }
      }

      // 3. Ctrl+Shift+F (Focus sidebar search -> Open Command Palette in search mode)
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        window.dispatchEvent(
          new CustomEvent("open-command-palette", { detail: { search: true } })
        );
      }

      // 4. Ctrl+N (New conversation)
      if (e.ctrlKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        router.push("/");
      }

      // 5. Ctrl+E (Export conversation - only if on a chat page)
      if (e.ctrlKey && e.key.toLowerCase() === "e") {
        if (pathname.startsWith("/chat/")) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("trigger-chat-export"));
        }
      }

      // 6. Ctrl+Shift+S (Share conversation - only if on a chat page)
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
        if (pathname.startsWith("/chat/")) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("trigger-chat-share"));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, pathname]);
}
