import { create } from "zustand";

interface UIStore {
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;

  // Modals
  createProjectOpen: boolean;
  createEmployeeOpen: boolean;
  createSalaryOpen: boolean;
  markAbsentOpen: boolean;
  setCreateProjectOpen: (v: boolean) => void;
  setCreateEmployeeOpen: (v: boolean) => void;
  setCreateSalaryOpen: (v: boolean) => void;
  setMarkAbsentOpen: (v: boolean) => void;

  // Project view toggle
  projectView: "grid" | "kanban";
  setProjectView: (v: "grid" | "kanban") => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  createProjectOpen: false,
  createEmployeeOpen: false,
  createSalaryOpen: false,
  markAbsentOpen: false,
  setCreateProjectOpen: (v) => set({ createProjectOpen: v }),
  setCreateEmployeeOpen: (v) => set({ createEmployeeOpen: v }),
  setCreateSalaryOpen: (v) => set({ createSalaryOpen: v }),
  setMarkAbsentOpen: (v) => set({ markAbsentOpen: v }),

  projectView: "grid",
  setProjectView: (v) => set({ projectView: v }),
}));
