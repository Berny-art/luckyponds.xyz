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
 * Optimized hook to fetch pond information with adaptive refresh rates
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

	// Determine refresh intervals based on pond type
	const getRefreshInterval = (baseInterval: number) => {
		// For 5-minute ponds, use much more aggressive refresh rates
		if (pondType?.includes('FIVE_MIN') || pondType?.includes('5min')) {
			return Math.max(baseInterval / 4, 2000); // 4x faster, min 2 seconds
		}
		// For daily ponds, use standard rates
		return baseInterval;
	};

	// Get basic pond status - the most important data
	const {
		data: pondStatusData,
		isError: isStatusError,
		error: statusError,
		isLoading: isStatusLoading,
		refetch: refetchStatus,
	} = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'getPondStatus',
		args: pondTypeFormatted ? [pondTypeFormatted] : undefined,
		query: {
			enabled: isValidPondType,
			refetchInterval: getRefreshInterval(8000), // 2s for 5min, 8s for daily
			refetchIntervalInBackground: true,
			refetchOnWindowFocus: true,
			staleTime: getRefreshInterval(4000), // 1s for 5min, 4s for daily
		},
	});

	// Get user's toss amount (only for logged-in users)
	const {
		data: userTossAmount,
		isLoading: isUserAmountLoading,
		refetch: refetchUserAmount,
	} = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'getUserTossAmount',
		args:
			pondTypeFormatted && userAddress
				? [pondTypeFormatted, userAddress]
				: undefined,
		query: {
			enabled: isValidPondType && !!userAddress,
			refetchInterval: getRefreshInterval(15000), // 3.75s for 5min, 15s for daily
			refetchIntervalInBackground: true,
			staleTime: getRefreshInterval(8000),
		},
	});

	// Get last winner and prize - these don't change as frequently
	const { data: lastWinner, refetch: refetchWinner } = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'lastWinner',
		args: pondTypeFormatted ? [pondTypeFormatted] : undefined,
		query: {
			enabled: isValidPondType,
			refetchInterval: getRefreshInterval(30000), // 7.5s for 5min, 30s for daily
			staleTime: getRefreshInterval(20000),
		},
	});

	const { data: lastPrize, refetch: refetchPrize } = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'lastPrize',
		args: pondTypeFormatted ? [pondTypeFormatted] : undefined,
		query: {
			enabled: isValidPondType,
			refetchInterval: getRefreshInterval(30000), // 7.5s for 5min, 30s for daily
			staleTime: getRefreshInterval(20000),
		},
	});

	// Get participants - fetch this with medium priority
	const { data: participants, refetch: refetchParticipants } = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'getPondParticipants',
		args: pondTypeFormatted ? [pondTypeFormatted] : undefined,
		query: {
			enabled: isValidPondType,
			refetchInterval: getRefreshInterval(20000), // 5s for 5min, 20s for daily
			refetchIntervalInBackground: true,
			staleTime: getRefreshInterval(10000),
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

		enabled: isValidPondType && !!pondStatusData,
		staleTime: getRefreshInterval(2000), // 500ms for 5min, 2s for daily
		refetchInterval: getRefreshInterval(10000), // 2.5s for 5min, 10s for daily
		refetchIntervalInBackground: true,
		refetchOnWindowFocus: true,

		// Expose refetch functions for manual refresh
		meta: {
			isLoading: isStatusLoading || isUserAmountLoading,
			refetchAll: () => {
				refetchStatus();
				refetchUserAmount();
				refetchWinner();
				refetchPrize();
				refetchParticipants();
			},
		},
	});
}
