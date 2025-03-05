import { create } from "zustand";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const memeLayerCategories = {
	backdrops: ["flies.svg", "higherhigher.svg"],
	chatBubbles: ["alright-buddy.svg", "fcfs.svg", "gribbit.svg", "jump-higher.svg", "hype.svg"],
	misc: ["breaking-news.svg"],
};

type MemeLayerCategory = keyof typeof memeLayerCategories;

type MemeStore = {
	searchInput: string;
	setSearchInput: (value: string) => void;
	selectedLayers: Record<MemeLayerCategory, string | null>;
	toggleLayer: (category: MemeLayerCategory, layer: string) => void;
	reset: () => void;
};

export const useMemeStore = create<MemeStore>((set) => ({
	searchInput: "",
	setSearchInput: (value) => set({ searchInput: value }),
	selectedLayers: {
		backdrops: null,
		chatBubbles: null,
		misc: null,
	},
	toggleLayer: (category, layer) =>
		set((state) => ({
			selectedLayers: {
				...state.selectedLayers,
				[category]: state.selectedLayers[category] === layer ? null : layer,
			},
		})),
	reset: () =>
		set({
			searchInput: "",
			selectedLayers: {
				backdrops: null,
				chatBubbles: null,
				misc: null,
			},
		}),
}));
