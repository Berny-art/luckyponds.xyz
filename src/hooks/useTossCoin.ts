'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { pondCoreConfig } from '@/contracts/PondCore';
import { toast } from 'sonner';
import { TokenType } from '@/lib/types';
import { 
	isTokenTypeSupported, 
	getTossFunctionName
} from '@/utils/tokenUtils';
import { sendDiscordWebhook } from '@/utils/discordWebhook';
import { formatValue, parseTokenAmount } from '@/lib/utils';
import type { Token } from '@/stores/appStore';
import type { PondComprehensiveInfo } from '@/lib/types';
import { getPondStatus, PondStatus } from '@/functions/getPondStatus';

/**
 * Maps technical blockchain errors to user-friendly messages
 */
const getUserFriendlyErrorMessage = (errorMessage: string): string => {
	// User rejected/cancelled transaction
	if (
		errorMessage.includes('User rejected the request') ||
		errorMessage.includes('rejected') ||
		errorMessage.includes('denied')
	) {
		return 'Transaction cancelled';
	}

	// Insufficient funds
	if (
		errorMessage.includes('insufficient funds') ||
		errorMessage.includes('Insufficient funds') ||
		errorMessage.includes('exceeds balance')
	) {
		return 'Insufficient funds for this transaction';
	}

	// Gas price related errors
	if (
		errorMessage.includes('gas') &&
		(errorMessage.includes('price') ||
			errorMessage.includes('limit') ||
			errorMessage.includes('fee'))
	) {
		return 'Network is congested. Try again with higher gas or later';
	}

	// Slippage / price impact
	if (
		errorMessage.includes('slippage') ||
		errorMessage.includes('price impact')
	) {
		return 'Price changed during transaction. Try again';
	}

	// PondCore specific errors
	if (errorMessage.includes('AmountTooLow')) {
		return 'Toss amount is too low for this pond';
	}

	if (errorMessage.includes('MaxTossAmountExceeded')) {
		return 'Maximum toss amount exceeded for this pond';
	}

	if (errorMessage.includes('PondNotOpen')) {
		return 'This pond is not currently open for tosses';
	}

	if (errorMessage.includes('TimelockActive')) {
		return 'Winner selection is currently time-locked';
	}

	// Contract execution error
	if (
		errorMessage.includes('execution reverted') ||
		errorMessage.includes('UNPREDICTABLE_GAS_LIMIT')
	) {
		return 'Contract error. This transaction cannot be completed';
	}

	// Nonce errors
	if (errorMessage.includes('nonce')) {
		return 'Transaction sequence error. Please refresh and try again';
	}

	// Network/RPC errors
	if (
		errorMessage.includes('network') ||
		errorMessage.includes('disconnected') ||
		errorMessage.includes('timeout')
	) {
		return 'Network connection issue. Please check your internet and try again';
	}

	// Fallback for unknown errors
	// return 'Transaction failed. Please try again';
	return 'Transaction failed. Please try again';
};

