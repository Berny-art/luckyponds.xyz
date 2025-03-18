import { getNftImage } from "@/functions/nfts";
import { removeBackgroundFromSvg } from "@/functions/removeBackground";
import { create } from "zustand";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const memeLayerCategories = {
	backdrops: ["flies.svg", "higherhigher.svg"],
	chatBubbles: [
		"alright-buddy.svg",
		"fcfs.svg",
		"gribbit.svg",
		"jump-higher.svg",
		"hype.svg",
	],
	misc: ["breaking-news.svg"],
};

type MemeLayerCategory = keyof typeof memeLayerCategories;

type MemeStore = {
	searchInput: string;
	setSearchInput: (value: string) => void;
	selectedLayers: Record<MemeLayerCategory, string | null>;
	originalFrogImage: string | null;
	frogImage: string | null;
	setFrogImage: (image: string | null) => void;
	fetchFrogImage: (searchInput: string) => Promise<void>;
	toggleLayer: (category: MemeLayerCategory, layer: string) => void;
	reset: () => void;
};

export const useMemeStore = create<MemeStore>((set, get) => ({
	searchInput: "",
	setSearchInput: (value) => set({ searchInput: value }),

	selectedLayers: {
		backdrops: null,
		chatBubbles: null,
		misc: null,
	},

	originalFrogImage: null,
	frogImage: null,

	setFrogImage: (image) => set({ frogImage: image }),

	fetchFrogImage: async (searchInput) => {
		if (!searchInput) return;
		try {
			const image = await getNftImage(Number(searchInput));
			if (!image) return;

			set({ originalFrogImage: image });

			// If a backdrop is already selected, modify the image immediately
			const { selectedLayers } = get();
			if (selectedLayers.backdrops) {
				const res = await fetch(image);
				const svgText = await res.text();
				const modifiedSvg = removeBackgroundFromSvg(svgText);

				// Convert to Blob URL
				const svgBlob = new Blob([modifiedSvg], { type: "image/svg+xml" });
				const svgUrl = URL.createObjectURL(svgBlob);

				set({ frogImage: svgUrl });
			} else {
				set({ frogImage: image });
			}
		} catch (error) {
			console.error("Failed to fetch NFT image:", error);
		}
	},

	toggleLayer: (category, layer) =>
		set((state) => {
			const newSelectedLayers = {
				...state.selectedLayers,
				[category]: state.selectedLayers[category] === layer ? null : layer,
			};

			// If toggling a backdrop, update the image dynamically
			if (category === "backdrops" && state.originalFrogImage) {
				if (newSelectedLayers.backdrops) {
					// Modify the SVG
					fetch(state.originalFrogImage)
						.then((res) => res.text())
						.then((svgText) => {
							const modifiedSvg = removeBackgroundFromSvg(svgText);
							const svgBlob = new Blob([modifiedSvg], {
								type: "image/svg+xml",
							});
							const svgUrl = URL.createObjectURL(svgBlob);
							set({ frogImage: svgUrl });
						});
				} else {
					// Restore original NFT image
					set({ frogImage: state.originalFrogImage });
				}
			}

			return { selectedLayers: newSelectedLayers };
		}),

	reset: () =>
		set({
			searchInput: "",
			selectedLayers: {
				backdrops: null,
				chatBubbles: null,
				misc: null,
			},
			frogImage: null,
			originalFrogImage: null,
		}),
}));
