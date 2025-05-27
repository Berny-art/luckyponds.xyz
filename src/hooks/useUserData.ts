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
			if (!address) throw new Error('Address is required');

			const controller = new AbortController();

			try {
				const response = await fetch(`/api/user/${address}`, {
					signal: controller.signal,
					headers: {
						'Cache-Control': 'max-age=300', // 5 minutes client cache
					},
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					throw new Error(errorData.error || `HTTP ${response.status}`);
				}

				return await response.json();
			} catch {
				throw new Error('Request timeout');
			}
		},
		enabled: !!address && options?.enabled !== false,
		staleTime: options?.staleTime || 300000, // 5 minutes
		gcTime: 600000, // 10 minutes
		refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
		retry: options?.retry ?? 2,
		// Add request deduplication
		networkMode: 'always',
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
