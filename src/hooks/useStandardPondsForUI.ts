// src/hooks/useStandardPondsForUI.ts
'use client';

import { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';
import { pondCoreConfig } from '@/contracts/PondCore';
import { PondPeriod, type PondDisplayInfo } from '@/lib/types';
import { useAppStore, type EnhancedPond } from '@/stores/appStore';
import useLocalStorage from 'use-local-storage';

/**
 * Enhanced hook for fetching standard pond types with token address parameter
 */
export function useStandardPondsForUI(
	tokenAddress = '0x0000000000000000000000000000000000000000', // Default to native
) {
	const { setPondTypes, setIsLoadingPondTypes, setSelectedPond, selectedPond } =
		useAppStore();
	const [lightningMode, setLightningMode] = useLocalStorage('lightningMode', false);
	const [hasHyperModePonds, setHasHyperModePonds] = useState(false);

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
					
					// if pond types 5 min and hourly are not available set const
					const hyperModePonds = enhancedPonds.some(
						(pond) => pond.period === PondPeriod.FIVE_MIN || pond.period === PondPeriod.HOURLY,
					);
					setHasHyperModePonds(hyperModePonds);
					if (lightningMode && !hyperModePonds) {
						// If lightning mode is on but no hyper mode ponds, reset to default
						setLightningMode(false);
					}
					// Set first pond as selected if none is selected OR if token changed
					// Check if the selectedPond exists in the current enhancedPonds
					const pondExists = enhancedPonds.some(pond => pond.type === selectedPond);
					console.log({pondExists, hyperModePonds, lightningMode, selectedPond, enhancedPonds});
					if (!selectedPond || !pondExists) {
						if (lightningMode && hyperModePonds) {
							// Lightning mode: select 5-minute pond or first available hyper mode pond
							const fiveMinPond = enhancedPonds.find(pond => pond.period === PondPeriod.FIVE_MIN);
							const hourlyPond = enhancedPonds.find(pond => pond.period === PondPeriod.HOURLY);
							setSelectedPond(fiveMinPond?.type || hourlyPond?.type || enhancedPonds[0]?.type);
							console.log('first');
						} else if (!lightningMode && hyperModePonds) {
							// Normal mode with hyper ponds available: select daily pond
							const dailyPond = enhancedPonds.find(pond => pond.period === PondPeriod.DAILY);
							setSelectedPond(dailyPond?.type || enhancedPonds[0]?.type);
							//it reaches here but doesnt select the daily pond. Whilst the daily pond exists
							console.log('second');
						} else {
							// No hyper mode ponds: select first available pond
							setSelectedPond(enhancedPonds[0]?.type);
							console.log('third');
						}
					}

				} else {
					// No valid pond types found
					setHasHyperModePonds(false);
				}
			} catch (processingError) {
				// Error processing pond data
				console.error('Error processing pond types:', processingError);
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
		tokenAddress,
		lightningMode,
		setLightningMode,
	]);

	// Return the processed data along with loading/error states
	return {
		ponds: rawPondTypes
			? (rawPondTypes as PondDisplayInfo[]).filter(
					(pond: PondDisplayInfo) => pond.exists,
				)
			: [],
		hasHyperModePonds,
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
