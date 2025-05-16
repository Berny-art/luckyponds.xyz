'use client';

import { useQuery } from '@tanstack/react-query';
import { useReadContract } from 'wagmi';
import { pondCoreConfig } from '@/contracts/PondCore';
import { PondPeriod, type PondDisplayInfo } from '@/lib/types';

// Enhanced version of EnrichedPond
export interface EnhancedPond {
	type: string; // the bytes32 pondType
	name: string; // actual name from the contract
	displayName: string; // user-friendly name
	period: PondPeriod;
	exists: boolean;
}

// Default pond data for optimistic UI rendering
const DEFAULT_PONDS: EnhancedPond[] = [
	{
		type: '0x1234567890123456789012345678901234567890123456789012345678901234', // Placeholder
		name: 'Five Minute Pond',
		displayName: '5 Min',
		period: PondPeriod.FIVE_MIN,
		exists: true,
	},
	{
		type: '0x2345678901234567890123456789012345678901234567890123456789012345', // Placeholder
		name: 'Hourly Pond',
		displayName: 'Hourly',
		period: PondPeriod.HOURLY,
		exists: true,
	},
	{
		type: '0x3456789012345678901234567890123456789012345678901234567890123456', // Placeholder
		name: 'Daily Pond',
		displayName: 'Daily',
		period: PondPeriod.DAILY,
		exists: true,
	},
	{
		type: '0x4567890123456789012345678901234567890123456789012345678901234567', // Placeholder
		name: 'Weekly Pond',
		displayName: 'Weekly',
		period: PondPeriod.WEEKLY,
		exists: true,
	},
	{
		type: '0x5678901234567890123456789012345678901234567890123456789012345678', // Placeholder
		name: 'Monthly Pond',
		displayName: 'Monthly',
		period: PondPeriod.MONTHLY,
		exists: true,
	},
];

// Function to convert PondPeriod to a display name
const getPondDisplayName = (period: PondPeriod, name: string): string => {
	switch (period) {
		case PondPeriod.FIVE_MIN:
			return '5 Min';
		case PondPeriod.HOURLY:
			return 'Hourly';
		case PondPeriod.DAILY:
			return 'Daily';
		case PondPeriod.WEEKLY:
			return 'Weekly';
		case PondPeriod.MONTHLY:
			return 'Monthly';
		case PondPeriod.CUSTOM:
			return name.split(' ')[0]; // Take first word of custom name
		default:
			return 'Unknown';
	}
};

export default function useStandardPondsForUI(
	tokenAddress = '0x0000000000000000000000000000000000000000',
	includeAll = false,
) {
	// Convert address string to 0x-prefixed address for wagmi
	const formattedAddress = tokenAddress as `0x${string}`;

	// Read contract data
	const { data: contractData } = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'getStandardPondsForUI',
		args: [formattedAddress],
	});

	// Use React Query to handle the data transformation with a default value
	return useQuery({
		queryKey: ['standardPonds', tokenAddress, includeAll],
		queryFn: async () => {
			// If we have contract data, transform it
			if (contractData) {
				// Transform contract data to our enhanced format
				const pondData = (contractData as PondDisplayInfo[]).map((pond) => ({
					type: pond.pondType,
					name: pond.pondName,
					displayName: getPondDisplayName(pond.period, pond.pondName),
					period: pond.period,
					exists: pond.exists,
				}));

				// Filter if needed
				return includeAll ? pondData : pondData.filter((pond) => pond.exists);
			}

			// If no data yet, return empty array (shouldn't happen with placeholderData)
			return [];
		},
		// Always provide default ponds for immediate rendering
		placeholderData: DEFAULT_PONDS,
		// Keep data fresh for 5 seconds before considering it stale
		staleTime: 5000,
		// Auto-refresh every 30 seconds
		refetchInterval: 300000,
		// Don't refetch on window focus (optional, depends on your app needs)
		refetchOnWindowFocus: false,
	});
}
