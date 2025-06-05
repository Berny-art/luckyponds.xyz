import { clsx, type ClassValue } from 'clsx';
import { formatEther } from 'ethers';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Format the timestamp for next draw time
export function formatNextDrawTime(endTime: bigint) {
	const date = new Date(Number(endTime) * 1000);
	return date.toLocaleString();
}

// Format the ether values for display
export function formatValue(value: bigint | string | undefined) {
	let numValue = 0;
	// if is string convert to bigint
	if (typeof value === 'string') {
		numValue = Number(value);
	}
	if (typeof value === 'bigint') {
		numValue = Number(formatEther(value));
	}
	// For undefined, use 0
	if (value === undefined) {
		numValue = 0;
	}

	let decimalPlaces = 4;
	if (numValue < 0.001) decimalPlaces = 4;
	if (numValue > 0.01) decimalPlaces = 2;
	if (numValue >= 1) decimalPlaces = 0;
	return numValue.toFixed(decimalPlaces);
}

type Params = {
	nPrefix?: number;
	nSuffix?: number;
	separator?: 'braces' | 'brackets' | 'parenthesis';
};

const opening = {
	braces: '{',
	brackets: '[',
	parenthesis: '(',
};

const closing = {
	braces: '}',
	brackets: ']',
	parenthesis: ')',
};

export function formatAddress(
	address: string | null | undefined,
	{ nPrefix, nSuffix, separator }: Params = {},
) {
	// Handle null or undefined addresses
	if (!address) {
		return 'N/A';
	}

	// Ensure address is a string
	const addressStr = String(address);

	const match = addressStr.match(/^(0x[a-zA-Z0-9])[a-zA-Z0-9]+([a-zA-Z0-9])$/);
	const nTotalIsLongerThanAddress =
		(nPrefix || 0) + (nSuffix || 0) > addressStr.length;

	return match && !nTotalIsLongerThanAddress
		? `0x${addressStr.slice(2, 2 + (nPrefix || 4))}${separator ? opening[separator] : ''}…${
				separator ? closing[separator] : ''
			}${addressStr.slice(addressStr.length - (nSuffix || 4))}`
		: addressStr;
}
