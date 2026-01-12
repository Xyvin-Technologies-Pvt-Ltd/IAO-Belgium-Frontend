import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: "light",
      
      setTheme: (theme) => {
        set({ theme });
        
        // Apply theme to document
        const root = document.documentElement;
        
        if (theme === "dark") {
          root.classList.add("dark");
        } else if (theme === "light") {
          root.classList.remove("dark");
        } else {
          // System theme
          const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          if (systemDark) {
            root.classList.add("dark");
          } else {
            root.classList.remove("dark");
          }
        }
      },
      
      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === "light" ? "dark" : "light";
        get().setTheme(newTheme);
      },
      
      // Initialize theme on app start
      initializeTheme: () => {
        const theme = get().theme;
        get().setTheme(theme);
      },
    }),
    {
      name: "theme-storage",
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
);