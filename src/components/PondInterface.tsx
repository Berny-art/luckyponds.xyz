// src/components/PondInterface.tsx
'use client';

import { useEffect, useRef } from 'react';
import CoinTossInput from '@/components/CoinTossInput';
import PondInfo from '@/components/PondInfo';
import StandardPonds from '@/components/StandardPonds';
import { usePondStore } from '@/stores/pondStore';
import { usePondData } from '@/stores/pondDataStore'; // New store
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
import { PondPeriod } from '@/lib/types';
import { useResponsiveBreakpoints } from '@/hooks/useBreakpoints';
import TokenSelector from '@/components/TokenSelector';
import { useTokenStore } from '@/stores/tokenStore';
import useLocalStorage from 'use-local-storage';

interface PondInterfaceProps {
	tokenAddress?: string;
}

export default function PondInterface({ tokenAddress }: PondInterfaceProps) {
	const { selectedToken, setSelectedToken, getTokenByAddress } =
		useTokenStore();
	const { selectedPond, setSelectedPond, pondTypes, isLoadingPondTypes } =
		usePondStore();

	// New centralized pond data
	const {
		pondInfo,
		isLoading: isPondDataLoading,
		isFetching: isPondDataFetching,
		setSelectedPondId,
		setCurrentTokenAddress,
		refetchAll,
	} = usePondData();

	const { addEvent } = useEventsStore();
	const { isLg } = useResponsiveBreakpoints();
	const [lightningMode, setLightningMode] = useLocalStorage(
		'lightningMode',
		false,
	);

	// Set token based on tokenAddress prop (for dynamic routes)
	useEffect(() => {
		if (tokenAddress) {
			const token = getTokenByAddress(tokenAddress);
			if (token && token.address !== selectedToken.address) {
				setSelectedToken(token);
			}
		}
	}, [
		tokenAddress,
		selectedToken.address,
		setSelectedToken,
		getTokenByAddress,
	]);

	// Use the current token address for pond fetching
	const currentTokenAddress = tokenAddress || selectedToken.address;

	// Update the pond data store with current selections
	useEffect(() => {
		setCurrentTokenAddress(currentTokenAddress);
	}, [currentTokenAddress, setCurrentTokenAddress]);

	useEffect(() => {
		if (selectedPond) {
			setSelectedPondId(selectedPond);
		}
	}, [selectedPond, setSelectedPondId]);

	// Use simplified hook to fetch pond types - updates store
	useStandardPondsForUI(currentTokenAddress);

	// Refs for event management
	const initialEventsAddedRef = useRef(false);
	const eventsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Add sample events only if needed
	useEffect(() => {
		if (
			pondInfo?.recentParticipants?.length &&
			!initialEventsAddedRef.current &&
			!isPondDataFetching
		) {
			initialEventsAddedRef.current = true;

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
		isPondDataFetching,
	]);

	// Combined loading state
	const isLoading = isLoadingPondTypes || isPondDataLoading;

	return (
		<div className="flex w-full flex-col justify-center gap-8 overflow-x-hidden p-4 pb-12 md:flex-row md:pb-0">
			<div className="relative flex w-full items-center justify-center gap-2 pt-12 lg:pt-0">
				<div className="relative flex w-full flex-col items-center justify-center gap-4 md:max-w-[500px]">
					{/* Header with Token Selector */}
					<div className="flex w-full items-center justify-center gap-4 py-4 mt-4">
						<h1 className="font-bold font-mono text-3xl text-primary-200 uppercase md:text-5xl">
							WIN
						</h1>
						<TokenSelector
							totalValue={pondInfo?.totalValue}
							isLoading={isLoading}
							className="justify-center"
						/>
					</div>

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
									key={`timer-${selectedPond}-${pondInfo.endTime}`}
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
					{pondInfo ? (
						<PondInfo pondInfo={pondInfo} isLoading={isLoading} />
					) : (
						<div className="w-full space-y-4">
							<Skeleton className="h-20 w-full bg-secondary-900" />
						</div>
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
						pondInfo && (
							<CoinTossInput
								pondInfo={pondInfo}
								onTransactionSuccess={refetchAll} // Use refetchAll for complete data refresh
							/>
						)
					)}
				</div>

				{/* Supplementary components */}
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

									// Find appropriate pond for new mode
									const targetPond = newLightningMode
										? pondTypes.find(
												(pond) => pond.period === PondPeriod.FIVE_MIN,
											)
										: pondTypes.find(
												(pond) => pond.period === PondPeriod.DAILY,
											);

									if (targetPond) {
										setSelectedPond(targetPond.type);
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
