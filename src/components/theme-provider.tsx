"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "high-contrast";
export type AccentColor =
  | "amber"
  | "blue"
  | "emerald"
  | "purple"
  | "pink"
  | "cyan"
  | "orange"
  | "rose";

interface ThemeContextType {
  theme: Theme;
  accentColor: AccentColor;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = "devpulse-theme";
const ACCENT_KEY = "devpulse-accent";

const accentColorMap: Record<AccentColor, string> = {
  amber: "#fbbf24",
  blue: "#3b82f6",
  emerald: "#10b981",
  purple: "#a855f7",
  pink: "#ec4899",
  cyan: "#06b6d4",
  orange: "#f97316",
  rose: "#f43f5e",
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [accentColor, setAccentColorState] = useState<AccentColor>("amber");
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
    const savedAccent = localStorage.getItem(ACCENT_KEY) as AccentColor | null;

    if (savedTheme && ["dark", "light", "high-contrast"].includes(savedTheme)) {
      setThemeState(savedTheme);
    }

    if (savedAccent && Object.keys(accentColorMap).includes(savedAccent)) {
      setAccentColorState(savedAccent);
    }

    setMounted(true);
  }, []);

  // Apply theme and accent to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Set theme class
    root.classList.remove("light", "high-contrast");
    if (theme === "light") {
      root.classList.add("light");
    } else if (theme === "high-contrast") {
      root.classList.add("high-contrast");
    }

    // Set accent color CSS variable
    root.style.setProperty("--accent-color", accentColorMap[accentColor]);

    // Save to localStorage
    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem(ACCENT_KEY, accentColor);
  }, [theme, accentColor, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setAccentColor = (newColor: AccentColor) => {
    setAccentColorState(newColor);
  };

  if (!mounted) {
    return children;
  }

  return (
    <ThemeContext.Provider value={{ theme, accentColor, setTheme, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
