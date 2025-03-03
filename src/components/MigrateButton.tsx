"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useWalletClient, useAccount } from "wagmi";
import { claimToken } from "@/functions/claimToken";
import { fetchTokensByOwner } from "@/functions/owners";
import { toast } from "sonner";
import { UserRejectedRequestError } from "viem";

interface MigrateFrogsButtonProps {
	tokenIds?: number[];
	fetchUserTokens?: boolean;
}

const MigrateFrogsButton = ({ tokenIds = [], fetchUserTokens = false }: MigrateFrogsButtonProps) => {
	const [processing, setProcessing] = useState(false);
	const [userTokens, setUserTokens] = useState<number[]>([]);
	const { data: walletClient } = useWalletClient();
	const { address, isConnected } = useAccount();

	const migrationTokenIds = fetchUserTokens ? userTokens : tokenIds;
	const isSingleToken = migrationTokenIds.length === 1;

	useEffect(() => {
		const fetchUserOwnedTokens = async () => {
			if (!address || !fetchUserTokens || userTokens.length) return;
			try {
				const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
				if (!contractAddress) throw new Error("Contract address not set.");
				const tokens = await fetchTokensByOwner(contractAddress, address, 1, 2222);
				setUserTokens(tokens.slice(0, 20));
			} catch (error) {
				console.error("Failed to fetch user tokens:", error);
				toast.error("Failed to fetch your Frogs.");
			}
		};
		fetchUserOwnedTokens();
	}, [address, fetchUserTokens, userTokens.length]);

	const handleMigrate = async () => {
		if (!walletClient) {
			toast.error("Wallet not connected");
			return;
		}
		if (migrationTokenIds.length === 0) {
			toast.error("No tokens provided for migration");
			return;
		}

		setProcessing(true);

		try {
			await claimToken(migrationTokenIds);
			toast.success("Migration complete", {
				description: `${migrationTokenIds.length} Frog${migrationTokenIds.length > 1 ? "s" : ""} successfully migrated.`,
			});
		} catch (error) {
			console.error("Migration error:", error);

			if (
				error instanceof UserRejectedRequestError ||
				(error instanceof Error && error.message.toLowerCase().includes("user rejected"))
			) {
				toast.error("Migration cancelled", {
					description: "You rejected the transaction.",
				});
			} else {
				toast.error("Migration failed", {
					description: error instanceof Error ? error.message : "Unknown error occurred.",
				});
			}
		}

		setProcessing(false);
	};

	return (
		<Button
			onClick={handleMigrate}
			disabled={processing || migrationTokenIds.length === 0 || !isConnected}
			className="bg-blue-400 hover:bg-blue-400/70 text-secondary-950 w-full font-bold uppercase text-md py-6"
		>
			{processing
				? "Processing..."
				: migrationTokenIds.length === 0
				? "No Frogs to Migrate"
				: isSingleToken
				? "Migrate my Frog"
				: "Migrate my Frogs"}
		</Button>
	);
};

export default MigrateFrogsButton;
