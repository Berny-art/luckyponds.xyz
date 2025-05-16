// src/stores/pondStore.ts
import { create } from 'zustand';
import type { PondPeriod } from '@/lib/types';

export interface EnhancedPond {
	type: string;
	name: string;
	displayName: string;
	period: PondPeriod;
	exists: boolean;
}

interface PondStore {
	selectedPond: string | null;
	setSelectedPond: (pondType: string) => void;

	// New state for pond types
	pondTypes: EnhancedPond[];
	setPondTypes: (pondTypes: EnhancedPond[]) => void;

	// Loading state
	isLoadingPondTypes: boolean;
	setIsLoadingPondTypes: (isLoading: boolean) => void;
}

export const usePondStore = create<PondStore>((set) => ({
	// Existing state
	selectedPond: null,
	setSelectedPond: (pondType) => set({ selectedPond: pondType }),

	// New state
	pondTypes: [],
	setPondTypes: (pondTypes) => set({ pondTypes }),

	// Loading state
	isLoadingPondTypes: true,
	setIsLoadingPondTypes: (isLoading) => set({ isLoadingPondTypes: isLoading }),
}));
