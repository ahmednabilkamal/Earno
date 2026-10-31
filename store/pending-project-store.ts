import { create } from "zustand";

export interface PendingProjectData {
  projectData: Record<string, unknown>;
  projectType: string;
}

interface PendingProjectState {
  data: PendingProjectData | null;
  setPendingProject: (data: PendingProjectData) => void;
  clearPendingProject: () => void;
  getPendingProject: () => PendingProjectData | null;
}

export const usePendingProjectStore = create<PendingProjectState>((set, get) => ({
  data: null,
  setPendingProject: (data) => set({ data }),
  clearPendingProject: () => set({ data: null }),
  getPendingProject: () => get().data,
}));
