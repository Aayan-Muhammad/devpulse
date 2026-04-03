"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "high-contrast" | "system";
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
  resolvedTheme: Exclude<Theme, "system">;
  accentColor: AccentColor;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = "devpulse-theme";
const ACCENT_KEY = "devpulse-accent";

function isTheme(value: string | null): value is Theme {
  return value === "dark" || value === "light" || value === "high-contrast" || value === "system";
}

function getSystemTheme(): Exclude<Theme, "system"> {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

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
  const [resolvedTheme, setResolvedTheme] = useState<Exclude<Theme, "system">>("dark");
  const [accentColor, setAccentColorState] = useState<AccentColor>("amber");

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const savedAccent = localStorage.getItem(ACCENT_KEY) as AccentColor | null;

    if (isTheme(savedTheme)) {
      setThemeState(savedTheme);
    }

    if (savedAccent && Object.keys(accentColorMap).includes(savedAccent)) {
      setAccentColorState(savedAccent);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const effectiveTheme = theme === "system" ? getSystemTheme() : theme;

    root.classList.remove("light", "high-contrast", "dark");
    if (effectiveTheme === "light") {
      root.classList.add("light");
    } else if (effectiveTheme === "high-contrast") {
      root.classList.add("high-contrast");
    } else {
      root.classList.add("dark");
    }

    root.style.setProperty("--accent-color", accentColorMap[accentColor]);
    root.dataset.theme = effectiveTheme;
    root.dataset.themePreference = theme;

    setResolvedTheme(effectiveTheme);

    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem(ACCENT_KEY, accentColor);
  }, [theme, accentColor]);

  useEffect(() => {
    if (theme !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = () => {
      setResolvedTheme(mediaQuery.matches ? "light" : "dark");
    };

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setAccentColor = (newColor: AccentColor) => {
    setAccentColorState(newColor);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, accentColor, setTheme, setAccentColor }}>
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
