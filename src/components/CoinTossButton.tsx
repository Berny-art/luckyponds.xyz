// src/components/CoinTossButton.tsx
'use client';
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { useTossCoin } from '@/hooks/useTossCoin';
import { useAppStore } from '@/stores/appStore';
import { Loader2, Wallet } from 'lucide-react';
import type { PondComprehensiveInfo } from '@/lib/types';
import { useAccount, useWriteContract } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { pondCoreConfig } from '@/contracts/PondCore';
import { toast } from 'sonner';
import { PondStatus } from '@/functions/getPondStatus';
import { usePondStatus } from '@/hooks/usePondStatus';
import { PondPeriod } from '@/lib/types';

interface CoinTossButtonProps {
	amount: string;
	numberOfTosses: number;
	pondInfo: PondComprehensiveInfo;
	disabled?: boolean;
	onTransactionSuccess?: () => void; // New callback prop
	timeRemaining?: number; // Time remaining in milliseconds
	isAboutToEnd?: boolean; // Whether timer is about to end (5 seconds)
}

export default function CoinTossButton({
	amount,
	numberOfTosses,
	pondInfo,
	disabled = false,
	onTransactionSuccess, // Add the new prop
	timeRemaining,
	isAboutToEnd,
}: CoinTossButtonProps) {
	const { address } = useAccount();
	const isConnected = !!address;
	const { openConnectModal } = useConnectModal();
	const { selectedPond, showAnimation } = useAppStore();
	const { tossCoin, isLoading: tossLoading, lastTxResult } = useTossCoin();
	const [isProcessing, setIsProcessing] = useState(false);
	const { writeContractAsync, isPending: isWritePending } = useWriteContract();

	// Ref to track which transaction hash we've already processed
	const processedTxHashRef = useRef<string | null>(null);

	// Get pond status with accurate timelock information
	const { status: pondStatus } = usePondStatus(pondInfo);

	// Use effect to monitor transaction confirmation and trigger callback
	useEffect(() => {
		if (
			lastTxResult?.success &&
			lastTxResult.hash &&
			onTransactionSuccess &&
			processedTxHashRef.current !== lastTxResult.hash
		) {
			// Mark this transaction as processed
			processedTxHashRef.current = lastTxResult.hash;

			// Transaction was confirmed successfully, trigger callback
			onTransactionSuccess();
		}
	}, [lastTxResult, onTransactionSuccess]);

	// Effect to handle SelectWinner status and trigger data refresh
	useEffect(() => {
		if (pondStatus === PondStatus.SelectWinner && onTransactionSuccess) {
			// Trigger data refresh when SelectWinner status is detected
			const timer = setTimeout(() => {
				onTransactionSuccess();
			}, 1000);

			return () => clearTimeout(timer);
		}
	}, [pondStatus, onTransactionSuccess]);

	// Check if pond is about to end (5 seconds before end time)
	const isPondAboutToEnd = () => {
		// Use the provided isAboutToEnd prop if available (for 5-minute ponds)
		if (isAboutToEnd !== undefined) {
			return isAboutToEnd;
		}

		// Fallback logic for other ponds
		if (!pondInfo?.endTime) return false;

		const now = Math.floor(Date.now() / 1000);
		const endTime = Number(pondInfo.endTime);
		const timeUntilEnd = endTime - now;

		// Disable 5 seconds before end
		return timeUntilEnd <= 5 && timeUntilEnd > 0;
	};

	// Additional check for 5-minute pond timelock status
	const is5MinutePondInTimelock = () => {
		if (pondInfo?.period !== PondPeriod.FIVE_MIN) return false;

		const nowMs = Date.now();
		const now = new Date(nowMs);
		const currentUTCMinutes = now.getUTCMinutes();

		// Calculate the NEXT 5-minute boundary
		const currentFiveMinuteMark = Math.floor(currentUTCMinutes / 5) * 5;
		let nextFiveMinuteMark = currentFiveMinuteMark + 5;

		const nextBoundary = new Date(now);

		// Handle hour rollover
		if (nextFiveMinuteMark >= 60) {
			nextBoundary.setUTCHours(nextBoundary.getUTCHours() + 1);
			nextFiveMinuteMark = 0;
		}

		nextBoundary.setUTCMinutes(nextFiveMinuteMark, 0, 0);

		// Calculate time until the next boundary
		const timeUntilBoundaryMs = nextBoundary.getTime() - nowMs;
		const timeUntilBoundarySeconds = Math.floor(timeUntilBoundaryMs / 1000);

		// If we've passed the boundary (timer hit zero), check if we're in timelock
		if (timeUntilBoundarySeconds < 0) {
			const timePastBoundarySeconds = -timeUntilBoundarySeconds;
			// 20 second timelock for 5-minute ponds
			return timePastBoundarySeconds < 20;
		}

		return false;
	};

	// Check if the component is in a loading state
	const isLoading = tossLoading || isProcessing || isWritePending;

	// Function to select a winner for the pond (hidden from user)
	const selectWinner = async () => {
		if (!selectedPond) return;

		const hash = await writeContractAsync({
			...pondCoreConfig,
			address: pondCoreConfig.address as `0x${string}`,
			functionName: 'selectLuckyWinner',
			args: [selectedPond as `0x${string}`],
			type: 'legacy',
		});

		return hash;
	};

	// Handle the connect wallet action with RainbowKit
	const handleConnect = (e: React.MouseEvent) => {
		const x = e.clientX;
		const y = e.clientY;
		if (x && y) {
			showAnimation({ x, y });
		}

		if (openConnectModal) {
			openConnectModal();
		} else {
			toast.error('Connection unavailable', {
				description: 'Wallet connection is not available right now',
			});
		}
	};

	// Handle the toss (with seamless winner selection if needed)
	const handleToss = async (e: React.MouseEvent) => {
		if (!selectedPond || !pondInfo) {
			return;
		}

		const x = e.clientX;
		const y = e.clientY;
		if (x && y) {
			showAnimation({ x, y });
		}

		setIsProcessing(true);

		try {
			// If pond is ready for winner selection, do it silently
			if (pondInfo.timeUntilEnd <= 0 && pondInfo.prizeDistributed === false) {
				toast.loading('Processing transaction...', { id: 'toss-loading' });
				try {
					// Silently trigger winner selection
					await selectWinner();
					// Small delay to ensure transactions are processed in order
					await new Promise((resolve) => setTimeout(resolve, 500));
				} catch (error: unknown) {
					toast.error('Transaction failed', {
						id: 'toss-loading',
					});
					setIsProcessing(false);
					return;
				}
			}

			// Proceed with the toss (standard or after selection)
			await tossCoin(selectedPond, amount, pondInfo.tokenType);

			// The callback will be triggered by the useEffect when lastTxResult is updated
		} catch (error) {
			// Error is handled by the tossCoin function
			console.error('Error tossing coin:', error);
		} finally {
			setIsProcessing(false);
		}
	};

	// Get pond name for display
	const pondName = pondInfo?.name.replace('ETH', '') || 'pond';
	const displayPondName = pondName.includes('Pond')
		? pondName.replace('Pond', '').trim()
		: pondName;

	// Apply correct timelock duration based on pond period (shorter for 5-min ponds)
	const isTimeLocked = pondStatus === PondStatus.TimeLocked;

	// Get the button text based on connection, loading, and pond status
	const getButtonText = () => {
		// Not connected - show connect wallet button
		if (!isConnected) {
			return (
				<>
					<Wallet className="mr-2 h-5 w-5" /> Connect Wallet
				</>
			);
		}

		if (isLoading) {
			return (
				<>
					<Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
				</>
			);
		}

		if (isTimeLocked || is5MinutePondInTimelock()) {
			return (
				<>
					<Loader2 className="mr-2 h-5 w-5 animate-spin" /> Selecting winner...
				</>
			);
		}

		// Pond about to end warning
		if (isPondAboutToEnd()) {
			const secondsRemaining = timeRemaining
				? Math.ceil(timeRemaining / 1000)
				: 0;
			return (
				<>
					{secondsRemaining > 0
						? `Pond ending in ${secondsRemaining}s - Tosses disabled`
						: 'Pond ending soon - Tosses disabled'}
				</>
			);
		}

		// Connected - show standard toss message (same for all cases)
		return numberOfTosses === 1
			? `Toss ${numberOfTosses} coin in ${displayPondName} pond`
			: `Toss ${numberOfTosses} coins in ${displayPondName} pond`;
	};

	// Handle the click action based on connection status
	const handleClick = (e: React.MouseEvent) => {
		if (!isConnected) {
			handleConnect(e);
		} else {
			handleToss(e);
		}
	};

	// Determine if button should be disabled
	const isButtonDisabled =
		disabled ||
		isLoading ||
		(isConnected &&
			(!selectedPond ||
				amount === '0' ||
				numberOfTosses < 1 ||
				pondStatus === PondStatus.NotStarted ||
				pondStatus === PondStatus.Completed ||
				isPondAboutToEnd() || // Disable 5 seconds before end
				isTimeLocked ||
				is5MinutePondInTimelock())); // Additional 5-minute pond timelock check

	// Enhanced styling based on state
	const getButtonStyling = () => {
		if (isPondAboutToEnd()) {
			return 'bg-red-500 text-white hover:bg-red-500'; // Warning styling for ending soon
		}
		if (isTimeLocked || is5MinutePondInTimelock()) {
			return 'bg-orange-500 text-white hover:bg-orange-500'; // Orange for timelock/selecting winner
		}
		return 'text-white animate-gradient bg-[linear-gradient(90deg,#F2E718_0%,#80E8A9_20%,#9353ED_50%,#ED5353_75%,#EDA553_100%)]'; // Default styling
	};

	return (
		<Button
			onClick={handleClick}
			disabled={isButtonDisabled}
			className={`w-full py-6 font-bold text-xl ${getButtonStyling()}`}
		>
			{getButtonText()}
		</Button>
	);
}
