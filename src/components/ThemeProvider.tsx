import { useStore } from "@nanostores/react";
import { persistentAtom } from "@nanostores/persistent";
import { createContext, useContext, useEffect, useCallback } from "react";
import type { ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggle: () => {},
});

const $theme = persistentAtom<Theme>("hn-theme", "dark");

export function useTheme() {
  return useContext(ThemeContext);
}

function readDomTheme(): Theme | null {
  if (typeof document === "undefined") return null;
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useStore($theme);

  useEffect(() => {
    const domTheme = readDomTheme();
    if (domTheme != null && domTheme !== $theme.get()) {
      $theme.set(domTheme);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncThemeFromDom = () => {
      const domTheme = readDomTheme();
      if (domTheme != null) {
        $theme.set(domTheme);
      }
    };
    window.addEventListener("uhn:theme-change", syncThemeFromDom);
    return () => window.removeEventListener("uhn:theme-change", syncThemeFromDom);
  }, []);

  const toggle = useCallback(() => {
    $theme.set(theme === "dark" ? "light" : "dark");
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}
