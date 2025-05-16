'use client';

import { useReadContract } from 'wagmi';
import { pondCoreConfig } from '@/contracts/PondCore';
import { PondPeriod } from '@/lib/types';

export interface EnhancedPond {
	type: string; // the bytes32 pondType
	name: string; // full name from contract
	displayName: string; // shortened display name
	period: PondPeriod;
	exists: boolean;
}

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

	// Use the contract hook to fetch data
	const {
		data: contractData,
		isLoading,
		isError,
		error,
	} = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'getStandardPondsForUI',
		args: [formattedAddress],
	});

	// Log any errors for debugging
	if (isError && error) {
		console.error('Error fetching standard ponds:', error);
	}

	// Process the contract data
	let data: EnhancedPond[] = [];

	if (contractData && Array.isArray(contractData)) {
		try {
			// Map contract data to our format
			data = contractData.map((pond: any) => ({
				type: pond.pondType,
				name: pond.pondName,
				displayName: getPondDisplayName(pond.period, pond.pondName),
				period: pond.period,
				exists: pond.exists,
			}));

			// Filter if needed
			if (!includeAll) {
				data = data.filter((pond) => pond.exists);
			}
		} catch (processError) {
			console.error('Error processing pond data:', processError);
		}
	}

	return {
		data,
		isLoading,
		isError,
		error,
	};
}
