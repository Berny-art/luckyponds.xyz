'use client';

import { useQuery } from '@tanstack/react-query';
import type { UserData } from '@/types/user';

/**
 * Hook to fetch user data for a specific address
 *
 * @param address The Ethereum address to fetch data for
 * @param options Additional options for the query
 * @returns Query result containing user data
 */
export function useUserData(
	address?: string,
	options?: {
		enabled?: boolean;
		staleTime?: number;
		refetchOnWindowFocus?: boolean;
		retry?: number | boolean;
	},
) {
	return useQuery<UserData>({
		queryKey: ['userData', address?.toLowerCase()],
		queryFn: async () => {
			if (!address) {
				throw new Error('Address is required');
			}

			// Use our server-side API route to fetch user data
			const response = await fetch(`/api/user/${address}`);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.error || `Failed to fetch user data: ${response.status}`,
				);
			}

			const data = await response.json();
			return data as UserData;
		},
		enabled: !!address && options?.enabled !== false, // Only enable if we have an address and enabled isn't explicitly false
		staleTime: options?.staleTime || 300000, // Default to 5 minutes
		refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false, // Default to false
		retry: options?.retry ?? 1, // Default to 1 retry
	});
}

/**
 * Formats point values for display
 *
 * @param points The points value to format
 * @returns Formatted points string (e.g., "1.2K", "4.5M")
 */
export function formatPoints(points: number) {
	if (points >= 1000000) {
		return `${(points / 1000000).toFixed(1)}M`;
	}
	if (points >= 1000) {
		return `${(points / 1000).toFixed(1)}K`;
	}
	return points.toString();
}
