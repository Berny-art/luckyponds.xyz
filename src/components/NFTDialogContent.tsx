import type { NFTMetadata } from "./NFTGallery";
import Image from "next/image";
import { Button } from "./ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchOwnerById } from "@/functions/owners";
import { truncateAddress } from "@/functions/trunacteAddress";
import { ExternalLink } from "lucide-react";
import MigrateFrogsButton from "./MigrateButton";
import { useAccount } from "wagmi";

const NFTDialogContent = ({ nft }: { nft: NFTMetadata }) => {

	const { data: owner, isLoading, error } = useQuery({
		queryKey: ["owner", nft.nft_id],
		queryFn: () => fetchOwnerById(nft.nft_id),
		enabled: !!nft.nft_id, // Ensures query only runs when nftId is available
	});

	const { address, isConnected } = useAccount();

	const ownerAddress = isLoading ? "Searching..." : error ? 'Not found' : owner;

	// Function to download SVG
	const downloadSvg = () => {
		const link = document.createElement("a");
		link.href = nft.image;
		link.download = `${nft.name}.svg`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	// Function to download PNG
	const downloadPng = () => {
		const svgData = atob(nft.image.split(",")[1]);
		const svgBlob = new Blob([svgData], {
			type: "image/svg+xml;charset=utf-8",
		});
		const url = URL.createObjectURL(svgBlob);

		const img = document.createElement("img");
		img.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext("2d");
			if (ctx) {
				ctx.drawImage(img, 0, 0);
				canvas.toBlob((blob) => {
					if (blob) {
						const link = document.createElement("a");
						link.href = URL.createObjectURL(blob);
						link.download = `${nft.name}.png`;
						document.body.appendChild(link);
						link.click();
						document.body.removeChild(link);
					}
				}, "image/png");
			}
			URL.revokeObjectURL(url);
		};
		img.src = url;
	};

	return (
		<div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
			<Image
				src={nft.image}
				alt={nft.name}
				width={400}
				height={400}
				className="size-full max-h-[200px] md:max-h-full md:max-w-[300px]"
			/>
			<div className="flex w-full flex-col gap-2 px-4 md:px-8 py-8 md:py-16">
				<div className="flex w-full items-center justify-between text-xl uppercase pb-4 md:pb-8">
					<h3>Hyper Frog #{nft.nft_id}</h3>
					<p>RANK {nft.rank}</p>
				</div>
				{nft.attributes.map((attr) => (
					<div
						key={attr.trait_type}
						className="flex w-full items-center justify-between font-mono"
					>
						<p>
							{attr.trait_type}: {attr.value}
						</p>
						<p className="text-secondary-600">{attr.rarity_percent}%</p>
					</div>
				))}
				<div className="flex w-full items-center justify-between font-mono pt-4">
					<p>Rarity Score</p>
					<p className="text-secondary-600">{nft.total_rarity_score}</p>
				</div>
				<div className="flex w-full items-center justify-between font-mono pb-4 md:pb-8">
					<p>Owner:</p>{" "}
					<a href={`https://hyperliquid.cloud.blockscout.com/address/${ownerAddress}?tab=tokens_nfts`} className="flex items-center gap-2 text-secondary-600 underline truncate">{truncateAddress(ownerAddress)} <ExternalLink size={16} /></a>
				</div>
				<div className="flex items-center justify-end pb-4 md:pb-8">
					{isConnected && address && (
						<MigrateFrogsButton tokenIds={[nft.nft_id]} />
					)}
				</div>
				<div className="flex w-full flex-wrap gap-2 items-center justify-between pb-6">
					<Button
						onClick={downloadPng}
						className="bg-secondary-950 hover:bg-secondary-800 text-primary-200 font-bold uppercase py-4 md:py-6 w-full md:w-auto"
					>
						Download PNG
					</Button>
					<Button
						onClick={downloadSvg}
						className="bg-secondary-950 hover:bg-secondary-800 text-primary-200 font-bold uppercase py-4 md:py-6 w-full md:w-auto"
					>
						Download SVG
					</Button>
					<Button
						className="bg-drip-300 hover:bg-drip-400 text-secondary-950 font-bold uppercase py-4 md:py-6 w-full md:w-auto"
						asChild
					>
						<a
							href={`https://hyperliquid.cloud.blockscout.com/token/0x4Adb7665C72ccdad25eD5B0BD87c34e4Ee9Da3c4/instance/${nft.nft_id}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							View on block explorer
						</a>
					</Button>
				</div>
			</div>
		</div>
	);
};

export default NFTDialogContent;
