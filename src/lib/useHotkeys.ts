import { useEffect, useRef } from "react";
import { getHotkeyManager } from "@tanstack/hotkeys";
import type { Hotkey } from "@tanstack/hotkeys";

/**
 * Registers hotkeys with TanStack Hotkeys. Handlers are kept fresh via ref
 * to avoid stale closures without re-registering on every render.
 *
 * @param handlers - Map of hotkey strings (e.g. "j", "Escape", "Mod+S") to handlers
 * @param options - Optional target (defaults to document)
 */
export function useHotkeys(
  handlers: Record<string, (e: KeyboardEvent) => void>,
  options?: {
    target?: Document | Window | HTMLElement;
    /** When false, hotkeys still fire while focus is in inputs (default is type-dependent). */
    ignoreInputs?: boolean;
  },
): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const hotkeyList = Object.keys(handlers).sort().join(",");
  const ignoreInputs = options?.ignoreInputs;
  const target = options?.target ?? document;
  useEffect(() => {
    const manager = getHotkeyManager();
    const hotkeys = Object.keys(handlersRef.current) as Array<Hotkey>;
    const registrationHandles = hotkeys.map((hotkey) =>
      manager.register(hotkey, (e) => handlersRef.current[hotkey]?.(e), {
        target,
        ...(ignoreInputs !== undefined ? { ignoreInputs } : {}),
      }),
    );
    return () => registrationHandles.forEach((h) => h.unregister());
  }, [hotkeyList, target, ignoreInputs]);
}
