import {
  useHotkeys as useTanStackHotkeys,
  type RegisterableHotkey,
  type UseHotkeyDefinition,
  type UseHotkeyOptions,
} from "@tanstack/react-hotkeys";

/**
 * Registers hotkeys with TanStack React Hotkeys while keeping call sites concise.
 *
 * @param handlers - Map of hotkey strings (e.g. "j", "Escape", "Mod+S") to handlers
 * @param options - Optional target (defaults to document)
 */
export function useHotkeys(
  handlers: Record<string, (e: KeyboardEvent) => void>,
  options?: UseHotkeyOptions,
) {
  const hotkeys: UseHotkeyDefinition[] = Object.entries(handlers).map(([hotkey, callback]) => ({
    hotkey: hotkey as RegisterableHotkey,
    callback,
  }));

  useTanStackHotkeys(hotkeys, options);
}
