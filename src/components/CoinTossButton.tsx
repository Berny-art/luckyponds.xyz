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

interface CoinTossButtonProps {
	amount: string;
	numberOfTosses: number;
	pondInfo: PondComprehensiveInfo;
	disabled?: boolean;
	onTransactionSuccess?: () => void; // New callback prop
}

export default function CoinTossButton({
	amount,
	numberOfTosses,
	pondInfo,
	disabled = false,
	onTransactionSuccess, // Add the new prop
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

	// Check if pond is about to end (5 seconds before end time)
	const isPondAboutToEnd = () => {
		if (!pondInfo?.endTime) return false;

		const now = Math.floor(Date.now() / 1000);
		const endTime = Number(pondInfo.endTime);
		const timeUntilEnd = endTime - now;

		// Disable 5 seconds before end
		return timeUntilEnd <= 5 && timeUntilEnd > 0;
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
			if (pondStatus === PondStatus.SelectWinner) {
				toast.loading('Processing transaction...', { id: 'toss-loading' });
				try {
					// Silently trigger winner selection
					await selectWinner();
					// Small delay to ensure transactions are processed in order
					await new Promise((resolve) => setTimeout(resolve, 500));
				} catch (error: unknown) {
					toast.error('Transaction failed', {
						id: 'toss-loading',
						description: 'There was an error processing your transaction.',
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
		if (isLoading) {
			return (
				<>
					<Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
				</>
			);
		}

		if (isTimeLocked) {
			return (
				<>
					<Loader2 className="mr-2 h-5 w-5 animate-spin" /> Selecting winner...
				</>
			);
		}

		// Not connected - show connect wallet button
		if (!isConnected) {
			return (
				<>
					<Wallet className="mr-2 h-5 w-5" /> Connect Wallet
				</>
			);
		}

		// Pond about to end warning
		if (isPondAboutToEnd()) {
			return 'Pond ending soon - Tosses disabled';
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
				isTimeLocked));

	return (
		<Button
			onClick={handleClick}
			disabled={isButtonDisabled}
			className={`w-full py-6 font-bold text-xl ${
				isPondAboutToEnd()
					? 'bg-red-500 text-white hover:bg-red-600' // Warning styling for ending soon
					: 'bg-drip-300 text-secondary-950 hover:bg-drip-300/90' // Default styling for all other cases
			}`}
		>
			{getButtonText()}
		</Button>
	);
}
