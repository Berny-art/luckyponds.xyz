'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { useTossCoin } from '@/hooks/useTossCoin';
import { usePondStore } from '@/stores/pondStore';
import { Loader2, Wallet } from 'lucide-react';
import type { PondComprehensiveInfo } from '@/lib/types';
import { useAccount, useWriteContract } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { pondCoreConfig } from '@/contracts/PondCore';
import { toast } from 'sonner';
import { PondStatus } from '@/functions/getPondStatus';
import { usePondStatus } from '@/hooks/usePondStatus';
import { useAnimationStore } from '@/stores/animationStore';

interface CoinTossButtonProps {
	amount: string;
	numberOfTosses: number;
	pondInfo: PondComprehensiveInfo;
	disabled?: boolean;
}

export default function CoinTossButton({
	amount,
	numberOfTosses,
	pondInfo,
	disabled = false,
}: CoinTossButtonProps) {
	const { address } = useAccount();
	const isConnected = !!address;
	const { openConnectModal } = useConnectModal();
	const { selectedPond } = usePondStore();
	const { tossCoin, isLoading: tossLoading } = useTossCoin();
	const [isProcessing, setIsProcessing] = useState(false);
	const { writeContractAsync, isPending: isWritePending } = useWriteContract();
	const { showLFG } = useAnimationStore();

	// Get pond status with accurate timelock information
	const { status: pondStatus } = usePondStatus(pondInfo);

	// Check if the component is in a loading state
	const isLoading = tossLoading || isProcessing || isWritePending;

	// Function to select a winner for the pond (hidden from user)
	const selectWinner = async () => {
		if (!selectedPond) return;

		try {
			// No toast notification for this step - we keep it hidden
			const hash = await writeContractAsync({
				...pondCoreConfig,
				address: pondCoreConfig.address as `0x${string}`,
				functionName: 'selectLuckyWinner',
				args: [selectedPond as `0x${string}`],
			});

			console.log('Silent winner selection transaction:', hash);
			return hash;
		} catch (error: unknown) {
			console.error('Silent winner selection error:', error);
			throw error;
		}
	};

	// Handle the connect wallet action with RainbowKit
	const handleConnect = (e: React.MouseEvent) => {
		const x = e.clientX;
		const y = e.clientY;
		if (x && y) {
			showLFG({ x, y });
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
			showLFG({ x, y });
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
					console.error('Error in silent winner selection:', error);
					setIsProcessing(false);
					return;
				}
			}

			// Proceed with the toss (standard or after selection)
			await tossCoin(selectedPond, amount, pondInfo.tokenType);
		} catch (error) {
			console.error('Toss process error:', error);
		} finally {
			setIsProcessing(false);
		}
	};

	// Get pond name for display
	const pondName = pondInfo?.name || 'pond';
	const displayPondName = pondName.includes('Pond')
		? pondName.replace('Pond', '').trim()
		: pondName;

	// Get the button text based on connection, loading, and pond status
	const getButtonText = () => {
		if (isLoading) {
			return (
				<>
					<Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
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

		// Connected - show standard toss message
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

	// Apply correct timelock duration based on pond period (shorter for 5-min ponds)
	const isTimeLocked = pondStatus === PondStatus.TimeLocked;

	// Determine if button should be disabled
	const isButtonDisabled =
		disabled ||
		isLoading ||
		(isConnected &&
			(!selectedPond ||
				amount === '0' ||
				numberOfTosses < 1 ||
				pondStatus === PondStatus.NotStarted ||
				isTimeLocked ||
				pondStatus === PondStatus.Completed));

	return (
		<Button
			onClick={handleClick}
			disabled={isButtonDisabled}
			className="w-full bg-drip-300 py-6 font-bold text-secondary-950 text-xl hover:bg-drip-300/90"
		>
			{getButtonText()}
		</Button>
	);
}
