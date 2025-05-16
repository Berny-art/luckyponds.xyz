// src/app/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import CoinTossInput from '@/components/CoinTossInput';
import PondInfo from '@/components/PondInfo';
import StandardPonds from '@/components/StandardPonds';
import { usePondStore } from '@/stores/pondStore';
import { cn, formatValue } from '@/lib/utils';
import PondWinners from '@/components/PondWinners';
import PondWinnerDialog from '@/components/PondWinnerDialog';
import PondTimer from '@/components/PondTimer';
import { Clock, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import FloatingEvents from '@/components/FloatingEvents';
import ShakeNotification from '@/components/ShakeNotification';
import { useEventsStore } from '@/stores/eventsStore';
import { useStandardPondsForUI } from '@/hooks/useStandardPondsForUI';
import usePondInfo from '@/hooks/usePondInfo';
import { PondPeriod, type PondComprehensiveInfo } from '@/lib/types';
import { useResponsiveBreakpoints } from '@/hooks/useBreakpoints';

export default function Home() {
	const {
		selectedPond,
		setSelectedPond,
		pondTypes,
		isLoadingPondTypes,
		lightningMode,
		setLightningMode,
	} = usePondStore();
	const { addEvent } = useEventsStore();

	const { isLg } = useResponsiveBreakpoints();

	// Use simplified hook to fetch pond types - updates store
	useStandardPondsForUI();

	// Fetch pond info - optimized version
	const {
		data: pondInfo,
		isLoading: isPondInfoLoading,
		isFetching: isPondInfoFetching,
	} = usePondInfo(selectedPond);

	// Display amount with efficient updates
	const [displayAmount, setDisplayAmount] = useState('0');

	// Refs for event management
	const initialEventsAddedRef = useRef(false);
	const eventsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Update display amount efficiently
	useEffect(() => {
		if (pondInfo?.totalValue) {
			const formatted = formatValue(pondInfo.totalValue);
			setDisplayAmount(formatted);
		}
	}, [pondInfo?.totalValue]);

	// Add sample events only if needed - with reduced frequency
	useEffect(() => {
		if (
			pondInfo?.recentParticipants?.length &&
			!initialEventsAddedRef.current &&
			!isPondInfoFetching
		) {
			initialEventsAddedRef.current = true;

			// Just add one event for demonstration
			if (pondInfo.recentParticipants.length > 0) {
				const randomIndex = Math.floor(
					Math.random() * pondInfo.recentParticipants.length,
				);
				const participant = pondInfo.recentParticipants[randomIndex];

				const sampleEvent = {
					id: `${participant.tossAmount}-${participant.participant}-${Date.now()}`,
					address: participant.participant,
					amount: formatValue(participant.tossAmount),
					timestamp: Math.floor(Date.now() / 1000),
					type: 'CoinTossed' as const,
					pondType: selectedPond || '',
				};

				// Add with delay to ensure smooth loading
				eventsTimeoutRef.current = setTimeout(() => {
					addEvent(sampleEvent);
					initialEventsAddedRef.current = false;
				}, 2000);
			}
		}
	}, [
		pondInfo?.recentParticipants,
		selectedPond,
		addEvent,
		isPondInfoFetching,
	]);

	// Simplified loading states
	const isLoading = isLoadingPondTypes || (isPondInfoLoading && !pondInfo);

	return (
		<div className="flex w-full flex-col justify-center gap-8 overflow-x-hidden p-4 pb-12 md:flex-row md:pb-0">
			<div className="relative flex w-full items-center justify-center gap-2 pt-12 lg:pt-0">
				<div className="relative flex w-full flex-col items-center justify-center gap-4 md:max-w-[500px]">
					<h1 className="py-4 font-bold font-mono text-4xl text-primary-200 uppercase md:text-5xl">
						WIN{' '}
						{isLoading ? (
							<Skeleton className="inline-block h-10 w-28 bg-secondary-900" />
						) : (
							<span className="relative text-drip-300">
								{displayAmount}
								{isPondInfoFetching && (
									<span className="-top-1 -right-3 absolute h-2 w-2 animate-ping rounded-full bg-drip-300" />
								)}
							</span>
						)}{' '}
						HYPE
					</h1>

					{/* Countdown Timer */}
					<div className="-mt-2 mb-2 w-full justify-center">
						{isLoading ? (
							<div className="flex items-center gap-1.5 text-primary-200">
								<Clock className="h-4 w-4" />
								<Skeleton className="h-4 w-32 bg-secondary-900" />
							</div>
						) : (
							pondInfo && (
								<PondTimer
									pondInfo={pondInfo}
									key={`timer-${selectedPond}-${pondInfo.endTime}`} // Force refresh when pond changes
								/>
							)
						)}
					</div>

					{/* Standard Ponds */}
					<StandardPonds
						pondTypes={pondTypes}
						isLoading={isLoadingPondTypes}
						selectedPond={selectedPond}
						onPondSelect={setSelectedPond}
					/>

					{/* Pond Info */}
					<PondInfo
						pondInfo={pondInfo as PondComprehensiveInfo}
						isLoading={isLoading}
					/>

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

				{/* Supplementary components - only show when data is ready */}
				<PondWinners classNames="hidden lg:flex absolute w-64 -right-12 top-[50%] -translate-y-1/2" />
				<PondWinnerDialog classNames="flex lg:hidden absolute top-0 -right-12 z-50" />

				{pondInfo && !isLoading && <FloatingEvents pondInfo={pondInfo} />}
				<div className="-left-16 absolute top-0 z-40 flex gap-4 lg:flex-col">
					{pondInfo && !isLoading && (
						<>
							<ShakeNotification pondInfo={pondInfo} />
							<div
								className={cn(
									'flex cursor-pointer items-center justify-end gap-2 rounded-md border-2 border-drip-300',
									lightningMode
										? 'bg-drip-300 text-secondary-950'
										: 'bg-primary-200/10 text-primary-200',
									'p-3 text-xs lg:pl-12',
								)}
								onClick={() => {
									const newLightningMode = !lightningMode;
									setLightningMode(newLightningMode);

									// Find the 5 min and daily pond types by their period property
									const fiveMinPond = pondTypes.find(
										(pond) => pond.period === PondPeriod.FIVE_MIN,
									);
									const dailyPond = pondTypes.find(
										(pond) => pond.period === PondPeriod.DAILY,
									);

									// Set appropriate pond type based on new lightning mode
									if (newLightningMode && fiveMinPond) {
										setSelectedPond(fiveMinPond.type);
									} else if (!newLightningMode && dailyPond) {
										setSelectedPond(dailyPond.type);
									}
								}}
								onKeyDown={(e) =>
									e.key === 'f' && setLightningMode(!lightningMode)
								}
								aria-label="Toggle fast mode"
							>
								{isLg ? `Turn Fast Mode ${lightningMode ? 'OFF' : 'ON'}` : ''}
								<Zap size={18} />
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
