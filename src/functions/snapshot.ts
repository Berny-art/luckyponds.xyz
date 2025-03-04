import {
	getWalletClient,
	readContract,
	waitForTransactionReceipt,
} from "wagmi/actions";
import { snapshotToolAbi } from "@/abis/SnapshotTool";
import { IERC721Abi } from "@/abis/IERC721";
import { config } from "@/lib/wagmiConfig";
import { parseEther } from "viem";
import { toast } from "sonner";

export const takeSnapshot = async ({
	nftAddress,
	startTokenId = 1,
	limit = 5000,
	fee = "0.25", // ETH fee for non-owners
}: {
	nftAddress: `0x${string}`;
	startTokenId?: number;
	limit?: number;
	fee?: string;
}) => {
	const frogContractAddress =
		process.env.NEXT_PUBLIC_MIGRATION_CONTRACT_ADDRESS;
	const snapshotContractAddress =
		process.env.NEXT_PUBLIC_SNAPSHOT_CONTRACT_ADDRESS;
	const payoutAddress = process.env.NEXT_PUBLIC_PAYOUT_ADDRESS;

	if (!frogContractAddress || !snapshotContractAddress || !payoutAddress) {
		throw new Error("Missing contract addresses in environment variables.");
	}

	const walletClient = await getWalletClient(config);
	if (!walletClient) throw new Error("Wallet not connected.");
	const userAddress = walletClient.account.address;

	toast("Checking Frog ownership...");

	// Fetch the frog balance using balanceOf
	const balance = (await readContract(config, {
		address: frogContractAddress as `0x${string}`,
		abi: IERC721Abi,
		functionName: "balanceOf",
		args: [userAddress],
	})) as bigint;

	if (balance === 0n) {
		toast.info("No Frog NFTs found. Sending 0.25 HYPE fee...");

		const feeTxHash = await walletClient.sendTransaction({
			to: payoutAddress as `0x${string}`,
			value: parseEther(fee),
		});
		const feeToastId = toast.loading("Waiting for fee payment...");
		await waitForTransactionReceipt(config, { hash: feeTxHash });
		toast.success("Fee payment complete!", { id: feeToastId });
	}
	toast.success("Frog holder detected. Free snapshot unlocked!");

	const snapshotToast = toast.loading("Taking snapshot...");

	let allTokenIds: string[] = [];
	let allOwners: string[] = [];
	let currentStartTokenId = startTokenId;
	let fetchedAll = false;

	// Loop to keep fetching until no more than 5000 tokens
	while (!fetchedAll) {
		try {
			// Fetch snapshot with the parameters given
			const [tokenIds, owners] = (await readContract(config, {
				address: snapshotContractAddress as `0x${string}`,
				abi: snapshotToolAbi,
				functionName: "getSnapshot",
				args: [nftAddress, currentStartTokenId, limit],
			})) as [string[], string[]];

			// Ensure tokenIds and owners are valid arrays
			if (!Array.isArray(tokenIds) || !Array.isArray(owners)) {
				throw new Error("Snapshot data format is invalid. Expected arrays.");
			}

			// Handle edge case where tokenIds or owners might be undefined or empty
			if (!tokenIds || !owners || tokenIds.length === 0 || owners.length === 0) {
				throw new Error("Snapshot result is empty or malformed.");
			}

			// Combine the fetched results with previous ones
			allTokenIds = [...allTokenIds, ...tokenIds];
			allOwners = [...allOwners, ...owners];

			// If we received fewer than 5000 token IDs, we are done
			if (tokenIds.length < limit) {
				fetchedAll = true;
			} else {
				// Set the next start token to the next token after the last one fetched
				currentStartTokenId = Number(tokenIds[tokenIds.length - 1]) + 1;
			}

		} catch (error) {
			console.error("Snapshot fetch failed:", error);
			toast.error("Snapshot failed. Please try again.", { id: snapshotToast });
			throw error;
		}
	}

	toast.success("Snapshot complete!", { id: snapshotToast });

	return { tokenIds: allTokenIds, owners: allOwners };
};
