export const fetchOwnerById = async (nftId: number) => {
	const response = await fetch(`/api/getOwnerById?nftId=${nftId}`);
	if (!response.ok) {
		throw new Error("Failed to fetch owner");
	}
	const data = await response.json();
	return data.owner;
};

export const fetchTokensByAddress = async (
	walletAddress: string,
	contractAddress: string,
): Promise<string> => {
	try {
		const response = await fetch(
			`https://hyperliquid.cloud.blockscout.com/api/v2/addresses/${walletAddress}/nft?type=ERC-721%2CERC-404%2CERC-1155`,
		);
		if (!response.ok) {
			throw new Error(`Failed to fetch NFTs for ${walletAddress}`);
		}
		const data = await response.json();
		const tokens = data.items.filter(
			(item: { token: { address: string } }) =>
				item.token.address.toLowerCase() === contractAddress.toLowerCase(),
		);
		if (tokens.length > 0) {
			const tokenIds = tokens
				.map((token: { id: string }) => token.id)
				.join(",");
			return tokenIds;
		}
		return "";
	} catch (error) {
		console.error("Error fetching tokens:", error);
		return "";
	}
};
