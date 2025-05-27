// src/stores/pondDataStore.ts
'use client';

import { create } from 'zustand';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useReadContract, useAccount } from 'wagmi';
import { pondCoreConfig } from '@/contracts/PondCore';
import type {
	PondComprehensiveInfo,
	TokenType,
	ParticipantInfo,
} from '@/lib/types';
import { PondPeriod } from '@/lib/types';

interface PondDataState {
	// Current selections
	selectedPondId: string | null;
	currentTokenAddress: string;

	// Error handling
	lastError: Error | null;
	retryCount: number;
	isConnectionHealthy: boolean;

	// Actions
	setSelectedPondId: (pondId: string) => void;
	setCurrentTokenAddress: (address: string) => void;
	setLastError: (error: Error | null) => void;
	incrementRetryCount: () => void;
	resetRetryCount: () => void;
	setConnectionHealthy: (healthy: boolean) => void;
}

export const usePondDataStore = create<PondDataState>((set) => ({
	selectedPondId: null,
	currentTokenAddress: '0x0000000000000000000000000000000000000000', // Default to native
	lastError: null,
	retryCount: 0,
	isConnectionHealthy: true,

	setSelectedPondId: (pondId) => set({ selectedPondId: pondId }),
	setCurrentTokenAddress: (address) => set({ currentTokenAddress: address }),
	setLastError: (error) => set({ lastError: error }),
	incrementRetryCount: () =>
		set((state) => ({ retryCount: state.retryCount + 1 })),
	resetRetryCount: () => set({ retryCount: 0 }),
	setConnectionHealthy: (healthy) => set({ isConnectionHealthy: healthy }),
}));

// Enhanced retry configuration
const getRetryConfig = (period?: PondPeriod) => {
	const baseRetries = 3;
	const baseDelay = 1000;

	// More aggressive retries for 5-minute ponds
	const retries = period === PondPeriod.FIVE_MIN ? 5 : baseRetries;
	const delay = period === PondPeriod.FIVE_MIN ? 500 : baseDelay;

	return {
		retry: retries,
		retryDelay: (attemptIndex: number) =>
			Math.min(delay * 2 ** attemptIndex, 10000),
	};
};

