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
import { fetchNFTs, type NFTMetadata } from "@/functions/nfts";

const NFTCard = React.memo(
	({
		nft,
		isLastItem,
		lastNFTRef,
	}: {
		nft: NFTMetadata;
		isLastItem: boolean;
		lastNFTRef?: (node: HTMLDivElement | null) => void;
	}) => (
		<div
			ref={isLastItem && lastNFTRef ? lastNFTRef : null}
			className="flex flex-col"
		>
			<Dialog>
				<DialogTrigger>
					<div className="flex w-full items-center justify-between font-bold mb-1 px-2">
						<span>#{nft.nft_id}</span>
						<div className="flex items-center gap-2 text-drip-300 text-sm">
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
						loading="lazy"
					/>
				</DialogTrigger>
				<DialogContent className="bg-primary-200 text-secondary-950 m-0 p-0 mt-8 max-w-full md:max-w-screen-md lg:max-w-screen-lg border-none rounded overflow-auto max-h-screen scrollbar-custom [&>button]:text-primary-200 md:[&>button]:text-secondary-950">
					<DialogHeader className="hidden">
						<DialogTitle>{nft.name}</DialogTitle>
					</DialogHeader>
					<NFTDialogContent nft={nft} />
				</DialogContent>
			</Dialog>
		</div>
	),
);
NFTCard.displayName = "NFTCard";

const SkeletonLoader = () => (
	<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
		{Array.from({ length: 20 }).map((_, index) => (
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
							src="/apple-touch-icon.png"
							alt="placeholder"
							width={400}
							height={400}
							className="rounded-lg opacity-0"
						/>
					</div>
				</div>
			</div>
		))}
	</div>
);

const NFTGallery = () => {
	const [nfts, setNfts] = useState<NFTMetadata[]>([]);
	const [loading, setLoading] = useState(false);
	const [hasMore, setHasMore] = useState(true);

	const { sortBy, sortOrder, searchTokenId, traitFilters, page, setPage } =
		useSortStore();
	const observer = useRef<IntersectionObserver | null>(null);
	const prevFilters = useRef({
		sortBy,
		sortOrder,
		searchTokenId,
		traitFilters,
	});

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
			prevFilters.current = { sortBy, sortOrder, searchTokenId, traitFilters };
		}
	}, [sortBy, sortOrder, searchTokenId, traitFilters, setPage]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const loadNFTs = async () => {
			if (!hasMore || loading) return;

			setLoading(true);

			try {
				const newNFTs = await fetchNFTs(queryParams);
				setNfts((prev) => (page === 1 ? newNFTs : [...prev, ...newNFTs]));
				setHasMore(newNFTs.length > 0);
			} catch (error) {
				console.error("NFT Fetch Error:", error);
			} finally {
				setLoading(false);
			}
		};

		loadNFTs();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hasMore, page, queryParams]);

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
				{ threshold: 0.1, rootMargin: "100px 0px" },
			);

			if (node) observer.current.observe(node);
		},
		[loading, hasMore, setPage, page],
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

			{loading && <SkeletonLoader />}

			{!hasMore && !loading && (
				<div className="text-primary-200 mt-6 text-center">
					No more NFTs to load.
				</div>
			)}
		</div>
	);
};

export default React.memo(NFTGallery);
