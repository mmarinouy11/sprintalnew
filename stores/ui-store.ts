import { create } from "zustand";

/**
 * Global UI state (Zustand). Skeleton store for cross-cutting client UI
 * concerns (sidebar, theme). Domain stores live alongside this file as
 * features land. Client-only — never holds secrets or service_role data.
 */
type Theme = "dark" | "light";

interface UiState {
  sidebarOpen: boolean;
  theme: Theme;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  theme: "dark",
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTheme: (theme) => set({ theme }),
}));
