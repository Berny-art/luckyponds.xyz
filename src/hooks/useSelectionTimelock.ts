'use client';

import { useReadContract } from 'wagmi';
import { pondCoreConfig } from '@/contracts/PondCore';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to get the selection timelock value from the PondCore contract
 * @returns The selection timelock in seconds as a bigint
 */
export function useSelectionTimelock() {
	// Read the timelock value from the contract
	const { data: rawTimelock } = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'selectionTimelock',
		args: [],
	});

	// Use React Query to handle the data with caching
	return useQuery({
		queryKey: ['selectionTimelock'],
		queryFn: async () => {
			// Return the timelock value, or a default if not available
			return (rawTimelock as bigint) || BigInt(300); // Default to 5 minutes
		},
		// Timelock rarely changes, so we can cache it for longer
		staleTime: 3600000, // 1 hour
		// Don't refetch on window focus for this static value
		refetchOnWindowFocus: false,
	});
}
