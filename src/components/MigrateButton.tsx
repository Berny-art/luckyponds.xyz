"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWalletClient, useAccount, useSwitchChain } from "wagmi";
import { claimToken } from "@/functions/claimToken";
import { fetchTokensByOwner } from "@/functions/owners";
import { toast } from "sonner";
import { UserRejectedRequestError } from "viem";

interface MigrateFrogsButtonProps {
	tokenIds?: number[];
	fetchUserTokens?: boolean;
}

const REQUIRED_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID);

const MigrateFrogsButton = ({
	tokenIds = [],
	fetchUserTokens = false,
}: MigrateFrogsButtonProps) => {
	const [processing, setProcessing] = useState(false);
	const { data: walletClient } = useWalletClient();
	const { address, isConnected, chainId } = useAccount();
	const { switchChainAsync } = useSwitchChain();
	const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

	const handleMigrate = async () => {
		if (!walletClient) {
			toast.error("Wallet not connected");
			return;
		}
		if (chainId !== REQUIRED_CHAIN_ID) {
			try {
				await switchChainAsync({ chainId: REQUIRED_CHAIN_ID });
				toast.success("Network switched!");
			} catch (error) {
				console.error("Network switch failed:", error);
				toast.error("Please switch to the correct network to migrate.");
				return;
			}
		}

		setProcessing(true);

		try {
			let migrationTokenIds = tokenIds;

			if (fetchUserTokens) {
				if (!address) throw new Error("Wallet not connected.");
				if (!contractAddress) throw new Error("Contract address not set.");

				const tokens = await fetchTokensByOwner(
					contractAddress,
					address,
					1,
					2222,
				);

				if (!tokens) {
					toast.error("No tokens found to migrate.");
					setProcessing(false);
					return;
				}

				migrationTokenIds = tokens
					.split(",")
					.filter(Boolean)
					.map(Number);

				if (migrationTokenIds.length === 0) {
					toast.error("No tokens found to migrate.");
					setProcessing(false);
					return;
				}
			}

			await claimToken(migrationTokenIds);
			toast.success("Migration complete", {
				description: `${migrationTokenIds.length} Frog${
					migrationTokenIds.length > 1 ? "s" : ""
				} successfully migrated.`,
			});
		} catch (error) {
			console.error("Migration error:", error);

			if (
				error instanceof UserRejectedRequestError ||
				(error instanceof Error &&
					error.message.toLowerCase().includes("user rejected"))
			) {
				toast.error("Migration cancelled", {
					description: "You rejected the transaction.",
				});
			} else {
				toast.error("Migration failed", {
					description:
						error instanceof Error ? error.message : "Unknown error occurred.",
				});
			}
		}

		setProcessing(false);
	};

	return (
		<Button
			onClick={handleMigrate}
			disabled={processing || !isConnected}
			className="bg-blue-400 hover:bg-blue-400/70 text-secondary-950 w-full font-bold uppercase text-md py-6"
		>
			{processing
				? "Processing..."
				: fetchUserTokens
					? "Migrate my Frogs"
					: tokenIds.length === 0
						? "No Frogs to Migrate"
						: tokenIds.length === 1
							? "Migrate my Frog"
							: "Migrate my Frogs"}
		</Button>
	);
};

export default MigrateFrogsButton;
