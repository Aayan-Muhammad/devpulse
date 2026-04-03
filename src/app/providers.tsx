"use client";

import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <Toaster
        theme="dark"
        position="bottom-right"
        richColors
        closeButton
        expand
        duration={3000}
      />
    </ThemeProvider>
  );
}
