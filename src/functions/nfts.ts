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

export type FetchNFTsParams = {
	sortBy: string;
	sortOrder: string;
	page: string;
	searchTokenId?: string;
	traitFilters?: string; // JSON.stringify() of the traitFilters object
};

export async function fetchNFTs({
	sortBy,
	sortOrder,
	page,
	searchTokenId = "",
	traitFilters = "{}",
}: FetchNFTsParams): Promise<NFTMetadata[]> {
	try {
		const params = new URLSearchParams({
			sortBy,
			sortOrder,
			page,
			searchTokenId,
			traitFilters,
		}).toString();

		const res = await fetch(`/api/nfts?${params}`, {
			method: "GET",
			headers: {
				"Cache-Control": "no-cache",
				Pragma: "no-cache",
			},
		});

		if (!res.ok) throw new Error("Failed to fetch NFT data");

		const data = await res.json();

		return data.data as NFTMetadata[];
	} catch (error) {
		console.error("Error fetching NFTs:", error);
		return [];
	}
}

export async function getNftImage(nftId: number): Promise<string | null> {
	const nfts = await fetchNFTs({
		sortBy: "nft_id",
		sortOrder: "ASC",
		page: "1",
		searchTokenId: nftId.toString(),
	});

	return nfts.length ? nfts[0].image : null;
}
