// src/hooks/usePondData.ts
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useReadContract, useAccount } from 'wagmi';
import { pondCoreConfig } from '@/contracts/PondCore';
import type {
	PondComprehensiveInfo,
	TokenType,
	ParticipantInfo,
} from '@/lib/types';
import { PondPeriod } from '@/lib/types';

interface UsePondDataOptions {
	pondId: string | null;
	tokenAddress: string;
}

// Smart refetch intervals based on pond type
const getRefetchInterval = (period?: PondPeriod, prizeDistributed?: boolean) => {
	if (prizeDistributed && period !== PondPeriod.FIVE_MIN) {
		return 30000; // 30s for completed non-5min ponds
	}

	switch (period) {
		case PondPeriod.FIVE_MIN:
			return 5000; // 5s for fast ponds
		case PondPeriod.HOURLY:
			return 15000; // 15s for hourly
		case PondPeriod.DAILY:
			return 30000; // 30s for daily
		default:
			return 45000; // 45s for others
	}
};

export function usePondData({ pondId, tokenAddress }: UsePondDataOptions) {
	const { address } = useAccount();
	const queryClient = useQueryClient();

	const isValidPondId =
		!!pondId && pondId !== '0x0000000000000000000000000000000000000000';
	const pondIdFormatted = isValidPondId ? (pondId as `0x${string}`) : undefined;
	const userAddress = address as `0x${string}` | undefined;

	// Main pond status query
	const {
		data: pondStatusData,
		isLoading: isStatusLoading,
		isError: isStatusError,
		error: statusError,
		isFetching: isStatusFetching,
	} = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'getPondStatus',
		args: pondIdFormatted ? [pondIdFormatted] : undefined,
		query: {
			enabled: isValidPondId,
			refetchInterval: (data) => {
				if (data && Array.isArray(data)) {
					const period = data[12] as PondPeriod;
					const prizeDistributed = Boolean(data[6]);
					return getRefetchInterval(period, prizeDistributed);
				}
				return 20000;
			},
			staleTime: 2000,
		},
	});

	// User's toss amount
	const { data: userTossAmount, isLoading: isUserAmountLoading } = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'getUserTossAmount',
		args:
			pondIdFormatted && userAddress
				? [pondIdFormatted, userAddress]
				: undefined,
		query: {
			enabled: isValidPondId && !!userAddress,
			refetchInterval: 12000,
			staleTime: 8000,
		},
	});

	// Last winner and prize
	const { data: lastWinner } = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'lastWinner',
		args: pondIdFormatted ? [pondIdFormatted] : undefined,
		query: {
			enabled: isValidPondId,
			refetchInterval: 30000,
			staleTime: 20000,
		},
	});

	const { data: lastPrize } = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'lastPrize',
		args: pondIdFormatted ? [pondIdFormatted] : undefined,
		query: {
			enabled: isValidPondId,
			refetchInterval: 30000,
			staleTime: 20000,
		},
	});

	// Participants
	const { data: participants } = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'getPondParticipants',
		args: pondIdFormatted ? [pondIdFormatted] : undefined,
		query: {
			enabled: isValidPondId,
			refetchInterval: 45000,
			staleTime: 30000,
		},
	});

	// Combine all data into comprehensive pond info
	const pondInfo = useQuery({
		queryKey: ['pondInfo', pondId, tokenAddress, address],
		queryFn: async (): Promise<PondComprehensiveInfo | null> => {
			if (!pondStatusData) return null;

			try {
				const status = pondStatusData as unknown[];

				if (!Array.isArray(status) || status.length < 13) {
					throw new Error('Invalid pond status data structure');
				}

				const maxTotalTossAmount = status[9] as bigint;
				const userAmount = (userTossAmount as bigint) || BigInt(0);
				const remainingTossAmount = maxTotalTossAmount - userAmount;

				let recentParticipants: ParticipantInfo[] = [];
				if (participants && Array.isArray(participants)) {
					recentParticipants = (participants as ParticipantInfo[]).slice(0, 10);
				}

				const now = Math.floor(Date.now() / 1000);
				const endTimeValue = Number(status[2] as bigint);
				const timeUntilEnd =
					endTimeValue > now ? BigInt(endTimeValue - now) : BigInt(0);

				const info: PondComprehensiveInfo = {
					name: status[0] as string,
					startTime: status[1] as bigint,
					endTime: status[2] as bigint,
					totalTosses: status[3] as bigint,
					totalValue: status[4] as bigint,
					totalParticipants: status[5] as bigint,
					prizeDistributed: status[6] as boolean,
					timeUntilEnd: timeUntilEnd,
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

				return info;
			} catch (error) {
				console.error('Error processing pond data:', error);
				return null;
			}
		},
		enabled: !!pondStatusData,
		staleTime: 2000,
		refetchInterval: false, // Rely on constituent queries
	});

	// Utility functions
	const refetchUserData = async () => {
		await queryClient.invalidateQueries({
			queryKey: [
				{
					entity: 'readContract',
					functionName: 'getUserTossAmount',
				},
			],
		});
	};

	const refetchAll = async () => {
		await Promise.all([
			queryClient.invalidateQueries({
				queryKey: [
					{
						entity: 'readContract',
						functionName: 'getPondStatus',
					},
				],
			}),
			queryClient.invalidateQueries({
				queryKey: [
					{
						entity: 'readContract',
						functionName: 'getUserTossAmount',
					},
				],
			}),
			queryClient.invalidateQueries({
				queryKey: [
					{
						entity: 'readContract',
						functionName: 'lastWinner',
					},
				],
			}),
			queryClient.invalidateQueries({
				queryKey: [
					{
						entity: 'readContract',
						functionName: 'lastPrize',
					},
				],
			}),
			queryClient.invalidateQueries({
				queryKey: [
					{
						entity: 'readContract',
						functionName: 'getPondParticipants',
					},
				],
			}),
		]);

		await queryClient.invalidateQueries({
			queryKey: ['pondInfo', pondId, tokenAddress],
		});
	};

	return {
		// Main data
		pondInfo: pondInfo.data,

		// Loading states
		isLoading: isStatusLoading || pondInfo.isLoading,
		isFetching: isStatusFetching || pondInfo.isFetching,
		isUserDataLoading: isUserAmountLoading,

		// Error states
		isError: isStatusError || pondInfo.isError,
		error: statusError || pondInfo.error,

		// Utility functions
		refetchAll,
		refetchUserData,
	};
}
