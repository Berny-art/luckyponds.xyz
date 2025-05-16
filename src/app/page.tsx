// src/app/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import CoinTossInput from '@/components/CoinTossInput';
import PondInfo from '@/components/PondInfo';
import StandardPonds from '@/components/StandardPonds';
import { usePondStore } from '@/stores/pondStore';
import { formatValue } from '@/lib/utils';
import PondWinners from '@/components/PondWinners';
import PondWinnerDialog from '@/components/PondWinnerDialog';
import PondTimer from '@/components/PondTimer';
import { Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import FloatingEvents from '@/components/FloatingEvents';
import ShakeNotification from '@/components/ShakeNotification';
import { useEventsStore } from '@/stores/eventsStore';
import { PondPeriod } from '@/lib/types';
import usePondInfo from '@/hooks/usePondInfo';
import { useAccount, useReadContract } from 'wagmi';
import { pondCoreConfig } from '@/contracts/PondCore';

export default function Home() {
	const { address } = useAccount();
	const {
		selectedPond,
		setSelectedPond,
		pondTypes,
		setPondTypes,
		isLoadingPondTypes,
		setIsLoadingPondTypes,
	} = usePondStore();

	const { addEvent, clearEvents } = useEventsStore();

	// Fetch standard pond types with error handling
	const {
		data: rawPondTypes,
		isLoading: isRawPondTypesLoading,
		isError: isPondTypesError,
		error: pondTypesError,
	} = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'getStandardPondsForUI',
		args: ['0x0000000000000000000000000000000000000000' as `0x${string}`],
	});

	// Log important debugging information
	useEffect(() => {
		if (pondCoreConfig.address) {
			console.log('Contract address:', pondCoreConfig.address);
		} else {
			console.warn('Contract address is undefined in config');
		}

		if (isPondTypesError && pondTypesError) {
			console.error('Error fetching pond types:', pondTypesError);
		}
	}, [isPondTypesError, pondTypesError]);

	// Process and store pond types in Zustand when data is available
	useEffect(() => {
		// Set loading state right away
		setIsLoadingPondTypes(isRawPondTypesLoading);

		if (
			rawPondTypes &&
			Array.isArray(rawPondTypes) &&
			rawPondTypes.length > 0
		) {
			try {
				// Transform the raw pond types into a more usable format
				const processedPondTypes = rawPondTypes
					.map((pond: any) => ({
						type: pond.pondType,
						name: pond.pondName,
						displayName: getPondDisplayName(pond.period, pond.pondName),
						period: pond.period,
						exists: pond.exists,
					}))
					.filter((pond: any) => pond.exists);

				if (processedPondTypes.length > 0) {
					// Store pond types in Zustand
					setPondTypes(processedPondTypes);
					console.log(
						'Processed pond types saved to store:',
						processedPondTypes,
					);
				} else {
					console.warn('No valid pond types found after filtering');
				}
			} catch (error) {
				console.error('Error processing pond types:', error);
			} finally {
				setIsLoadingPondTypes(false);
			}
		}
	}, [
		rawPondTypes,
		isRawPondTypesLoading,
		setPondTypes,
		setIsLoadingPondTypes,
	]);

	// Function to get display name from period
	function getPondDisplayName(period: number, name: string): string {
		switch (period) {
			case 0:
				return '5 Min';
			case 1:
				return 'Hourly';
			case 2:
				return 'Daily';
			case 3:
				return 'Weekly';
			case 4:
				return 'Monthly';
			default:
				return name.split(' ')[0];
		}
	}

	// Set first valid pond as selected when pond types are loaded
	useEffect(() => {
		if (!selectedPond && pondTypes && pondTypes.length > 0) {
			console.log('Setting initial selected pond to:', pondTypes[0].type);
			setSelectedPond(pondTypes[0].type);
		}
	}, [pondTypes, selectedPond, setSelectedPond]);

	// Determine if we should fetch pond info
	const showPondInfo =
		!!selectedPond &&
		pondTypes.length > 0 &&
		pondTypes.some((p) => p.type === selectedPond);

	// Fetch pond info only when we have a valid selection
	const {
		data: pondInfo,
		isLoading: isPondLoading,
		isFetching: isPondFetching,
		refetch: refetchPondInfo,
	} = usePondInfo(showPondInfo ? selectedPond : '');

	// Local state
	const [displayAmount, setDisplayAmount] = useState('0');
	const initialEventsAddedRef = useRef(false);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Query for generating fake events
	const { data: fakeEvents } = useQuery({
		queryKey: [
			'fakeEvents',
			selectedPond,
			pondInfo?.recentParticipants?.length,
		],
		queryFn: async () => {
			if (!pondInfo?.recentParticipants?.length) return [];

			// Generate fake events for demo purposes
			return Array.from({ length: 3 }, (_, i) => {
				const randomIndex = Math.floor(
					Math.random() * pondInfo.recentParticipants.length,
				);
				const participant = pondInfo.recentParticipants[randomIndex];

				return {
					id: `${participant.tossAmount}-${participant.participant}-${Date.now()}-${i}`,
					address: participant.participant,
					amount: formatValue(participant.tossAmount),
					timestamp: Math.floor(Date.now() / 1000) - i * 60,
					type: 'CoinTossed' as const,
					pondType: selectedPond || '',
				};
			});
		},
		enabled: !!(
			pondInfo?.recentParticipants?.length &&
			pondInfo.recentParticipants.length > 0
		),
		refetchInterval: getPondRefetchInterval(pondInfo?.period),
		refetchOnWindowFocus: false,
	});

	// Helper function to determine refetch interval
	function getPondRefetchInterval(period?: PondPeriod): number {
		if (!period) return 30000; // Default 30s

		switch (period) {
			case PondPeriod.FIVE_MIN:
				return 10000;
			case PondPeriod.HOURLY:
				return 15000;
			case PondPeriod.DAILY:
				return 30000;
			case PondPeriod.WEEKLY:
				return 60000;
			case PondPeriod.MONTHLY:
				return 120000;
			default:
				return 30000;
		}
	}

	// Update display amount when pond info changes
	useEffect(() => {
		if (pondInfo) {
			setDisplayAmount(formatValue(pondInfo.totalValue));
		} else {
			setDisplayAmount('0');
		}
	}, [pondInfo]);

	// Add fake events to the store when they change
	useEffect(() => {
		if (fakeEvents && fakeEvents.length > 0 && !initialEventsAddedRef.current) {
			initialEventsAddedRef.current = true;

			// Add first event immediately
			addEvent(fakeEvents[0]);

			// Schedule the rest with delays
			fakeEvents.slice(1).forEach((event, index) => {
				setTimeout(
					() => {
						addEvent(event);
					},
					(index + 1) * 5000,
				);
			});

			// Reset after all events are added
			const resetTimeout = setTimeout(
				() => {
					initialEventsAddedRef.current = false;
				},
				(fakeEvents.length + 1) * 5000,
			);

			return () => clearTimeout(resetTimeout);
		}
	}, [fakeEvents, addEvent]);

	// Clear events when pond changes
	useEffect(() => {
		clearEvents();
		initialEventsAddedRef.current = false;

		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}

		if (selectedPond && showPondInfo) {
			refetchPondInfo();
		}
	}, [selectedPond, clearEvents, refetchPondInfo, showPondInfo]);

	// Get the pond display name
	const getCurrentPondDisplayName = () => {
		if (!pondInfo?.period) return 'Lucky Pond';

		switch (pondInfo.period) {
			case PondPeriod.FIVE_MIN:
				return '5 Minute Pond';
			case PondPeriod.HOURLY:
				return 'Hourly Pond';
			case PondPeriod.DAILY:
				return 'Daily Pond';
			case PondPeriod.WEEKLY:
				return 'Weekly Pond';
			case PondPeriod.MONTHLY:
				return 'Monthly Pond';
			default:
				return pondInfo.name || 'Lucky Pond';
		}
	};

	// Determine loading states
	const isLoading = isLoadingPondTypes || (showPondInfo && isPondLoading);
	const isRefetching = isPondFetching && !isPondLoading;

	return (
		<div className="flex w-full flex-col justify-center gap-8 overflow-x-hidden p-4 pb-12 md:flex-row md:pb-0">
			<div className="relative flex w-full items-center justify-center gap-2 pt-12 lg:pt-0">
				<div className="relative flex flex-col items-center justify-center gap-4">
					<h1 className="py-4 font-bold font-mono text-4xl text-primary-200 uppercase md:text-5xl">
						WIN{' '}
						{isLoading ? (
							<Skeleton className="inline-block h-10 w-28 bg-secondary-900" />
						) : (
							<span className="relative text-drip-300">
								{displayAmount}
								{isRefetching && (
									<span className="-top-1 -right-3 absolute h-2 w-2 animate-ping rounded-full bg-drip-300" />
								)}
							</span>
						)}{' '}
						HYPE
					</h1>

					{/* Pond Name */}
					<div className="-mt-4 -mb-2 font-mono text-primary-200/80">
						{!isLoading && pondInfo && (
							<span>{getCurrentPondDisplayName()}</span>
						)}
					</div>

					{/* Countdown Timer */}
					<div className="-mt-2 mb-2">
						{isLoading ? (
							<div className="flex items-center gap-1.5 text-primary-200">
								<Clock className="h-4 w-4" />
								<Skeleton className="h-4 w-32 bg-secondary-900" />
							</div>
						) : (
							pondInfo && <PondTimer pondInfo={pondInfo} />
						)}
					</div>

					{/* StandardPonds - Pass loading state and data */}
					<StandardPonds
						pondTypes={pondTypes}
						isLoading={isLoadingPondTypes}
						selectedPond={selectedPond}
						onPondSelect={setSelectedPond}
					/>

					{/* Pond Info */}
					{isLoading ? (
						<div className="w-full space-y-2 rounded border border-primary-200/20 bg-primary-200/5 p-4">
							<Skeleton className="h-6 w-3/4 bg-secondary-900" />
							<Skeleton className="h-4 w-full bg-secondary-900" />
							<Skeleton className="h-4 w-2/3 bg-secondary-900" />
							<div className="flex justify-between pt-2">
								<Skeleton className="h-5 w-24 bg-secondary-900" />
								<Skeleton className="h-5 w-24 bg-secondary-900" />
							</div>
						</div>
					) : (
						selectedPond && pondInfo && <PondInfo pondInfo={pondInfo} />
					)}

					{/* Coin Toss Input */}
					{isLoading ? (
						<div className="w-full space-y-4">
							<div className="grid w-full grid-cols-[1fr,auto] gap-2">
								<Skeleton className="h-20 w-full bg-secondary-900" />
								<Skeleton className="h-20 w-20 bg-secondary-900" />
							</div>
							<Skeleton className="h-16 w-full bg-secondary-900" />
						</div>
					) : (
						pondInfo && <CoinTossInput pondInfo={pondInfo} />
					)}
				</div>

				{/* Supplementary components */}
				<PondWinners classNames="hidden lg:flex absolute w-64 -right-12 top-[30%] -translate-y-1/2" />
				<PondWinnerDialog classNames="flex lg:hidden absolute top-0 -right-12 z-50" />

				{pondInfo && <FloatingEvents pondInfo={pondInfo} />}
				{pondInfo && <ShakeNotification pondInfo={pondInfo} />}
			</div>
		</div>
	);
}
