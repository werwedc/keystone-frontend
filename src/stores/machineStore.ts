import { create } from 'zustand';

interface MachineStore {
  selectedLicenseId: number | null;
  setSelectedLicenseId: (licenseId: number | null) => void;
}

export const useMachineStore = create<MachineStore>((set) => ({
  selectedLicenseId: null,
  setSelectedLicenseId: (licenseId) => set({ selectedLicenseId: licenseId }),
}));
