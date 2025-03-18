"use client";

import { useEffect, useRef } from "react";
import { toPng } from "html-to-image";
import Image from "next/image";
import MemeFilters from "@/components/MemeFilters";
import { useMemeStore } from "@/store/memeStore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function MemeGenerator() {
	const memeContainerRef = useRef<HTMLDivElement>(null);
	const { searchInput, selectedLayers, fetchFrogImage, frogImage } =
		useMemeStore();

	const handleDownload = async () => {
		if (!memeContainerRef.current) return;
		const dataUrl = await toPng(memeContainerRef.current);
		const link = document.createElement("a");
		link.download = "hyperfrog-meme.png";
		link.href = dataUrl;
		link.click();
	};

	const copyMemeToClipboard = async () => {
		if (!memeContainerRef.current) return;

		try {
			const dataUrl = await toPng(memeContainerRef.current);
			const res = await fetch(dataUrl);
			const blob = await res.blob();

			await navigator.clipboard.write([
				new ClipboardItem({
					[blob.type]: blob,
				}),
			]);

			toast.success("Image copied to clipboard!");
		} catch (error) {
			console.error("Failed to copy meme to clipboard:", error);
			toast.error("Failed to copy meme. Please try again!");
		}
	};

	useEffect(() => {
		if (searchInput) {
			fetchFrogImage(searchInput);
		}
	}, [searchInput, fetchFrogImage]);

	return (
		<div className="flex flex-col md:flex-row w-full p-6 gap-8 min-h-[calc(100vh-10rem)]">
			{/* Sidebar for Desktop */}
			<div className=" md:flex flex-col items-center justify-start md:w-1/3 xl:w-1/5 p-2 rounded">
				<MemeFilters disabled={!frogImage} />
			</div>

			{/* Meme Generator Preview */}
			<div className="flex flex-col items-center justify-center w-full md:w-2/3 xl:w-4/5 bg-primary-200/10 p-4 rounded">
				{frogImage ? (
					<div className="flex flex-col items-center gap-8">
						<div
							ref={memeContainerRef}
							className="relative w-full min-w-[300px] md:min-w-[500px] max-w-md aspect-square"
						>
							{/* Backdrop layers (rendered behind the frog) */}
							{Object.entries(selectedLayers)
								.filter(([category]) => category === "backdrops")
								.map(([category, layer]) =>
									layer ? (
										<Image
											key={layer}
											src={`/meme-layers/${category}/${layer}`}
											alt={layer}
											fill
											className="object-contain absolute inset-0 pointer-events-none"
										/>
									) : null,
								)}

							{/* Frog SVG (rendered on top of the backdrop) */}
							<Image
								src={frogImage}
								alt="Hyper Frog"
								fill
								className="object-contain relative"
							/>

							{/* Other meme layers (rendered on top of the frog) */}
							{Object.entries(selectedLayers)
								.filter(([category]) => category !== "backdrops")
								.map(([category, layer]) =>
									layer ? (
										<Image
											key={layer}
											src={`/meme-layers/${category}/${layer}`}
											alt={layer}
											fill
											className="object-contain absolute inset-0 pointer-events-none"
										/>
									) : null,
								)}
						</div>

						<div className="flex gap-4">
							<Button
								onClick={handleDownload}
								className="bg-primary-200 hover:bg-primary-200/70 text-secondary-950 rounded font-bold uppercase text-md py-6"
							>
								Download
							</Button>
							<Button
								onClick={copyMemeToClipboard}
								className="bg-drip-300 hover:bg-drip-300/70 text-secondary-950 font-bold uppercase text-md py-6"
							>
								Copy
							</Button>
						</div>
					</div>
				) : (
					<p className="text-primary-200">Search for a frog to get started!</p>
				)}
			</div>
		</div>
	);
}
