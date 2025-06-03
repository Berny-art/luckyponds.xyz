'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { pondCoreConfig } from '@/contracts/PondCore';
import { parseEther } from 'viem';
import { toast } from 'sonner';
import { TokenType } from '@/lib/types';
import { 
	isTokenTypeSupported, 
	getTossFunctionName
} from '@/utils/tokenUtils';
import type { Token } from '@/stores/appStore';

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
		token?: Token
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

		try {
			setIsLoading(true);
			// Reset previous transaction result
			setLastTxResult(null);

			toast.loading('Preparing transaction...', { id: 'toss-loading' });

			// Format the pond type for the contract
			const pondTypeFormatted = pondType as `0x${string}`;
			const amountFormatted = parseEther(amount);

			// Get the function name to call
			const functionName = getTossFunctionName(tokenType);

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
				return { success: false, error: new Error('Missing token information') };
			}
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

	return { 
		tossCoin, 
		isLoading, 
		txHash, 
		lastTxResult 
	};
}
