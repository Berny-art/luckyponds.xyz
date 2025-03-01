export const fetchOwnerById = async (nftId: number) => {
	const response = await fetch(`/api/getOwnerById?nftId=${nftId}`);
	if (!response.ok) {
		throw new Error("Failed to fetch owner");
	}
	const data = await response.json();
	return data.owner;
};

export const fetchTokensByOwner = async (
	contract: string,
	owner: string,
	start: number,
	end: number,
) => {
	try {
		const res = await fetch(
			`/api/getTokensByOwner?contract=${contract}&owner=${owner}&start=${start}&end=${end}`,
		);
		if (!res.ok) {
			throw new Error(`Error: ${res.status} ${res.statusText}`);
		}

		const data = await res.json();

		if (!data.ownedTokens || data.ownedTokens.length === 0) {
			return "No tokens owned";
		}

		// Convert array to comma-separated string
		return data.ownedTokens.join(",");
	} catch (error) {
		console.error("Failed to fetch tokens:", error);
		return "Error fetching tokens";
	}
};
