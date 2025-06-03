// src/components/PondInterface.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import CoinTossInput from '@/components/CoinTossInput';
import PondInfo from '@/components/PondInfo';
import StandardPonds from '@/components/StandardPonds';
import { usePondData } from '@/hooks/usePondData';
import { useAppStore } from '@/stores/appStore';
import { cn, formatValue } from '@/lib/utils';
import PondWinners from '@/components/PondWinners';
import PondWinnerDialog from '@/components/PondWinnerDialog';
import PondTimer from '@/components/PondTimer';
import { Clock, ExternalLink, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import FloatingEvents from '@/components/FloatingEvents';
import ShakeNotification from '@/components/ShakeNotification';
import { useStandardPondsForUI } from '@/hooks/useStandardPondsForUI';
import { PondPeriod } from '@/lib/types';
import { useResponsiveBreakpoints } from '@/hooks/useBreakpoints';
import TokenSelector from '@/components/TokenSelector';
import useLocalStorage from 'use-local-storage';
import ReferDialog from './ReferDialog';
import { useReferralCode } from '@/hooks/useReferralCode';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import Link from 'next/link';

interface PondInterfaceProps {
	tokenAddress?: string;
	initialReferrerCode?: string | null;
}

export default function PondInterface({ tokenAddress, initialReferrerCode }: PondInterfaceProps) {
	const {
		selectedToken,
		availableTokens,
		setSelectedToken,
		getTokenByAddress,
		selectedPond,
		setSelectedPond,
		pondTypes,
		isLoadingPondTypes,
		addEvent,
	} = useAppStore();

	const { isSm, isLg } = useResponsiveBreakpoints();
	const { address, isConnected } = useAccount();
	const [lightningMode, setLightningMode] = useLocalStorage(
		'lightningMode',
		false,
	);

	const {
		referrerCode,
		isLoading: referralLoading,
		error: referralError,
		hasAppliedReferral,
		fetchReferralCode,
		applyReferralCode,
	} = useReferralCode({ initialReferrerCode });

	// State for timer information
	const [timeRemaining, setTimeRemaining] = useState<number>(0);
	const [isAboutToEnd, setIsAboutToEnd] = useState<boolean>(false);

	// State to track if we've processed the referral
	const [hasProcessedReferral, setHasProcessedReferral] = useState(false);

	// Handle referral code processing when user connects wallet
	useEffect(() => {
		if (
			isConnected &&
			address &&
			referrerCode &&
			!hasProcessedReferral &&
			!hasAppliedReferral &&
			!referralLoading
		) {
			const processReferral = async () => {
				try {
					// First fetch the user's own referral code to prevent self-referral
					await fetchReferralCode();

					// Then apply the referrer's code
					const success = await applyReferralCode(referrerCode);
					if (success) {
						toast.success('Referral code applied successfully! 🎉');
					}
				} catch (error) {
					console.error('Error processing referral:', error);
					if (referralError) {
						toast.error(`Referral error: ${referralError}`);
					}
				} finally {
					setHasProcessedReferral(true);
				}
			};

			processReferral();
		}
	}, [
		isConnected,
		address,
		referrerCode,
		hasProcessedReferral,
		hasAppliedReferral,
		referralLoading,
		fetchReferralCode,
		applyReferralCode,
		referralError,
	]);

	// Reset referral processing state when user disconnects
	useEffect(() => {
		if (!isConnected) {
			setHasProcessedReferral(false);
		}
	}, [isConnected]);

	// Set token based on tokenAddress prop (for dynamic routes)
	useEffect(() => {
		if (tokenAddress) {
			// Dynamic route: set token based on URL parameter
			const token = getTokenByAddress(tokenAddress);
			if (token && token.address !== selectedToken.address) {
				setSelectedToken(token);
			}
		} else {
			// Home page: ensure we're using the default native token (HYPE)
			const nativeToken = availableTokens.find(token => token.isNative);
			if (nativeToken && nativeToken.address !== selectedToken.address) {
				setSelectedToken(nativeToken);
			}
		}
	}, [
		tokenAddress,
		selectedToken.address,
		setSelectedToken,
		getTokenByAddress,
		availableTokens,
	]);

	// Use the current token address for pond fetching
	const currentTokenAddress = tokenAddress || selectedToken.address;

	// New centralized pond data
	const {
		pondInfo,
		isLoading: isPondDataLoading,
		isFetching: isPondDataFetching,
		refetchAll,
	} = usePondData({
		pondId: selectedPond,
		tokenAddress: currentTokenAddress,
	});

	// Use simplified hook to fetch pond types - updates store
	useStandardPondsForUI(currentTokenAddress);

	// Refs for event management
	const initialEventsAddedRef = useRef(false);
	const eventsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Handler for timer updates
	const handleTimerUpdate = (remaining: number, aboutToEnd: boolean) => {
		setTimeRemaining(remaining);
		setIsAboutToEnd(aboutToEnd);
	};

	// Handler for pond selection changes
	const handlePondSelect = (newPondId: string) => {
		setSelectedPond(newPondId);
		// Force a data refresh when pond changes to avoid stale data
		setTimeout(() => {
			refetchAll();
		}, 100);
	};

	// Enhanced transaction success handler with additional status refresh
	const handleTransactionSuccess = () => {
		refetchAll();
	};

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

	// Enhanced token change handler to ensure proper data refresh
	useEffect(() => {
		// When the current token address changes, force a complete data refresh
		if (currentTokenAddress) {
			// Clear timer states
			setTimeRemaining(0);
			setIsAboutToEnd(false);

			// Clear event management refs
			initialEventsAddedRef.current = false;
			if (eventsTimeoutRef.current) {
				clearTimeout(eventsTimeoutRef.current);
				eventsTimeoutRef.current = null;
			}

			// Force data refresh after a short delay to ensure hooks are updated
			setTimeout(() => {
				refetchAll();
			}, 200);
		}
	}, [currentTokenAddress, refetchAll]);

	// Combined loading state
	const isLoading = isLoadingPondTypes || isPondDataLoading;

	return (
		<div className="flex w-full flex-col justify-center gap-8 overflow-x-hidden p-4 pb-12 md:flex-row md:pb-0">
			<div className="relative flex w-full items-center justify-center gap-2 pt-12 lg:pt-0">
				<div className="relative flex w-full flex-col items-center justify-center gap-4 md:max-w-[500px]">
					{/* Header with Token Selector */}
					<div className="mt-4 flex w-full items-center justify-center gap-4 py-4 md:mt-0">
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
									onTimerUpdate={handleTimerUpdate}
									key={`timer-${selectedPond}-${pondInfo.endTime}-${pondInfo.period}`}
								/>
							)
						)}
					</div>

					{/* Standard Ponds */}
					<StandardPonds
						pondTypes={pondTypes}
						isLoading={isLoadingPondTypes}
						selectedPond={selectedPond}
						onPondSelect={handlePondSelect}
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
								onTransactionSuccess={handleTransactionSuccess} // Use enhanced handler
								timeRemaining={timeRemaining}
								isAboutToEnd={isAboutToEnd}
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
							<ShakeNotification />
							<div
								className={cn(
									'flex cursor-pointer items-center justify-end gap-2 rounded-md border-2 border-drip-300',
									lightningMode
										? 'bg-drip-300 text-secondary-950'
										: 'bg-primary-200/10 hover:bg-primary-200/20 text-drip-300',
									'p-3 text-xs lg:pl-12 uppercase',
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
								{isLg ? `Hyper Mode ${lightningMode ? 'ON' : 'OFF'}` : ''}
								<Zap size={18} />
							</div>
							{isSm && (
								<ReferDialog initialReferrerCode={referrerCode} />
							)}
							<Link
								href='https://drip.trade/collections/hyper-frogs'
								target="_blank">
								<div
									className={cn(
										'hidden sm:flex cursor-pointer items-center justify-end gap-2 rounded-md border-2 border-primary-200',
										'bg-primary-200/10 text-primary-200 hover:bg-primary-200/20',
										'p-3 text-xs lg:pl-12 uppercase',
									)}
								>
									Get a Hyper Frog
									<ExternalLink size={18} />
								</div>
							</Link>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
