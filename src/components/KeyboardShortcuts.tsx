import { X } from "@phosphor-icons/react";
import { useHotkeys } from "../lib/useHotkeys";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ["j", "↓"], desc: "Next story" },
  { keys: ["k", "↑"], desc: "Previous story" },
  { keys: ["↵"], desc: "Open story" },
  { keys: ["o"], desc: "Open URL in new tab" },
  { keys: ["h", "esc"], desc: "Go back" },
  { keys: ["/"], desc: "Search" },
  { keys: ["r"], desc: "Refresh feeds" },
  { keys: ["t"], desc: "Toggle theme" },
  { keys: ["1–6"], desc: "Switch feed" },
  { keys: ["[", "]"], desc: "Prev / next page" },
  { keys: ["⌘/ctrl", "k"], desc: "Toggle shortcuts" },
  { keys: ["?"], desc: "Toggle shortcuts" },
];

export function KeyboardShortcuts({ isOpen, onClose }: Props) {
  useHotkeys(
    isOpen
      ? {
          "?": () => onClose(),
          Escape: () => onClose(),
        }
      : {},
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 animate-fade bg-bg/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface/95 border border-edge rounded-xl shadow-lg w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-edge/50">
          <span className="text-sm font-medium text-fg-muted">Keyboard Shortcuts</span>
          <button
            onClick={onClose}
            className="text-fg-faint hover:text-fg transition-colors p-0.5"
            type="button"
          >
            <X size={15} weight="bold" />
          </button>
        </div>
        <div className="px-5 py-3">
          {shortcuts.map((s) => (
            <div
              key={`${s.desc}-${s.keys.join("-")}`}
              className="flex items-center justify-between py-2"
            >
              <span className="text-xs text-fg-muted">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((key) => (
                  <kbd
                    key={key}
                    className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 text-xs font-medium text-fg-faint bg-kbd border border-kbd-edge rounded"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
