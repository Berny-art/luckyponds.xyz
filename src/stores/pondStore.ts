import { create } from 'zustand';

interface PondStore {
	selectedPond: string | null;
	setSelectedPond: (pondType: string) => void;
}

export const usePondStore = create<PondStore>((set) => ({
	selectedPond: null,
	setSelectedPond: (pondType) => set({ selectedPond: pondType }),
}));
