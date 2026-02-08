import { useEffect } from 'react';
import { X } from '@phosphor-icons/react';
import { isInputFocused } from '../lib/utils';

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
  { keys: ['r'], desc: 'Refresh feeds' },
  { keys: ['t'], desc: 'Toggle theme' },
  { keys: ['1–6'], desc: 'Switch feed' },
  { keys: ['[', ']'], desc: 'Prev / next page' },
  { keys: ['?'], desc: 'Toggle shortcuts' },
];

export function KeyboardShortcuts({ isOpen, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isInputFocused()) return;
      if (e.key === '?' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-14 right-4 z-50 hidden sm:block animate-fade">
      <div className="bg-surface/90 backdrop-blur-md border border-edge rounded-lg shadow-lg w-64">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-edge/50">
          <span className="text-xs font-medium text-fg-muted">Keyboard Shortcuts</span>
          <button
            onClick={onClose}
            className="text-fg-faint hover:text-fg transition-colors p-0.5"
          >
            <X size={13} weight="bold" />
          </button>
        </div>
        <div className="px-4 py-2">
          {shortcuts.map((s) => (
            <div
              key={s.desc}
              className="flex items-center justify-between py-1.5"
            >
              <span className="text-[11px] text-fg-muted">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((key) => (
                  <kbd
                    key={key}
                    className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-[10px] font-medium text-fg-faint bg-kbd border border-kbd-edge rounded"
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
