// src/stores/tokenStore.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Token {
	symbol: string;
	address: string;
	name: string;
	logo?: string | undefined; // Optional logo URL
	decimals: number;
	isNative: boolean;
}

interface TokenState {
	availableTokens: Token[];
	selectedToken: Token;

	setSelectedToken: (token: Token) => void;
	getTokenByAddress: (address: string) => Token | undefined;
	getTokenBySymbol: (symbol: string) => Token | undefined;
}

const DEFAULT_TOKENS: Token[] = [
	{
		symbol: 'HYPE',
		address: '0x0000000000000000000000000000000000000000', // Native token
		name: 'Hyperliquid',
		logo: 'https://assets.coingecko.com/coins/images/50882/standard/hyperliquid.jpg?1729431300', // Path to logo image
		decimals: 18,
		isNative: true,
	},
	{
		symbol: 'BUDDY',
		address: '0x0000000000000000000000000000000000000000', // Native token
		name: 'Alright Buddy',
		logo: 'https://assets.coingecko.com/coins/images/54657/standard/alright_buddy_pfp.png?1740895394', // Path to logo image
		decimals: 18,
		isNative: true,
	},
];

export const useTokenStore = create<TokenState>()(
	persist(
		(set, get) => ({
			availableTokens: DEFAULT_TOKENS,
			selectedToken: DEFAULT_TOKENS[0], // Default to HYPE

			setSelectedToken: (token) => set({ selectedToken: token }),

			getTokenByAddress: (address) => {
				return get().availableTokens.find(
					(token) => token.address.toLowerCase() === address.toLowerCase(),
				);
			},

			getTokenBySymbol: (symbol) => {
				return get().availableTokens.find(
					(token) => token.symbol.toLowerCase() === symbol.toLowerCase(),
				);
			},
		}),
		{
			name: 'token-storage',
			partialize: (state) => ({
				selectedToken: state.selectedToken,
			}),
		},
	),
);