export function useTossCoin() {
	const [isLoading, setIsLoading] = useState(false);
	const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
	const [selectWinnerTxHash, setSelectWinnerTxHash] = useState<`0x${string}` | null>(null);
	const [lastTxResult, setLastTxResult] = useState<{
		success: boolean;
		hash?: `0x${string}`;
		error?: Error;
	} | null>(null);
	
	// Store additional data for Discord webhook
	const [pendingWebhookData, setPendingWebhookData] = useState<{
		userAddress: string;
		amount: string;
		selectedToken: Token;
		pondInfo: PondComprehensiveInfo;
	} | null>(null);

	// Store pending toss data for after winner selection
	const [pendingTossData, setPendingTossData] = useState<{
		pondType: string;
		amount: string;
		tokenType: TokenType;
		token?: Token;
		pondInfo?: PondComprehensiveInfo;
	} | null>(null);

	const { writeContractAsync } = useWriteContract();
	const { address } = useAccount();

	// Watch for winner selection transaction status
	const { isSuccess: isSelectWinnerSuccess, isError: isSelectWinnerError, error: selectWinnerError } = useWaitForTransactionReceipt({
		hash: selectWinnerTxHash as `0x${string}`,
	});

	// Watch for main transaction status
	const { isSuccess, isError, error } = useWaitForTransactionReceipt({
		hash: txHash as `0x${string}`,
	});

	// Handle winner selection transaction completion
	useEffect(() => {
		if (!selectWinnerTxHash) return;

		if (isSelectWinnerSuccess && pendingTossData) {
			toast.dismiss('select-winner-loading');
			toast.success('Pond prepared! Now processing your toss...', { duration: 2000 });
			
			// Clear winner selection hash and proceed with the toss
			setSelectWinnerTxHash(null);
			
			// Execute the pending toss
			const { pondType, amount, tokenType, token, pondInfo } = pendingTossData;
			setPendingTossData(null);
			
			// Execute the actual toss without winner selection check
			executeToss(pondType, amount, tokenType, token, pondInfo);
		}

		if (isSelectWinnerError && selectWinnerError) {
			toast.dismiss('select-winner-loading');
			const friendlyMessage = getUserFriendlyErrorMessage(selectWinnerError.message || '');
			toast.error('Failed to select winner', {
				description: friendlyMessage,
			});
			
			setSelectWinnerTxHash(null);
			setPendingTossData(null);
			setIsLoading(false);
		}
	}, [selectWinnerTxHash, isSelectWinnerSuccess, isSelectWinnerError, selectWinnerError, pendingTossData]);

	// Use useEffect to handle transaction status changes
	useEffect(() => {
		// Only proceed if we have a transaction hash
		if (!txHash) return;

		// Handle success
		if (isSuccess) {
			toast.dismiss('toss-loading');
			toast.success('Coin toss successful!', {
				description: 'Your transaction has been confirmed.',
			});

			// Set successful result
			setLastTxResult({
				success: true,
				hash: txHash,
			});

			// Send Discord webhook if we have pending data
			if (pendingWebhookData && txHash) {
				const { userAddress, amount, selectedToken, pondInfo } = pendingWebhookData;
				
				// Calculate new total value (existing + tossed amount)
				const tossedAmount = parseTokenAmount(amount, selectedToken.decimals);
				const newTotalValue = pondInfo.totalValue + tossedAmount;
				
				sendDiscordWebhook({
					userAddress,
					amount,
					selectedToken,
					pondName: pondInfo.name.replace('ETH', '').trim(), // Remove 'ETH' if present and trim
					pondSymbol: selectedToken.symbol,
					totalValue: formatValue(newTotalValue, selectedToken.decimals).toString(),
					txHash,
				}).catch(error => {
					console.error('Discord webhook error:', error);
				});
				
				// Clear pending webhook data
				setPendingWebhookData(null);
			}

			setTxHash(null);
			setIsLoading(false);
		}

		// Handle error
		if (isError && error) {
			toast.dismiss('toss-loading');

			// Get user-friendly error message
			const friendlyMessage = getUserFriendlyErrorMessage(error.message || '');

			toast.error(friendlyMessage, {
				description:
					friendlyMessage === 'Transaction cancelled'
						? 'You cancelled this transaction'
						: 'Something went wrong with your transaction',
			});

			// Set error result
			setLastTxResult({
				success: false,
				hash: txHash,
				error,
			});

			setTxHash(null);
			setIsLoading(false);
		}
	}, [txHash, isSuccess, isError, error, pendingWebhookData]);

	// Helper function to execute the actual toss (without winner selection logic)
	const executeToss = async (
		pondType: string,
		amount: string,
		tokenType: TokenType,
		token?: Token,
		pondInfo?: PondComprehensiveInfo
	) => {
		try {
			toast.loading('Preparing transaction...', { id: 'toss-loading' });

			// Format the pond type for the contract
			const pondTypeFormatted = pondType as `0x${string}`;
			const amountFormatted = parseTokenAmount(amount, token?.decimals || 18);

			// Get the function name to call
			const functionName = getTossFunctionName(tokenType);

			// Store data for Discord webhook (if user is connected and pond info is available)
			if (address && pondInfo && token) {
				setPendingWebhookData({
					userAddress: address,
					amount,
					selectedToken: token,
					pondInfo,
				});
			}

			// Handle native or ERC20 tokens - both use the same function signature
			// The contract determines the token type from the pond type itself
			if (tokenType === TokenType.NATIVE) {
				// Native token (ETH/HYPE) transaction - includes value field
				const hash = await writeContractAsync({
					...pondCoreConfig,
					address: pondCoreConfig.address as `0x${string}`,
					functionName,
					args: [pondTypeFormatted, amountFormatted],
					value: amountFormatted,
					type: 'legacy',
				});

				setTxHash(hash);
				toast.loading('Transaction submitted, waiting for confirmation...', {
					id: 'toss-loading',
				});

				return { success: true, hash, pending: true };
			} else if (tokenType === TokenType.ERC20 && token) {
				// ERC20 token transaction - no value field, tokens must be pre-approved
				const hash = await writeContractAsync({
					...pondCoreConfig,
					address: pondCoreConfig.address as `0x${string}`,
					functionName,
					args: [pondTypeFormatted, amountFormatted],
					type: 'legacy',
				});

				setTxHash(hash);
				toast.loading('Transaction submitted, waiting for confirmation...', {
					id: 'toss-loading',
				});

				return { success: true, hash, pending: true };
			} else {
				toast.error('Missing token information', {
					description: 'Token details are required for ERC20 transactions.',
				});
				setIsLoading(false);
				setPendingWebhookData(null); // Clear pending data on error
				return { success: false, error: new Error('Missing token information') };
			}
		} catch (error: any) {
			setIsLoading(false);
			setPendingWebhookData(null); // Clear pending data on error
			toast.dismiss('toss-loading');

			// Get user-friendly error message
			const friendlyMessage = getUserFriendlyErrorMessage(error?.message || '');

			// Customize toast based on error type
			if (friendlyMessage === 'Transaction cancelled') {
				toast.error(friendlyMessage, {
					description: 'You cancelled this transaction',
				});
			} else {
				toast.error(friendlyMessage, {
					description: error?.message
						? `Details: ${error.message.substring(0, 60)}${error.message.length > 60 ? '...' : ''}`
						: 'There was an error with your coin toss',
				});
			}

			return { success: false, error };
		}
	};

	// Function to handle coin toss
	const tossCoin = async (
		pondType: string,
		amount: string,
		tokenType: TokenType = TokenType.NATIVE,
		token?: Token,
		pondInfo?: PondComprehensiveInfo
	) => {
		if (!pondType || amount === '0') {
			toast.error('Invalid toss parameters', {
				description: 'Please select a pond and enter a valid amount.',
			});
			return { success: false, error: new Error('Invalid parameters') };
		}

		// Validate token type support
		if (!isTokenTypeSupported(tokenType)) {
			toast.error('Unsupported token type', {
				description: 'This token type is not currently supported.',
			});
			return { success: false, error: new Error('Unsupported token type') };
		}

		setIsLoading(true);
		// Reset previous transaction result
		setLastTxResult(null);

		// Check if pond status is SelectWinner and handle winner selection first
		if (pondInfo) {
			const pondStatus = getPondStatus(pondInfo);
			if (pondStatus === PondStatus.SelectWinner) {
				try {
					toast.loading('Preparing pond...', { id: 'select-winner-loading' });
					
					// Store the toss data for after winner selection
					setPendingTossData({
						pondType,
						amount,
						tokenType,
						token,
						pondInfo
					});
					
					// Call selectLuckyWinner first
					const selectWinnerHash = await writeContractAsync({
						...pondCoreConfig,
						address: pondCoreConfig.address as `0x${string}`,
						functionName: 'selectLuckyWinner',
						args: [pondType as `0x${string}`],
						type: 'legacy',
					});

					setSelectWinnerTxHash(selectWinnerHash);
					return { success: true, hash: selectWinnerHash, pending: true };
					
				} catch (selectWinnerError: any) {
					toast.dismiss('select-winner-loading');
					setIsLoading(false);
					const friendlyMessage = getUserFriendlyErrorMessage(selectWinnerError?.message || '');
					toast.error('Failed to prepare pond.', {
						description: friendlyMessage,
					});
					return { success: false, error: selectWinnerError };
				}
			}
		}

		// If not in SelectWinner status, proceed with normal toss
		return await executeToss(pondType, amount, tokenType, token, pondInfo);
	};

	return { 
		tossCoin, 
		isLoading, 
		txHash, 
		lastTxResult 
	};
}
