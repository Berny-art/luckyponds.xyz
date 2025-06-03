'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, useBalance } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { parseEther, formatEther } from 'viem';
import { toast } from 'sonner';
import { 
	ERC20_ABI, 
	requiresApproval, 
	getApprovalErrorMessage,
	ERC20_ERROR_MESSAGES,
	needsApproval 
} from '@/utils/tokenUtils';
import { pondCoreConfig } from '@/contracts/PondCore';
import type { Token } from '@/stores/appStore';
import type { PondComprehensiveInfo } from '@/lib/types';

// Approval multiplier to reduce frequency of re-approvals
// Users approve 10x the max toss amount to avoid frequent approval transactions
const APPROVAL_MULTIPLIER = 10n;

export function useAllowance(token?: Token, maxTossAmount?: string, pondInfo?: PondComprehensiveInfo) {
	const [isApproving, setIsApproving] = useState(false);
	const [approvalHash, setApprovalHash] = useState<`0x${string}` | null>(null);
	const [approvalCompleted, setApprovalCompleted] = useState(false);
	const { writeContractAsync } = useWriteContract();
	const { address } = useAccount();
	const queryClient = useQueryClient();

	// Get balance for the selected token (native or ERC20)
	const { data: balance } = useBalance({
		address,
		token: token?.isNative ? undefined : token?.address as `0x${string}`
	});

	// Calculate max toss amount based on CoinTossInput logic - memoized to prevent excessive recalculation
	const getMaxTossAmount = useMemo(() => {
		if (!balance || !pondInfo || !token) return maxTossAmount || '0';

		const minTossPrice = pondInfo.minTossPrice || parseEther('0.01');
		const remainingAmount = pondInfo.remainingTossAmount || parseEther('10');
		const maxTotalAmount = pondInfo.maxTotalTossAmount || parseEther('10');

		// Calculate how many tosses are possible based on different constraints
		// 1. User's balance constraint - how many tosses can they afford?
		const maxFromBalance = balance.value / minTossPrice;

		// 2. Pond's remaining capacity constraint
		const maxFromRemaining = remainingAmount / minTossPrice;

		// 3. Any per-user maximum constraint (if applicable)
		const maxFromUserLimit = maxTotalAmount / minTossPrice;

		// Take the minimum of all constraints
		const maxPossible = Math.floor(
			Math.min(
				Number(maxFromBalance),
				Number(maxFromRemaining),
				Number(maxFromUserLimit),
			),
		);

		// Ensure at least 1 toss is possible, unless user can't afford any
		const maxTosses = maxPossible > 0 ? maxPossible : Number(maxFromBalance) >= 1 ? 1 : 0;
		
		// Calculate total amount for max tosses
		const calculatedMaxTossAmount = BigInt(maxTosses) * minTossPrice;
		return formatEther(calculatedMaxTossAmount);
	}, [balance?.value, pondInfo?.minTossPrice, pondInfo?.remainingTossAmount, pondInfo?.maxTotalTossAmount, token?.address, maxTossAmount]);

	const effectiveMaxTossAmount = maxTossAmount || getMaxTossAmount;

	// Check current allowance for ERC20 tokens
	const { data: currentAllowance, isLoading: isLoadingAllowance } = useReadContract({
		address: token?.address as `0x${string}`,
		abi: ERC20_ABI,
		functionName: 'allowance',
		args: [address as `0x${string}`, pondCoreConfig.address as `0x${string}`],
		query: {
			enabled: !!address && !!token?.address && !token?.isNative,
		},
	});

	// Watch for approval transaction status
	const { 
		isSuccess: approvalSuccess, 
		isError: approvalError, 
		error: approvalErrorDetails 
	} = useWaitForTransactionReceipt({
		hash: approvalHash as `0x${string}`,
	});

	// Reset approval completed state when token changes
	useEffect(() => {
		setApprovalCompleted(false);
	}, [token?.address]);

	// Handle approval transaction status changes
	useEffect(() => {
		if (!approvalHash) return;

		if (approvalSuccess) {
			toast.dismiss('approval-loading');
			toast.success('Token approval successful!', {
				description: 'You can now proceed with your coin toss.',
			});
			setApprovalHash(null);
			setIsApproving(false);
			setApprovalCompleted(true); // Force approval to be considered complete
			
			// Invalidate allowance queries to force refresh
			queryClient.invalidateQueries({
				queryKey: ['readContract'],
			});
		}

		if (approvalError && approvalErrorDetails) {
			toast.dismiss('approval-loading');
			const friendlyMessage = getApprovalErrorMessage(approvalErrorDetails.message || '');
			
			toast.error(friendlyMessage, {
				description: friendlyMessage === ERC20_ERROR_MESSAGES.APPROVAL_CANCELLED
					? 'You cancelled the approval transaction'
					: 'Please try approving the token again',
			});

			setApprovalHash(null);
			setIsApproving(false);
			setApprovalCompleted(false); // Reset approval completed state on error
		}
	}, [approvalHash, approvalSuccess, approvalError, approvalErrorDetails]);

	// Check if approval is needed - memoized to prevent excessive recalculation
	const isApprovalNeeded = useMemo(() => {
		if (!token || !effectiveMaxTossAmount || token.isNative || !requiresApproval(token)) {
			return false;
		}

		// If approval was completed locally, don't show approval needed anymore
		if (approvalCompleted) {
			return false;
		}

		if (currentAllowance === undefined || isLoadingAllowance) {
			return false; // Don't show approval needed while loading
		}

		const requiredAmount = parseEther(effectiveMaxTossAmount);
		const needsApprovalResult = needsApproval(currentAllowance || 0n, requiredAmount);
		
		return needsApprovalResult;
	}, [token?.address, token?.isNative, effectiveMaxTossAmount, approvalCompleted, currentAllowance, isLoadingAllowance]);

	// Function to approve ERC20 token spending
	const approveToken = async () => {
		if (!address || !token?.address || !effectiveMaxTossAmount) {
			toast.error('Invalid approval parameters', {
				description: 'Wallet not connected or invalid token.',
			});
			return { success: false, error: new Error('Invalid parameters') };
		}

		try {
			setIsApproving(true);
			
			toast.loading('Requesting token approval...', { id: 'approval-loading' });

			// Apply the multiplier to reduce future approval needs
			const baseAmount = parseEther(effectiveMaxTossAmount);
			const approvalAmount = baseAmount * APPROVAL_MULTIPLIER;

			const hash = await writeContractAsync({
				address: token.address as `0x${string}`,
				abi: ERC20_ABI,
				functionName: 'approve',
				args: [pondCoreConfig.address as `0x${string}`, approvalAmount],
			});

			setApprovalHash(hash);
			toast.loading('Approval submitted, waiting for confirmation...', {
				id: 'approval-loading',
			});

			return { success: true, hash, pending: true };
		} catch (error: any) {
			setIsApproving(false);
			toast.dismiss('approval-loading');

			const friendlyMessage = getApprovalErrorMessage(error?.message || '');
			toast.error(friendlyMessage, {
				description: friendlyMessage === ERC20_ERROR_MESSAGES.APPROVAL_CANCELLED
					? 'You cancelled the approval transaction'
					: 'Please try approving the token again',
			});

			return { success: false, error };
		}
	};

	return {
		isApprovalNeeded,
		isApproving,
		isLoadingAllowance,
		currentAllowance,
		maxTossAmount,
		approvalCompleted,
		approveToken,
	};
}
