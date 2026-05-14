import { useCallback, useEffect, useRef } from "react";

interface UseKeyboardNavigationOptions {
  emailIds: string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onStar: (id: string) => void;
  onToggleRead: (id: string) => void;
  onDelete: (id: string) => void;
  onCompose: () => void;
  onSearch: () => void;
  enabled?: boolean;
}

export function useKeyboardNavigation({
  emailIds,
  selectedId,
  onSelect,
  onOpen,
  onStar,
  onToggleRead,
  onDelete,
  onCompose,
  onSearch,
  enabled = true,
}: UseKeyboardNavigationOptions) {
  const listRef = useRef<HTMLDivElement>(null);

  const getCurrentIndex = useCallback(() => {
    if (!selectedId) return -1;
    return emailIds.indexOf(selectedId);
  }, [emailIds, selectedId]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true"
      ) {
        if (e.key === "Escape") {
          (target as HTMLInputElement).blur();
        }
        return;
      }

      const currentIndex = getCurrentIndex();

      switch (e.key) {
        case "j":
        case "ArrowDown": {
          e.preventDefault();
          const nextIndex = Math.min(currentIndex + 1, emailIds.length - 1);
          if (nextIndex >= 0 && emailIds[nextIndex]) {
            onSelect(emailIds[nextIndex]);
            const el = document.getElementById(`email-row-${emailIds[nextIndex]}`);
            el?.scrollIntoView({ block: "nearest" });
          }
          break;
        }
        case "k":
        case "ArrowUp": {
          e.preventDefault();
          const prevIndex = Math.max(currentIndex - 1, 0);
          if (emailIds[prevIndex]) {
            onSelect(emailIds[prevIndex]);
            const el = document.getElementById(`email-row-${emailIds[prevIndex]}`);
            el?.scrollIntoView({ block: "nearest" });
          }
          break;
        }
        case "o":
        case "Enter": {
          e.preventDefault();
          if (selectedId) onOpen(selectedId);
          break;
        }
        case "s": {
          e.preventDefault();
          if (selectedId) onStar(selectedId);
          break;
        }
        case "u": {
          e.preventDefault();
          if (selectedId) onToggleRead(selectedId);
          break;
        }
        case "#":
        case "Delete": {
          e.preventDefault();
          if (selectedId) onDelete(selectedId);
          break;
        }
        case "c": {
          e.preventDefault();
          onCompose();
          break;
        }
        case "/": {
          e.preventDefault();
          onSearch();
          break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, emailIds, selectedId, getCurrentIndex, onSelect, onOpen, onStar, onToggleRead, onDelete, onCompose, onSearch]);

  return { listRef };
}
