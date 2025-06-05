// utils/tokenUtils.ts
import { TokenType } from '@/lib/types';
import type { Token } from '@/stores/appStore';

/**
 * Utility functions for token operations
 * This file contains helper functions that will be used when ERC20 support is added
 */

/**
 * Determines if a token requires approval before tossing
 * @param token The token to check
 * @returns true if the token requires approval (ERC20), false for native tokens
 */
export function requiresApproval(token: Token): boolean {
	return !token.isNative && token.address !== '0x0000000000000000000000000000000000000000';
}

/**
 * Gets the contract function name to use for tossing a specific token type
 * @param tokenType The type of token (NATIVE or ERC20)
 * @returns The function name to call on the contract
 */
export function getTossFunctionName(tokenType: TokenType): string {
	switch (tokenType) {
		case TokenType.NATIVE:
			return 'toss'; // Payable function for native tokens
		case TokenType.ERC20:
			return 'toss'; // Same function, but requires approval first
		default:
			throw new Error(`Unsupported token type: ${tokenType}`);
	}
}

/**
 * Validates if a token type is currently supported by the contract
 * @param tokenType The token type to validate
 * @returns true if supported, false otherwise
 */
export function isTokenTypeSupported(tokenType: TokenType): boolean {
	// Both native and ERC20 tokens are supported
	return tokenType === TokenType.NATIVE || tokenType === TokenType.ERC20;
}

/**
 * Standard ERC20 ABI for approval operations
 * This will be used when ERC20 support is implemented
 */
export const ERC20_ABI = [
	{
		inputs: [
			{ name: 'spender', type: 'address' },
			{ name: 'amount', type: 'uint256' }
		],
		name: 'approve',
		outputs: [{ name: '', type: 'bool' }],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{ name: 'owner', type: 'address' },
			{ name: 'spender', type: 'address' }
		],
		name: 'allowance',
		outputs: [{ name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ name: 'account', type: 'address' }],
		name: 'balanceOf',
		outputs: [{ name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	}
] as const;

/**
 * Error messages for ERC20 operations
 */
export const ERC20_ERROR_MESSAGES = {
	INSUFFICIENT_ALLOWANCE: 'Insufficient token allowance. Please approve the contract to spend your tokens.',
	INSUFFICIENT_BALANCE: 'Insufficient token balance for this transaction.',
	APPROVAL_FAILED: 'Token approval failed. Please try again.',
	APPROVAL_CANCELLED: 'Token approval was cancelled.',
} as const;

/**
 * Gets user-friendly error message for approval operations
 * @param errorMessage The raw error message
 * @returns A user-friendly error message
 */
export function getApprovalErrorMessage(errorMessage: string): string {
	if (
		errorMessage.includes('User rejected the request') ||
		errorMessage.includes('rejected') ||
		errorMessage.includes('denied')
	) {
		return ERC20_ERROR_MESSAGES.APPROVAL_CANCELLED;
	}

	if (
		errorMessage.includes('insufficient funds') ||
		errorMessage.includes('Insufficient funds')
	) {
		return 'Insufficient ETH for approval transaction fees';
	}

	return ERC20_ERROR_MESSAGES.APPROVAL_FAILED;
}

/**
 * Determines if approval is needed for a specific token and amount
 * @param currentAllowance The current allowance amount
 * @param requiredAmount The amount needed for the transaction
 * @returns true if approval is needed, false if current allowance is sufficient
 */
export function needsApproval(currentAllowance: bigint, requiredAmount: bigint): boolean {
	return currentAllowance < requiredAmount;
}
