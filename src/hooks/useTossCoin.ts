'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { luckyPondsContractConfig } from '@/contracts/LuckyPonds';
import { parseEther } from 'viem';
import { toast } from 'sonner';
import { TokenType } from '@/lib/types';

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

	// Nonce errors
	if (errorMessage.includes('nonce')) {
		return 'Transaction sequence error. Please refresh and try again';
	}

	// Slippage / price impact
	if (
		errorMessage.includes('slippage') ||
		errorMessage.includes('price impact')
	) {
		return 'Price changed during transaction. Try again';
	}

	// Contract execution error
	if (
		errorMessage.includes('execution reverted') ||
		errorMessage.includes('UNPREDICTABLE_GAS_LIMIT')
	) {
		return 'Contract error. This transaction cannot be completed';
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
	return 'Transaction failed. Please try again';
};

export function useTossCoin() {
	const [isLoading, setIsLoading] = useState(false);
	const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

	const { writeContractAsync } = useWriteContract();

	// Watch for transaction status
	const { isSuccess, isError, error } = useWaitForTransactionReceipt({
		hash: txHash as `0x${string}`,
	});

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

			setTxHash(null);
			setIsLoading(false);
		}
	}, [txHash, isSuccess, isError, error]);

	// Function to handle coin toss
	const tossCoin = async (
		pondType: string,
		amount: string,
		tokenType: TokenType = TokenType.NATIVE,
	) => {
		if (!pondType || amount === '0') {
			toast.error('Invalid toss parameters', {
				description: 'Please select a pond and enter a valid amount.',
			});
			return;
		}

		try {
			setIsLoading(true);
			toast.loading('Preparing transaction...', { id: 'toss-loading' });

			// Handle native or ERC20 tokens differently
			if (tokenType === TokenType.NATIVE) {
				// Native token (ETH) transaction
				const hash = await writeContractAsync({
					...luckyPondsContractConfig,
					functionName: 'tossCoin',
					args: [pondType as `0x${string}`],
					value: parseEther(amount),
				});

				setTxHash(hash);
				toast.loading('Transaction submitted, waiting for confirmation...', {
					id: 'toss-loading',
				});
			} else {
				// ERC20 token transaction (requires approval first)
				const hash = await writeContractAsync({
					...luckyPondsContractConfig,
					functionName: 'tossToken',
					args: [pondType as `0x${string}`, parseEther(amount)],
				});

				setTxHash(hash);
				toast.loading('Transaction submitted, waiting for confirmation...', {
					id: 'toss-loading',
				});
			}
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		} catch (error: any) {
			setIsLoading(false);
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

			console.error('Toss coin error:', error);
		}
	};

	return { tossCoin, isLoading, txHash };
}
