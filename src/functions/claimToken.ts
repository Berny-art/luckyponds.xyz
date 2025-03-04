import {
	getWalletClient,
	readContract,
	writeContract,
	waitForTransactionReceipt,
} from "wagmi/actions";
import { HyperFrogsV2Abi } from "@/abis/HyperFrogsV2";
import { IHyperFrogsAbi } from "@/abis/IHyperFrogs";
import { IERC721Abi } from "@/abis/IERC721";
import { config } from "@/lib/wagmiConfig";
import { toast } from "sonner";

export const claimToken = async (tokenIds: number[]): Promise<void> => {
	if (!tokenIds.length) {
		throw new Error("No token IDs provided.");
	}

	if (tokenIds.length > 20) {
		throw new Error("Cannot claim more than 20 tokens at once.");
	}

	const migrationContractAddress =
		process.env.NEXT_PUBLIC_MIGRATION_CONTRACT_ADDRESS;
	const oldContractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

	if (!migrationContractAddress || !oldContractAddress) {
		throw new Error("Contract addresses are not defined in env variables.");
	}

	const walletClient = await getWalletClient(config);
	if (!walletClient) {
		throw new Error("Wallet not connected.");
	}

	const userAddress = walletClient.account.address;

	toast("Checking token ownership...");

	// Check ownership of all tokens
	for (const tokenId of tokenIds) {
		const ownerOfToken = await readContract(config, {
			address: oldContractAddress as `0x${string}`,
			abi: IHyperFrogsAbi,
			functionName: "ownerOf",
			args: [tokenId],
		});

		if ((ownerOfToken as string).toLowerCase() !== userAddress.toLowerCase()) {
			throw new Error(`You are not the owner of token ${tokenId}.`);
		}
	}

	toast.success("Ownership verified.");

	// Check if already approved
	const approvalToast = toast.loading("Checking approval...");
	const isApproved = (await readContract(config, {
		address: oldContractAddress as `0x${string}`,
		abi: IERC721Abi,
		functionName: "isApprovedForAll",
		args: [userAddress, migrationContractAddress],
	})) as boolean;

	if (!isApproved) {
		toast.info("Approval needed. Sending approval transaction...", {
			id: approvalToast,
		});
		const approvalTxHash = await writeContract(config, {
			address: oldContractAddress as `0x${string}`,
			abi: IERC721Abi,
			functionName: "setApprovalForAll",
			args: [migrationContractAddress, true],
		});
		toast.loading("Waiting for approval transaction to confirm...");
		await waitForTransactionReceipt(config, { hash: approvalTxHash });
		toast.success("Approval granted.", { id: approvalToast });
	} else {
		toast.success("Approval already granted.", { id: approvalToast });
	}

	const claimToast = toast.loading(
		`Claiming ${tokenIds.length} Frog${tokenIds.length > 1 ? "s" : ""}...`
	);

	try {
		const claimTxHash = await writeContract(config, {
			address: migrationContractAddress as `0x${string}`,
			abi: HyperFrogsV2Abi,
			functionName: "batchClaim",
			args: [tokenIds],
		});
		await waitForTransactionReceipt(config, { hash: claimTxHash });

		toast.success(
			`${tokenIds.length} Frog${tokenIds.length > 1 ? "s" : ""} successfully migrated!`,
			{ id: claimToast }
		);
	} catch (error) {
		console.error("Claim failed:", error);
		toast.error("Migration failed. Please try again.", { id: claimToast });
		throw error; // rethrow to handle in the button if needed
	}
};
