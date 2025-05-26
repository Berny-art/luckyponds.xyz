// src/hooks/useStandardPondsForUI.ts
// REPLACE your existing useStandardPondsForUI hook with this updated version:

'use client';

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { pondCoreConfig } from '@/contracts/PondCore';
import { PondPeriod, type PondDisplayInfo } from '@/lib/types';
import { usePondStore, type EnhancedPond } from '@/stores/pondStore';
import useLocalStorage from 'use-local-storage';

/**
 * Enhanced hook for fetching standard pond types with token address parameter
 */
export function useStandardPondsForUI(
	tokenAddress = '0x0000000000000000000000000000000000000000', // Default to native
) {
	const { setPondTypes, setIsLoadingPondTypes, setSelectedPond, selectedPond } =
		usePondStore();
	const [lightningMode] = useLocalStorage('lightningMode', false);

	// Convert to 0x-prefixed address for wagmi
	const formattedAddress = tokenAddress as `0x${string}`;

	// Use the contract call to fetch data
	const {
		data: rawPondTypes,
		isLoading,
		isError,
		error,
		refetch,
	} = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'getStandardPondsForUI',
		args: [formattedAddress],
	});

	// Process data and update store in one effect
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		// Always update loading state
		setIsLoadingPondTypes(isLoading);

		// Process the data when available
		if (rawPondTypes && Array.isArray(rawPondTypes) && !isLoading) {
			try {
				// Transform raw pond data to enhanced format
				const enhancedPonds: EnhancedPond[] = rawPondTypes
					.map((pond: PondDisplayInfo) => ({
						type: pond.pondType,
						name: pond.pondName,
						displayName: getPondDisplayName(pond.period, pond.pondName),
						period: pond.period,
						exists: pond.exists,
					}))
					.filter((pond) => pond.exists);

				// Update the store
				if (enhancedPonds.length > 0) {
					setPondTypes(enhancedPonds);

					// Set first pond as selected if none is selected OR if token changed
					if (!selectedPond) {
						setSelectedPond(
							lightningMode ? enhancedPonds[0]?.type : enhancedPonds[2]?.type,
						);
					}
				} else {
					console.warn('No valid pond types found after filtering');
				}
			} catch (processingError) {
				console.error('Error processing pond data:', processingError);
			} finally {
				// Ensure loading state is set to false even if processing fails
				setIsLoadingPondTypes(false);
			}
		}
	}, [
		rawPondTypes,
		isLoading,
		setPondTypes,
		setIsLoadingPondTypes,
		setSelectedPond,
		selectedPond,
		tokenAddress, // Add tokenAddress as dependency
	]);

	// Reset selected pond when token changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		setSelectedPond('');
	}, [tokenAddress, setSelectedPond]);

	// Return the processed data along with loading/error states
	return {
		ponds: rawPondTypes
			? (rawPondTypes as PondDisplayInfo[]).filter(
					(pond: PondDisplayInfo) => pond.exists,
				)
			: [],
		isLoading,
		isError,
		error,
		refetch,
	};
}

/**
 * Helper function to get display name from pond period
 */
function getPondDisplayName(period: PondPeriod, name: string): string {
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
			return name;
	}
}
