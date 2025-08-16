import { create } from 'zustand';

interface ApplicationState {
  selectedAppId: number | null;
  setSelectedAppId: (id: number | null) => void;
}

export const useApplicationStore = create<ApplicationState>((set) => ({
  selectedAppId: null,
  setSelectedAppId: (id) => set({ selectedAppId: id }),
}));