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
export function formatValue(value: bigint | undefined) {
	const numValue = Number(formatEther(value ?? 0));
	let decimalPlaces = 4;
	if (numValue < 0.001) decimalPlaces = 4;
	if (numValue > 0.01) decimalPlaces = 2;
	if (numValue >= 1) decimalPlaces = 0;
	return Number.parseFloat(formatEther(value ?? 0)).toFixed(decimalPlaces);
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
	address: string,
	{ nPrefix, nSuffix, separator }: Params = {},
) {
	const match = address.match(/^(0x[a-zA-Z0-9])[a-zA-Z0-9]+([a-zA-Z0-9])$/);
	const nTotalIsLongerThanAddress =
		(nPrefix || 0) + (nSuffix || 0) > address.length;

	return match && !nTotalIsLongerThanAddress
		? `0x${address.slice(2, 2 + (nPrefix || 4))}${separator ? opening[separator] : ''}…${
				separator ? closing[separator] : ''
			}${address.slice(address.length - (nSuffix || 4))}`
		: address;
}
