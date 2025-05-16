'use client';

import { useQuery } from '@tanstack/react-query';
import { useReadContract, useAccount } from 'wagmi';
import { pondCoreConfig } from '@/contracts/PondCore';
import type {
	PondComprehensiveInfo,
	TokenType,
	ParticipantInfo,
} from '@/lib/types';
import type { PondPeriod } from '@/lib/types';

export default function usePondInfo(pondType: string) {
	const { address } = useAccount();
	// Use a default address for anonymous viewing, or the connected wallet address
	const user = address ?? '0xaacDF5D6b6dF6215d895a3F8E6398AfF35E3b2Cf';

	// Log info about the hook call
	console.log(
		'usePondInfo called with pondType:',
		pondType,
		'contract address:',
		pondCoreConfig.address,
	);

	// Skip contract calls for invalid pond types
	const shouldQueryContract = !!pondType && !!pondCoreConfig.address;

	// Cast addresses to the format expected by wagmi
	const pondTypeFormatted = pondType as `0x${string}`;
	const userFormatted = user as `0x${string}`;

	// Get basic pond status
	const {
		data: pondStatusData,
		isError: statusError,
		error: statusErrorData,
	} = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'getPondStatus',
		args: shouldQueryContract ? [pondTypeFormatted] : undefined,
		query: {
			enabled: shouldQueryContract,
		},
	});

	// Log any errors
	if (statusError) {
		console.error('Error fetching pond status:', statusErrorData);
	}

	// Get user's toss amount
	const { data: userTossAmount } = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'getUserTossAmount',
		args:
			shouldQueryContract && user
				? [pondTypeFormatted, userFormatted]
				: undefined,
		query: {
			enabled: shouldQueryContract && !!user,
		},
	});

	// Get last winner
	const { data: lastWinner } = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'lastWinner',
		args: shouldQueryContract ? [pondTypeFormatted] : undefined,
		query: {
			enabled: shouldQueryContract,
		},
	});

	// Get last prize
	const { data: lastPrize } = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'lastPrize',
		args: shouldQueryContract ? [pondTypeFormatted] : undefined,
		query: {
			enabled: shouldQueryContract,
		},
	});

	// Get recent participants
	const { data: participants } = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'getPondParticipants',
		args: shouldQueryContract ? [pondTypeFormatted] : undefined,
		query: {
			enabled: shouldQueryContract,
			refetchInterval: 60000,
		},
	});

	// Log results of contract calls
	console.log('Contract call results:', {
		pondStatusData: pondStatusData ? 'Has data' : 'No data',
		userTossAmount: userTossAmount ? 'Has data' : 'No data',
		lastWinner: lastWinner ? 'Has data' : 'No data',
		lastPrize: lastPrize ? 'Has data' : 'No data',
		participants: participants ? 'Has data' : 'No data',
	});

	return useQuery({
		queryKey: ['pondInfo', pondType, user, shouldQueryContract],
		queryFn: async () => {
			console.log('Running pond info query function for:', pondType);

			// If we're not querying the contract or no data yet, return null
			if (!shouldQueryContract || !pondStatusData) {
				console.log('No pond status data for:', pondType);
				return null;
			}

			// With real data, proceed with transformation
			console.log('Transforming real data for pond:', pondType);
			try {
				// Prepare the return object with the base pond status
				const status = pondStatusData as unknown[];

				// Get the max toss amount from pond status
				const maxTotalTossAmount = status[9] as bigint;

				// Calculate remaining amount (max - user amount)
				const userAmount = (userTossAmount as bigint) || BigInt(0);
				const remainingTossAmount = maxTotalTossAmount - userAmount;

				// Prepare recent participants array
				let recentParticipants: ParticipantInfo[] = [];
				if (participants && Array.isArray(participants)) {
					// Limit to most recent 10 participants
					recentParticipants = (participants as ParticipantInfo[]).slice(0, 10);
				}

				// Construct the comprehensive info object
				return {
					name: status[0] as string,
					startTime: status[1] as bigint,
					endTime: status[2] as bigint,
					totalTosses: status[3] as bigint,
					totalValue: status[4] as bigint,
					totalParticipants: status[5] as bigint,
					prizeDistributed: status[6] as boolean,
					timeUntilEnd: status[7] as bigint,
					minTossPrice: status[8] as bigint,
					maxTotalTossAmount,
					tokenType: status[10] as TokenType,
					tokenAddress: status[11] as string,
					period: status[12] as PondPeriod,
					userTossAmount: userAmount,
					remainingTossAmount,
					lastPondWinner:
						(lastWinner as string) ||
						'0x0000000000000000000000000000000000000000',
					lastPondPrize: (lastPrize as bigint) || BigInt(0),
					recentParticipants,
				} as PondComprehensiveInfo;
			} catch (error) {
				console.error('Error transforming pond data:', error);
				return null;
			}
		},
		// Only enable the query when we should query the contract
		enabled: shouldQueryContract,
		// Auto-refresh every 15 seconds
		refetchInterval: 15000,
		// Don't refetch on window focus to reduce unnecessary calls
		refetchOnWindowFocus: false,
		// Define stale time to reduce refetches for the same data
		staleTime: 10000, // 10 seconds
	});
}
