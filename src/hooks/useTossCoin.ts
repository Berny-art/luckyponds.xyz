'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { pondCoreConfig } from '@/contracts/PondCore';
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
	const [lastTxResult, setLastTxResult] = useState<{
		success: boolean;
		hash?: `0x${string}`;
		error?: Error;
	} | null>(null);

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

			// Set successful result
			setLastTxResult({
				success: true,
				hash: txHash,
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

			// Set error result
			setLastTxResult({
				success: false,
				hash: txHash,
				error,
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
			return { success: false, error: new Error('Invalid parameters') };
		}

		try {
			setIsLoading(true);
			// Reset previous transaction result
			setLastTxResult(null);

			toast.loading('Preparing transaction...', { id: 'toss-loading' });

			// Format the pond type for the contract
			const pondTypeFormatted = pondType as `0x${string}`;
			const amountFormatted = parseEther(amount);

			// Handle native or ERC20 tokens differently
			if (tokenType === TokenType.NATIVE) {
				// Native token (ETH/HYPE) transaction
				const hash = await writeContractAsync({
					...pondCoreConfig,
					address: pondCoreConfig.address as `0x${string}`,
					functionName: 'toss', // PondCore uses 'toss' instead of 'tossCoin'
					args: [pondTypeFormatted, amountFormatted],
					value: amountFormatted,
					type: 'legacy',
				});

				setTxHash(hash);
				toast.loading('Transaction submitted, waiting for confirmation...', {
					id: 'toss-loading',
				});

				// Return the transaction hash immediately
				return { success: true, hash, pending: true };
			}
			// For ERC20 token transactions, would need approval first
			toast.error('ERC20 token tossing not supported yet', {
				description: 'Please use native HYPE token for now.',
			});
			setIsLoading(false);
			return { success: false, error: new Error('ERC20 not supported') };
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

			return { success: false, error };
		}
	};

	return { tossCoin, isLoading, txHash, lastTxResult };
}
