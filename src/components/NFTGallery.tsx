"use client";

import React, {
	useEffect,
	useState,
	useRef,
	useCallback,
	useMemo,
} from "react";
import { useSortStore } from "@/store/sortStore";
import Image from "next/image";
import {
	Dialog,
	DialogContent,
	DialogTrigger,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import NFTDialogContent from "./NFTDialogContent";
import { Gem } from "lucide-react";

export type NFTMetadata = {
	nft_id: number;
	name: string;
	description: string;
	attributes: {
		trait_type: string;
		value: string;
		rarity_percent?: number;
		rarity_score?: number;
	}[];
	image: string;
	total_rarity_score: number;
	rank: number;
};

// Memoized NFT Card Component
const NFTCard = React.memo(
	({
		nft,
		isLastItem,
		lastNFTRef,
	}: {
		nft: NFTMetadata;
		isLastItem: boolean;
		lastNFTRef?: (node: HTMLDivElement | null) => void;
	}) => {
		return (
			<div
				ref={isLastItem && lastNFTRef ? lastNFTRef : null}
				className="flex flex-col"
			>
				<Dialog>
					<DialogTrigger>
						<div className="flex w-full items-center justify-between font-bold mb-1 px-2">
							<span>#{nft.nft_id}</span>
							<div className="flex items-center justify-start gap-2 text-drip-300 text-sm">
								<Gem size={14} />
								{nft.rank}
							</div>
						</div>
						<Image
							src={nft.image}
							alt={nft.name}
							width={400}
							height={400}
							className="rounded-lg"
							priority={false} // Lazy load by default
							loading="lazy"
						/>
					</DialogTrigger>
					<DialogContent className="bg-primary-200 text-secondary-950 m-0 p-0 mt-8 max-w-full md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-lg border-none rounded overflow-auto overflow-y-scroll max-h-screen scrollbar-custom [&>button]:text-primary-200 md:[&>button]:text-secondary-950">
						<DialogHeader className="hidden">
							<DialogTitle>{nft.name}</DialogTitle>
						</DialogHeader>
						<NFTDialogContent nft={nft} />
					</DialogContent>
				</Dialog>
			</div>
		);
	},
);

NFTCard.displayName = "NFTCard";

const NFTGallery = () => {
	const [nfts, setNfts] = useState<NFTMetadata[]>([]);
	const [loading, setLoading] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [initialFetch, setInitialFetch] = useState(true);

	const { sortBy, sortOrder, searchTokenId, traitFilters, page, setPage } =
		useSortStore();

	const observer = useRef<IntersectionObserver | null>(null);
	const prevFilters = useRef({
		sortBy,
		sortOrder,
		searchTokenId,
		traitFilters,
	});

	// Memoize fetch parameters to prevent unnecessary rerenders
	const queryParams = useMemo(
		() => ({
			sortBy: sortBy === "id" ? "nft_id" : "rank",
			sortOrder,
			page: page.toString(),
			searchTokenId: searchTokenId || "",
			traitFilters: JSON.stringify(traitFilters),
		}),
		[sortBy, sortOrder, page, searchTokenId, traitFilters],
	);

	// Reset filters effect
	useEffect(() => {
		const filtersChanged =
			sortBy !== prevFilters.current.sortBy ||
			sortOrder !== prevFilters.current.sortOrder ||
			searchTokenId !== prevFilters.current.searchTokenId ||
			JSON.stringify(traitFilters) !==
				JSON.stringify(prevFilters.current.traitFilters);

		if (filtersChanged) {
			setNfts([]);
			setPage(1);
			setHasMore(true);
			setInitialFetch(true);
			prevFilters.current = { sortBy, sortOrder, searchTokenId, traitFilters };
		}
	}, [sortBy, sortOrder, searchTokenId, traitFilters, setPage]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const fetchNFTs = async () => {
			if (!hasMore || loading) return;

			setLoading(true);

			try {
				const query = new URLSearchParams(queryParams).toString();
				const res = await fetch(`/api/nfts?${query}`, {
					method: "GET",
					headers: {
						"Cache-Control": "no-cache",
						Pragma: "no-cache",
					},
				});

				if (!res.ok) throw new Error("Failed to fetch NFT data");

				const data = await res.json();

				setNfts((prevNfts) =>
					page === 1 ? data.data : [...prevNfts, ...data.data],
				);

				setInitialFetch(false);
				setHasMore(data.data.length > 0);
			} catch (error) {
				console.error("NFT Fetch Error:", error);
				// Optionally add error state or toast notification
			} finally {
				setLoading(false);
			}
		};

		fetchNFTs();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hasMore, page, queryParams]);

	// Memoized last NFT ref callback
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	const lastNFTRef = useCallback(
		(node: HTMLDivElement | null) => {
			if (loading) return;
			if (observer.current) observer.current.disconnect();

			observer.current = new IntersectionObserver(
				(entries) => {
					if (entries[0].isIntersecting && hasMore) {
						setPage(page + 1);
					}
				},
				{
					threshold: 0.1, 
					rootMargin: "100px 0px",
				},
			);

			if (node) observer.current.observe(node);
		},
		[loading, hasMore, setPage],
	);

	// Memoized skeleton loader
	const SkeletonLoader = useMemo(
		() => (
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
				{[...Array(20)].map((_, index) => (
					<div
						key={`skeleton-${
							// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
							index
						}`}
						className="w-full"
					>
						<div className="flex flex-col space-y-3 sm:space-y-4">
							<div className="flex items-center justify-between space-x-2">
								<div className="bg-secondary-950 rounded-lg h-8 w-1/2 animate-pulse" />
								<div className="bg-drip-300/50 rounded-lg h-8 w-1/2 animate-pulse" />
							</div>
							<div className="w-full bg-secondary-950 rounded-lg aspect-square animate-pulse">
								<Image
									src={"/apple-touch-icon.png"}
									alt={"placeholder"}
									width={400}
									height={400}
									className="rounded-lg opacity-0"
								/>
							</div>
						</div>
					</div>
				))}
			</div>
		),
		[],
	);

	return (
		<div className="p-4 text-primary-200">
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
				{nfts.map((nft, index) => (
					<NFTCard
						key={nft.nft_id}
						nft={nft}
						isLastItem={index === nfts.length - 1}
						lastNFTRef={lastNFTRef}
					/>
				))}
			</div>

			{loading && SkeletonLoader}

			{!hasMore && !loading && (
				<div className="text-primary-200 mt-6 text-center">
					No more NFTs to load.
				</div>
			)}
		</div>
	);
};

export default React.memo(NFTGallery);