// Enhanced error handling function
const handleQueryError = (
	error: Error | unknown,
	functionName: string,
	setLastError: (error: Error | null) => void,
) => {
	const enhancedError = new Error(
		`${functionName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
	);
	setLastError(enhancedError);
};

// Main hook for pond data - this replaces your existing usePondInfo
export function usePondData() {
	const {
		selectedPondId,
		currentTokenAddress,
		setLastError,
		incrementRetryCount,
		resetRetryCount,
		setConnectionHealthy,
		lastError,
		retryCount,
		isConnectionHealthy,
	} = usePondDataStore();
	const { address } = useAccount();
	const queryClient = useQueryClient();

	const isValidPondId =
		!!selectedPondId &&
		selectedPondId !== '0x0000000000000000000000000000000000000000';
	const pondIdFormatted = isValidPondId
		? (selectedPondId as `0x${string}`)
		: undefined;
	const userAddress = address as `0x${string}` | undefined;

	// Main pond status query - this drives everything with enhanced error handling
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
			...getRetryConfig(),
			refetchInterval: (data) => {
				// Smart refetch intervals based on pond type and connection health
				if (!isConnectionHealthy) return 60000; // Slower when connection issues

				if (data && Array.isArray(data)) {
					const period = data[12] as PondPeriod;
					const now = Math.floor(Date.now() / 1000);
					const endTime = Number(data[2] as bigint);
					const timeUntilEnd = endTime - now;
					const prizeDistributed = Boolean(data[8]);

					// Circuit breaker: If pond is completed and prize distributed for non-5min ponds, stop polling
					if (
						prizeDistributed &&
						period !== PondPeriod.FIVE_MIN &&
						timeUntilEnd < -300
					) {
						return false; // Stop polling completely for completed non-5min ponds
					}

					switch (period) {
						case PondPeriod.FIVE_MIN:
							// If prize is already distributed, slow down requests significantly
							if (prizeDistributed) {
								return 30000; // 30 seconds when pond is complete
							}

							// More conservative refresh for 5-minute ponds during transitions
							if (timeUntilEnd <= 10 && timeUntilEnd >= -20) {
								// Frequent updates only during critical transition period (10s before to 20s after)
								return retryCount > 0 ? 3000 : 2000;
							}
							return retryCount > 0 ? 8000 : 6000; // Slower default refresh
						case PondPeriod.HOURLY:
							return retryCount > 0 ? 15000 : 12000;
						case PondPeriod.DAILY:
							return retryCount > 0 ? 30000 : 25000;
						default:
							return retryCount > 0 ? 45000 : 35000;
					}
				}
				return retryCount > 0 ? 25000 : 20000;
			},
			staleTime: 2000,
		},
	});

	// Handle status query errors and success
	if (isStatusError && statusError) {
		handleQueryError(statusError, 'getPondStatus', setLastError);
		incrementRetryCount();
		setConnectionHealthy(false);
	} else if (pondStatusData && !isStatusError) {
		if (retryCount > 0) {
			resetRetryCount();
		}
		if (!isConnectionHealthy) {
			setConnectionHealthy(true);
		}
		if (lastError) {
			setLastError(null);
		}
	}

	// User's toss amount with enhanced error handling
	const {
		data: userTossAmount,
		isLoading: isUserAmountLoading,
		isError: isUserAmountError,
		error: userAmountError,
	} = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'getUserTossAmount',
		args:
			pondIdFormatted && userAddress
				? [pondIdFormatted, userAddress]
				: undefined,
		query: {
			enabled: isValidPondId && !!userAddress,
			...getRetryConfig(),
			refetchInterval: 12000, // 12 seconds
			staleTime: 8000,
		},
	});

	// Handle user amount query errors
	if (isUserAmountError && userAmountError) {
		handleQueryError(userAmountError, 'getUserTossAmount', setLastError);
	}

	// Last winner and prize with optimized refresh intervals
	const {
		data: lastWinner,
		isError: isLastWinnerError,
		error: lastWinnerError,
	} = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'lastWinner',
		args: pondIdFormatted ? [pondIdFormatted] : undefined,
		query: {
			enabled: isValidPondId,
			...getRetryConfig(),
			refetchInterval: 30000,
			staleTime: 20000,
		},
	});

	const {
		data: lastPrize,
		isError: isLastPrizeError,
		error: lastPrizeError,
	} = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'lastPrize',
		args: pondIdFormatted ? [pondIdFormatted] : undefined,
		query: {
			enabled: isValidPondId,
			...getRetryConfig(),
			refetchInterval: 30000,
			staleTime: 20000,
		},
	});

	// Handle winner/prize query errors
	if (isLastWinnerError && lastWinnerError) {
		handleQueryError(lastWinnerError, 'lastWinner', setLastError);
	}
	if (isLastPrizeError && lastPrizeError) {
		handleQueryError(lastPrizeError, 'lastPrize', setLastError);
	}

	// Participants with enhanced error handling
	const {
		data: participants,
		isError: isParticipantsError,
		error: participantsError,
	} = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'getPondParticipants',
		args: pondIdFormatted ? [pondIdFormatted] : undefined,
		query: {
			enabled: isValidPondId,
			...getRetryConfig(),
			refetchInterval: isConnectionHealthy ? 45000 : 90000, // Slower when connection issues
			staleTime: 30000,
		},
	});

	// Handle participants query errors
	if (isParticipantsError && participantsError) {
		handleQueryError(participantsError, 'getPondParticipants', setLastError);
	}

	// Combine all data into pond info with enhanced validation and error handling
	const pondInfo = useQuery({
		queryKey: ['pondInfo', selectedPondId, currentTokenAddress, address],
		queryFn: async (): Promise<PondComprehensiveInfo | null> => {
			if (!pondStatusData) return null;

			try {
				const status = pondStatusData as unknown[];

				// Validate required data structure
				if (!Array.isArray(status) || status.length < 13) {
					throw new Error('Invalid pond status data structure');
				}

				// Validate critical numeric values
				const maxTotalTossAmount = status[9] as bigint;
				const userAmount = (userTossAmount as bigint) || BigInt(0);

				if (typeof maxTotalTossAmount !== 'bigint') {
					throw new Error('Invalid maxTotalTossAmount');
				}

				const remainingTossAmount = maxTotalTossAmount - userAmount;

				let recentParticipants: ParticipantInfo[] = [];
				if (participants && Array.isArray(participants)) {
					recentParticipants = (participants as ParticipantInfo[]).slice(0, 10);
				}

				const now = Math.floor(Date.now() / 1000);
				const endTimeValue = Number(status[2] as bigint);
				const timeUntilEnd =
					endTimeValue > now ? BigInt(endTimeValue - now) : BigInt(0);

				// Validate essential pond data
				const pondName = status[0] as string;
				if (!pondName || typeof pondName !== 'string') {
					throw new Error('Invalid pond name');
				}

				const period = status[12] as PondPeriod;
				if (!Object.values(PondPeriod).includes(period)) {
					throw new Error('Invalid pond period');
				}

				const info: PondComprehensiveInfo = {
					name: pondName,
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
					period,
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
				const enhancedError = new Error(
					`Error processing pond data: ${error instanceof Error ? error.message : 'Unknown error'}`,
				);
				handleQueryError(enhancedError, 'pondInfo processing', setLastError);
				throw enhancedError;
			}
		},
		enabled: !!pondStatusData,
		staleTime: 2000, // Fixed 2 seconds - keep it simple
		refetchInterval: false, // Rely on constituent queries
		...getRetryConfig(), // Add retry configuration to main query
	});

	// Utility functions with enhanced query management
	const refetchUserData = async () => {
		try {
			resetRetryCount();
			await queryClient.invalidateQueries({
				queryKey: [
					{
						entity: 'readContract',
						functionName: 'getUserTossAmount',
					},
				],
			});
		} catch (error) {
			handleQueryError(error, 'refetchUserData', setLastError);
		}
	};

	const refetchAll = async () => {
		try {
			resetRetryCount();
			// Invalidate all pond-related queries in the correct order
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

			// Finally invalidate the combined query
			await queryClient.invalidateQueries({
				queryKey: ['pondInfo', selectedPondId, currentTokenAddress],
			});
		} catch (error) {
			handleQueryError(error, 'refetchAll', setLastError);
		}
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

		// Enhanced error handling state
		lastError,
		retryCount,
		isConnectionHealthy,

		// Utility functions
		refetchAll,
		refetchUserData,

		// Store actions
		setSelectedPondId: usePondDataStore.getState().setSelectedPondId,
		setCurrentTokenAddress: usePondDataStore.getState().setCurrentTokenAddress,
	};
}
