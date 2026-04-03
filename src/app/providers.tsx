"use client";

import { Toaster } from "sonner";
import { ThemeProvider, useTheme } from "@/components/theme-provider";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  const toasterTheme = resolvedTheme === "light" ? "light" : "dark";

  return (
    <Toaster
      theme={toasterTheme}
      position="bottom-right"
      richColors
      closeButton
      expand
      duration={3000}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <ThemedToaster />
    </ThemeProvider>
  );
}
