// src/hooks/usePondInfo.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { useReadContract, useAccount } from 'wagmi';
import { pondCoreConfig } from '@/contracts/PondCore';
import type {
	PondComprehensiveInfo,
	TokenType,
	ParticipantInfo,
	PondPeriod,
} from '@/lib/types';

/**
 * Simplified hook to fetch pond information efficiently
 */
export default function usePondInfo(pondType: string | null) {
	// Get user address for user-specific data
	const { address } = useAccount();

	const isValidPondType =
		!!pondType && pondType !== '0x0000000000000000000000000000000000000000';
	const pondTypeFormatted = isValidPondType
		? (pondType as `0x${string}`)
		: undefined;
	const userAddress = address as `0x${string}` | undefined;

	// Get basic pond status - the most important data
	const {
		data: pondStatusData,
		isError: isStatusError,
		error: statusError,
		isLoading: isStatusLoading,
	} = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'getPondStatus',
		args: pondTypeFormatted ? [pondTypeFormatted] : undefined,
		query: {
			enabled: isValidPondType,
			refetchInterval: 15000,
		},
	});

	// Get user's toss amount (only for logged-in users)
	const { data: userTossAmount, isLoading: isUserAmountLoading } =
		useReadContract({
			...pondCoreConfig,
			address: pondCoreConfig.address as `0x${string}`,
			functionName: 'getUserTossAmount',
			args:
				pondTypeFormatted && userAddress
					? [pondTypeFormatted, userAddress]
					: undefined,
			query: {
				enabled: isValidPondType && !!userAddress,
				refetchInterval: 30000, // Less frequent updates
			},
		});

	// Get last winner and prize - these don't change as frequently
	const { data: lastWinner } = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'lastWinner',
		args: pondTypeFormatted ? [pondTypeFormatted] : undefined,
		query: {
			enabled: isValidPondType,
			refetchInterval: 60000, // Less frequent updates
		},
	});

	const { data: lastPrize } = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'lastPrize',
		args: pondTypeFormatted ? [pondTypeFormatted] : undefined,
		query: {
			enabled: isValidPondType,
			refetchInterval: 60000, // Less frequent updates
		},
	});

	// Get participants - fetch this with lower priority
	const { data: participants } = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'getPondParticipants',
		args: pondTypeFormatted ? [pondTypeFormatted] : undefined,
		query: {
			enabled: isValidPondType,
			refetchInterval: 45000, // Less frequent updates
		},
	});

	// Log errors for debugging
	if (isStatusError && statusError) {
		console.error(`Error fetching pond status for ${pondType}:`, statusError);
	}

	// Process and combine the data
	return useQuery({
		queryKey: ['pondInfo', pondType, address],

		queryFn: async () => {
			// Exit early if no pond status data
			if (!pondStatusData) return null;

			try {
				// Cast the status data to the expected structure
				const status = pondStatusData as unknown[];

				// Get the max toss amount from pond status
				const maxTotalTossAmount = status[9] as bigint;

				// Default user amount to 0 if not available
				const userAmount = (userTossAmount as bigint) || BigInt(0);

				// Calculate remaining amount
				const remainingTossAmount = maxTotalTossAmount - userAmount;

				// Process participants (if available)
				let recentParticipants: ParticipantInfo[] = [];
				if (participants && Array.isArray(participants)) {
					// Take just the first 10 participants - skip expensive sorting
					recentParticipants = (participants as ParticipantInfo[]).slice(0, 10);
				}

				// Calculate remaining time more accurately
				const now = Math.floor(Date.now() / 1000);
				const endTimeValue = Number(status[2] as bigint);
				const timeUntilEnd =
					endTimeValue > now ? BigInt(endTimeValue - now) : BigInt(0);

				// Construct the comprehensive info object
				const pondComprehensiveInfo: PondComprehensiveInfo = {
					name: status[0] as string,
					startTime: status[1] as bigint,
					endTime: status[2] as bigint,
					totalTosses: status[3] as bigint,
					totalValue: status[4] as bigint,
					totalParticipants: status[5] as bigint,
					prizeDistributed: status[6] as boolean,
					timeUntilEnd: timeUntilEnd, // Use our recalculated value
					minTossPrice: status[8] as bigint,
					maxTotalTossAmount,
					tokenType: status[10] as TokenType,
					tokenAddress: status[11] as `0x${string}`,
					period: status[12] as PondPeriod,
					userTossAmount: userAmount,
					remainingTossAmount,
					lastPondWinner:
						(lastWinner as `0x${string}`) ||
						'0x0000000000000000000000000000000000000000',
					lastPondPrize: (lastPrize as bigint) || BigInt(0),
					recentParticipants,
				};

				return pondComprehensiveInfo;
			} catch (error) {
				console.error(`Error processing pond data for ${pondType}:`, error);
				return null; // Return null instead of throwing
			}
		},

		enabled: isValidPondType && !!pondStatusData, // Only run when we have the basic data
		staleTime: 5000, // Small stale time to avoid excessive re-renders
		refetchInterval: false, // Don't auto-refetch - we'll rely on the individual queries

		// Don't fail the query on error
		meta: {
			isLoading: isStatusLoading || isUserAmountLoading,
		},
	});
}
