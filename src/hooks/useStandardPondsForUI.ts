// src/hooks/useStandardPondsForUI.ts
'use client';

import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { pondCoreConfig } from '@/contracts/PondCore';
import { PondPeriod, type PondDisplayInfo } from '@/lib/types';
import { usePondStore, type EnhancedPond } from '@/stores/pondStore';

/**
 * Enhanced hook for fetching standard pond types with better error handling,
 * automatic store updates, and no placeholder data
 */
export function useStandardPondsForUI(
	tokenAddress = '0x0000000000000000000000000000000000000000',
) {
	const { setPondTypes, setIsLoadingPondTypes, setSelectedPond, selectedPond } =
		usePondStore();

	// Convert to 0x-prefixed address for wagmi
	const formattedAddress = tokenAddress as `0x${string}`;

	// Use the contract call to fetch data
	const {
		data: rawPondTypes,
		isLoading,
		isError,
		error,
		status,
		refetch,
	} = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'getStandardPondsForUI',
		args: [formattedAddress],
	});

	// Enhanced error handling with console warnings
	useEffect(() => {
		if (pondCoreConfig.address) {
			console.log('PondCore contract address:', pondCoreConfig.address);
		} else {
			console.warn('Warning: PondCore contract address is undefined in config');
		}

		if (isError && error) {
			console.error('Error fetching standard ponds:', error);
		}
	}, [isError, error]);

	// Process data and update store in one effect
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

					// Set first pond as selected if none is selected
					if (!selectedPond) {
						setSelectedPond(enhancedPonds[2].type);
					}

					console.log('Pond types updated in store:', enhancedPonds);
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
	]);

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
