// src/hooks/useAllPondWinners.ts
'use client';

import { useReadContract } from 'wagmi';
import { pondCoreConfig } from '@/contracts/PondCore';
import { PondPeriod, type PondDisplayInfo } from '@/lib/types';
import { useMemo } from 'react';

export interface PondWinnerData {
	period: PondPeriod;
	pondType: string;
	lastWinner: string;
	lastPrize: bigint;
	title: string;
	colorClass: string;
	textClass?: string;
}

/**
 * Custom hook to fetch winner data for a single pond
 */
function usePondWinnerData(pond: PondDisplayInfo | null) {
	const {
		data: lastWinner,
		isLoading: isWinnerLoading,
		isError: isWinnerError,
	} = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'lastWinner',
		args: pond ? [pond.pondType as `0x${string}`] : undefined,
		query: {
			enabled: !!pond,
			staleTime: 20000,
		},
	});

	const {
		data: lastPrize,
		isLoading: isPrizeLoading,
		isError: isPrizeError,
	} = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'lastPrize',
		args: pond ? [pond.pondType as `0x${string}`] : undefined,
		query: {
			enabled: !!pond,
			staleTime: 20000,
		},
	});

	return {
		lastWinner:
			(lastWinner as string) || '0x0000000000000000000000000000000000000000',
		lastPrize: lastPrize ? BigInt(lastPrize as string | number) : BigInt(0),
		isLoading: isWinnerLoading || isPrizeLoading,
		isError: isWinnerError || isPrizeError,
	};
}

/**
 * Hook to fetch winner data for all pond periods for a specific token
 * This allows pond winners to be displayed independently of the selected pond
 */
export function useAllPondWinners(tokenAddress: string) {
	// Get all pond types for the token
	const {
		data: pondTypes,
		isLoading: isPondTypesLoading,
		isError: isPondTypesError,
		refetch: refetchPondTypes,
	} = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'getStandardPondsForUI',
		args: [tokenAddress as `0x${string}`],
		query: {
			enabled: !!tokenAddress,
			staleTime: 30000, // 30 seconds
			refetchInterval: 60000, // 1 minute
		},
	});

	// Filter to existing ponds
	const existingPonds = useMemo(() => {
		if (!pondTypes || !Array.isArray(pondTypes)) return [];
		return pondTypes.filter((pond: PondDisplayInfo) => pond.exists);
	}, [pondTypes]);

	// Fetch winner data for each pond (limiting to prevent too many concurrent calls)
	const pond1 = existingPonds[0] || null;
	const pond2 = existingPonds[1] || null;
	const pond3 = existingPonds[2] || null;
	const pond4 = existingPonds[3] || null;
	const pond5 = existingPonds[4] || null;

	const pond1Data = usePondWinnerData(pond1);
	const pond2Data = usePondWinnerData(pond2);
	const pond3Data = usePondWinnerData(pond3);
	const pond4Data = usePondWinnerData(pond4);
	const pond5Data = usePondWinnerData(pond5);

	// Combine all the data
	const winners = useMemo((): PondWinnerData[] => {
		const result: PondWinnerData[] = [];
		const pondDataArray = [
			{ pond: pond1, data: pond1Data },
			{ pond: pond2, data: pond2Data },
			{ pond: pond3, data: pond3Data },
			{ pond: pond4, data: pond4Data },
			{ pond: pond5, data: pond5Data },
		];

		for (const { pond, data } of pondDataArray) {
			if (pond) {
				const config = getPondConfig(pond.period);
				result.push({
					period: pond.period,
					pondType: pond.pondType,
					lastWinner: data.lastWinner,
					lastPrize: data.lastPrize,
					...config,
				});
			}
		}

		return result;
	}, [
		pond1,
		pond2,
		pond3,
		pond4,
		pond5,
		pond1Data,
		pond2Data,
		pond3Data,
		pond4Data,
		pond5Data,
	]);

	const isLoading =
		isPondTypesLoading ||
		pond1Data.isLoading ||
		pond2Data.isLoading ||
		pond3Data.isLoading ||
		pond4Data.isLoading ||
		pond5Data.isLoading;
	const isError =
		isPondTypesError ||
		pond1Data.isError ||
		pond2Data.isError ||
		pond3Data.isError ||
		pond4Data.isError ||
		pond5Data.isError;

	return {
		winners,
		isLoading,
		isError,
		error: null,
		refetch: refetchPondTypes,
	};
}

/**
 * Get pond configuration (colors, titles) based on period
 */
function getPondConfig(period: PondPeriod) {
	switch (period) {
		case PondPeriod.FIVE_MIN:
			return {
				title: '5 Min Winner',
				colorClass: 'bg-primary-200/10 border-primary-200',
				textClass: 'text-primary-200',
			};
		case PondPeriod.HOURLY:
			return {
				title: 'Hourly Winner',
				colorClass: 'bg-blue-400/10 border-blue-400',
				textClass: 'text-blue-400',
			};
		case PondPeriod.DAILY:
			return {
				title: 'Daily Winner',
				colorClass: 'bg-orange-400/10 border-orange-400',
				textClass: 'text-orange-400',
			};
		case PondPeriod.WEEKLY:
			return {
				title: 'Weekly Winner',
				colorClass: 'bg-drip-300/10 border-drip-300',
				textClass: 'text-drip-300',
			};
		case PondPeriod.MONTHLY:
			return {
				title: 'Monthly Winner',
				colorClass: 'bg-purple-500/10 border-purple-500',
				textClass: 'text-purple-500',
			};
		default:
			return {
				title: 'Winner',
				colorClass: 'bg-purple-500/10 border-purple-500',
				textClass: 'text-purple-500',
			};
	}
}
