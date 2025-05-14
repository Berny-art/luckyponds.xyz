'use client';

import { useState, useEffect, useRef } from 'react';
import CoinTossInput from '@/components/CoinTossInput';
import PondInfo from '@/components/PondInfo';
import StandardPonds from '@/components/StandardPonds';
import { usePondStore } from '@/stores/pondStore';
import usePondInfo from '@/functions/usePondInfo';
import { formatValue } from '@/lib/utils';
import PondWinners from '@/components/PondWinners';
import PondWinnerDialog from '@/components/PondWinnerDialog';
import PondTimer from '@/components/PondTimer';
import { Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import EventWatcher from '@/components/EventWatcher';
import FloatingEvents from '@/components/FloatingEvents';
import ShakeNotification from '@/components/ShakeNotification';
import { useEventsStore, type ContractEvent } from '@/stores/eventsStore';
import type { ParticipantInfo } from '@/lib/types';

export default function Home() {
	const { selectedPond } = usePondStore();
	const { addEvent, events } = useEventsStore();
	const pondInfo = usePondInfo(selectedPond || '');
	const isLoading = !pondInfo;

	const [displayAmount, setDisplayAmount] = useState('0');
	const [pondType, setPondType] = useState('daily'); // eslint-disable-line @typescript-eslint/no-unused-vars
	const initialEventsAddedRef = useRef(false);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Update display amount when pond info changes
	useEffect(() => {
		if (pondInfo) {
			setDisplayAmount(formatValue(pondInfo.totalValue));
		} else {
			setDisplayAmount('0');
		}
	}, [pondInfo]);

	// Determine the pond type from the name
	useEffect(() => {
		if (pondInfo?.name) {
			const name = pondInfo.name.toLowerCase();
			if (name.includes('daily')) {
				setPondType('daily');
			} else if (name.includes('weekly')) {
				setPondType('weekly');
			} else if (name.includes('monthly')) {
				setPondType('monthly');
			}
		}
	}, [pondInfo?.name]);

	// Show participant events
	useEffect(() => {
		// Only run this once per pond and when we have participants to show
		if (
			initialEventsAddedRef.current ||
			!pondInfo?.recentParticipants?.length
		) {
			return;
		}

		// Mark as initialized to prevent re-adding events
		initialEventsAddedRef.current = true;

		// Function to create an event from a participant
		const createEventFromParticipant = (
			participant: ParticipantInfo,
			index: number,
		) => {
			return {
				id: `${participant.tossAmount}-${participant.participant}-${Date.now()}-${index}`,
				address: participant.participant,
				amount: formatValue(participant.tossAmount),
				timestamp: Math.floor(Date.now() / 1000) - index * 60, // Space them out by a minute
				type: 'CoinTossed',
				pondType: selectedPond || '',
			} as ContractEvent;
		};

		// Add one event immediately
		if (pondInfo.recentParticipants.length > 0) {
			const randomIndex = Math.floor(
				Math.random() * pondInfo.recentParticipants.length,
			);
			const participant = pondInfo.recentParticipants[randomIndex];
			const immediateEvent = createEventFromParticipant(participant, 0);
			addEvent(immediateEvent);
		}

		// Set up a periodic check for adding more participants if needed
		const checkAndAddParticipant = () => {
			// Only add if there are no events in the store
			if (events.length === 0 && pondInfo.recentParticipants?.length > 0) {
				const randomIndex = Math.floor(
					Math.random() * pondInfo.recentParticipants.length,
				);
				const participant = pondInfo.recentParticipants[randomIndex];
				const event = createEventFromParticipant(participant, 0);
				addEvent(event);
			}

			// Schedule next check
			timeoutRef.current = setTimeout(
				checkAndAddParticipant,
				Math.random() * 5000 + 10000,
			); // 10-15 seconds
		};

		// Start checking after 15 seconds
		timeoutRef.current = setTimeout(checkAndAddParticipant, 15000);

		// Clean up on unmount
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [pondInfo, addEvent, events.length, selectedPond]);

	// Reset the initialEventsAdded flag when pond changes
	useEffect(() => {
		initialEventsAddedRef.current = false;

		// Clear any pending timeouts
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	}, []);

	return (
		<div className="flex w-full flex-col justify-center gap-8 overflow-x-hidden p-4 pb-12 md:flex-row md:pb-0">
			<div className="relative flex w-full items-center justify-center gap-2 pt-12 lg:pt-0">
				<div className="relative flex flex-col items-center justify-center gap-4">
					<h1 className="py-4 font-bold font-mono text-4xl text-primary-200 uppercase md:text-5xl">
						WIN{' '}
						{isLoading ? (
							<Skeleton className="inline-block h-10 w-28 bg-secondary-900" />
						) : (
							<span className="text-drip-300">{displayAmount}</span>
						)}{' '}
						HYPE
					</h1>

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
