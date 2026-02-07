import { useRef } from 'react';
import { X } from '@phosphor-icons/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ['j', '↓'], desc: 'Next story' },
  { keys: ['k', '↑'], desc: 'Previous story' },
  { keys: ['↵'], desc: 'Open story' },
  { keys: ['o'], desc: 'Open URL in new tab' },
  { keys: ['h', 'esc'], desc: 'Go back' },
  { keys: ['/'], desc: 'Search' },
  { keys: ['t'], desc: 'Toggle theme' },
  { keys: ['1–6'], desc: 'Switch feed' },
  { keys: ['[', ']'], desc: 'Prev / next page' },
  { keys: ['?'], desc: 'This help' },
];

export function KeyboardHelp({ isOpen, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  return (
    <div
      ref={(el) => {
        (overlayRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        el?.focus();
      }}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade focus:outline-none"
      onClick={(e) => e.target === overlayRef.current && onClose()}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || e.key === '?') {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <div className="bg-surface border border-edge rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge">
          <h2 className="text-sm font-semibold text-fg">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-fg-faint hover:text-fg transition-colors p-1 -mr-1"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
        <div className="px-5 py-3">
          {shortcuts.map((s) => (
            <div
              key={s.desc}
              className="flex items-center justify-between py-2 border-b border-edge/50 last:border-0"
            >
              <span className="text-xs text-fg-muted">{s.desc}</span>
              <div className="flex items-center gap-1.5">
                {s.keys.map((key) => (
                  <kbd
                    key={key}
                    className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-[11px] font-medium text-fg-muted bg-kbd border border-kbd-edge rounded"
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
