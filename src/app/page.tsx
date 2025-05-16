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
import { useEventsStore, type ContractEvent } from '@/stores/eventsStore';
import { PondPeriod } from '@/lib/types';
import usePondInfo from '@/hooks/usePondInfo';

export default function Home() {
	const { selectedPond } = usePondStore();
	const { addEvent, clearEvents } = useEventsStore();

	// Use React Query to handle pond information
	const {
		data: pondInfo,
		isLoading: isPondLoading,
		isFetching: isPondFetching,
		refetch: refetchPondInfo,
	} = usePondInfo(selectedPond || '');

	// Local state
	const [displayAmount, setDisplayAmount] = useState('0');
	const initialEventsAddedRef = useRef(false);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Query for generating fake events based on pond type and participants
	const { data: fakeEvents } = useQuery({
		queryKey: [
			'fakeEvents',
			selectedPond,
			pondInfo?.recentParticipants?.length,
		],
		queryFn: async () => {
			if (!pondInfo?.recentParticipants?.length) return [];

			// Generate a few fake events based on recent participants
			return Array.from({ length: 3 }, (_, i) => {
				const randomIndex = Math.floor(
					Math.random() * pondInfo.recentParticipants.length,
				);
				const participant = pondInfo.recentParticipants[randomIndex];

				return {
					id: `${participant.tossAmount}-${participant.participant}-${Date.now()}-${i}`,
					address: participant.participant,
					amount: formatValue(participant.tossAmount),
					timestamp: Math.floor(Date.now() / 1000) - i * 60, // Space them out by a minute
					type: 'CoinTossed' as const,
					pondType: selectedPond || '',
				};
			});
		},
		enabled:
			!!pondInfo?.recentParticipants?.length &&
			pondInfo.recentParticipants.length > 0,
		refetchInterval: getPondRefetchInterval(pondInfo?.period),
		refetchOnWindowFocus: false,
	});

	// Helper function to determine refetch interval based on pond period
	function getPondRefetchInterval(period?: PondPeriod): number {
		if (!period) return 30000; // Default 30s

		switch (period) {
			case PondPeriod.FIVE_MIN:
				return 10000; // 10s for 5-min ponds
			case PondPeriod.HOURLY:
				return 15000; // 15s for hourly ponds
			case PondPeriod.DAILY:
				return 30000; // 30s for daily ponds
			case PondPeriod.WEEKLY:
				return 60000; // 1min for weekly ponds
			case PondPeriod.MONTHLY:
				return 120000; // 2min for monthly ponds
			default:
				return 30000; // Default 30s
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
			// Mark as initialized to prevent flooding
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
				); // Add one every 5 seconds
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

		// Clear any pending timeouts
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}

		// Refetch pond info when pond changes
		if (selectedPond) {
			refetchPondInfo();
		}
	}, [selectedPond, clearEvents, refetchPondInfo]);

	// Get the pond display name based on period
	const getPondDisplayName = () => {
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

	// Determine if we're in a loading state
	const isLoading = isPondLoading || !pondInfo;
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

					{/* Pond Name (Optional) */}
					<div className="-mt-4 -mb-2 font-mono text-primary-200/80">
						{!isLoading && <span>{getPondDisplayName()}</span>}
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

					<StandardPonds />

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

				<PondWinners classNames="hidden lg:flex absolute w-64 -right-12 top-[30%] -translate-y-1/2" />
				<PondWinnerDialog classNames="flex lg:hidden absolute top-0 -right-12 z-50" />

				{pondInfo && <FloatingEvents pondInfo={pondInfo} />}
				{pondInfo && <ShakeNotification pondInfo={pondInfo} />}
			</div>
		</div>
	);
}
