"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMemeStore } from "@/store/memeStore";

const memeLayerCategories = {
	backdrops: ["flies.svg", "higherhigher.svg", "purrtardio.jpg"],
	chatBubbles: [
		"alright-buddy.svg",
		"fcfs.svg",
		"gribbit.svg",
		"jump-higher.svg",
		"hype.svg",
		"under-the-water.svg",
	],
	misc: ["breaking-news.svg", "join-the-pond.svg", "purrtard.svg"],
} as const;

type MemeLayerCategory = keyof typeof memeLayerCategories;

export default function MemeFilters({ disabled }: { disabled: boolean }) {
	const { searchInput, setSearchInput, selectedLayers, toggleLayer, reset } =
		useMemeStore();

	return (
		<div className="flex flex-col items-center w-full gap-6">
			<div>
				<h1 className="text-primary-200 uppercase text-lg font-bold w-full">
					Meme Generator
				</h1>
				<p className="font-normal text-primary-200">
					Find your frog and select from various meme layers to make it
					stand-out!
				</p>
			</div>
			<Input
				placeholder="Search Token ID"
				value={searchInput}
				onChange={(e) => setSearchInput(e.target.value)}
				className="w-full border-primary-200 text-primary-200 py-6 rounded px-4 border-2 placeholder:text-primary-200/50 placeholder:uppercase"
			/>

			<div className="flex flex-col gap-6 w-full">
				{Object.entries(memeLayerCategories).map(([category, layers]) => (
					<div key={category} className="flex flex-col gap-2">
						<h2 className="text-primary-200 uppercase text-sm font-semibold">
							{category.replace(/([A-Z])/g, " $1")}
						</h2>
						<div className="flex flex-wrap gap-2">
							{layers.map((layer) => {
								const isSelected =
									selectedLayers[category as MemeLayerCategory] === layer;
								return (
									<Button
										key={layer}
										disabled={disabled}
										onClick={() =>
											toggleLayer(category as MemeLayerCategory, layer)
										}
										className={`px-3 py-2 rounded capitalize rounded ${
											isSelected
												? "bg-drip-300 text-secondary-950"
												: "bg-secondary-950 border-2 border-primary-200 text-primary-200 hover:bg-primary-200/10"
										}`}
									>
										{layer.replace(".svg", "").replace(/-/g, " ")}
									</Button>
								);
							})}
						</div>
					</div>
				))}
			</div>
			<div className="w-full h-0.5 bg-primary-200/20" />

			<Button
				onClick={reset}
				className="bg-drip-300 hover:bg-drip-300/70 text-secondary-950 w-full font-bold uppercase text-md py-6"
			>
				Reset
			</Button>
		</div>
	);
}
