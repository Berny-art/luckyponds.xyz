// src/stores/appStore.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PondPeriod, PondComprehensiveInfo } from '@/lib/types';

// Token interface
export interface Token {
	symbol: string;
	address: string;
	name: string;
	logo?: string;
	decimals: number;
	isNative: boolean;
}

// Enhanced pond interface
export interface EnhancedPond {
	type: string;
	name: string;
	displayName: string;
	period: PondPeriod;
	exists: boolean;
}

// Animation position interface
interface AnimationPosition {
	x: number;
	y: number;
}

// Event interface
export interface ContractEvent {
	id: string;
	address: string;
	amount: string;
	timestamp: number;
	type: 'CoinTossed' | 'LuckyWinnerSelected';
	pondType: string;
	position?: {
		left: string;
	};
}

// Default tokens
const DEFAULT_TOKENS: Token[] = [
	{
		symbol: 'HYPE',
		address: '0x0000000000000000000000000000000000000000',
		name: 'Hyperliquid',
		logo: 'https://assets.coingecko.com/coins/images/50882/standard/hyperliquid.jpg?1729431300',
		decimals: 18,
		isNative: true,
	},
	{
		symbol: 'BUDDY',
		address: '0x0000000000000000000000000000000000000000',
		name: 'Alright Buddy',
		logo: 'https://assets.coingecko.com/coins/images/54657/standard/alright_buddy_pfp.png?1740895394',
		decimals: 18,
		isNative: true,
	},
];

// Consolidated app state interface
interface AppState {
	// Token management
	availableTokens: Token[];
	selectedToken: Token;
	setSelectedToken: (token: Token) => void;
	getTokenByAddress: (address: string) => Token | undefined;
	getTokenBySymbol: (symbol: string) => Token | undefined;

	// Pond management
	selectedPond: string | null;
	setSelectedPond: (pondType: string) => void;
	pondTypes: EnhancedPond[];
	setPondTypes: (pondTypes: EnhancedPond[]) => void;
	isLoadingPondTypes: boolean;
	setIsLoadingPondTypes: (isLoading: boolean) => void;

	// Animation state
	isAnimationVisible: boolean;
	animationPosition: AnimationPosition;
	animationText: string;
	animationTimestamp: number;
	showAnimation: (position: AnimationPosition, text?: string) => void;
	hideAnimation: () => void;

	// Events state
	events: ContractEvent[];
	latestEvent: ContractEvent | null;
	pondInfo: PondComprehensiveInfo | null;
	addEvent: (event: ContractEvent) => void;
	setPondInfo: (pondInfo: PondComprehensiveInfo) => void;
	clearEvents: () => void;

	// Sound state
	isSoundEnabled: boolean;
	hasFirstClicked: boolean;
	setSoundEnabled: (enabled: boolean) => void;
	setFirstClicked: () => void;
}

// Animation text options
const ANIMATION_TEXTS = [
	'LFG',
	'RIBBIT',
	'DEGEN',
	'HIGHER',
	'HYPE',
	'WAGMI',
	'HWO',
	'HYPIO',
	'GET REKT',
	'HOLY LIQUID',
	'TO THE MOON',
	"LET'S GO",
	'ALRIGHT BUDDY',
];

export const useAppStore = create<AppState>()(
	persist(
		(set, get) => ({
			// Token state
			availableTokens: DEFAULT_TOKENS,
			selectedToken: DEFAULT_TOKENS[0],

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

			// Pond state
			selectedPond: null,
			setSelectedPond: (pondType) => set({ selectedPond: pondType }),
			pondTypes: [],
			setPondTypes: (pondTypes) => set({ pondTypes }),
			isLoadingPondTypes: true,
			setIsLoadingPondTypes: (isLoading) =>
				set({ isLoadingPondTypes: isLoading }),

			// Animation state
			isAnimationVisible: false,
			animationPosition: { x: 0, y: 0 },
			animationText: '',
			animationTimestamp: 0,

			showAnimation: (position, text) =>
				set({
					isAnimationVisible: true,
					animationPosition: position,
					animationText:
						text ||
						ANIMATION_TEXTS[Math.floor(Math.random() * ANIMATION_TEXTS.length)],
					animationTimestamp: Date.now(),
				}),

			hideAnimation: () =>
				set({
					isAnimationVisible: false,
				}),

			// Events state
			events: [],
			latestEvent: null,
			pondInfo: null,

			addEvent: (event) => {
				set((state) => {
					// Check if event already exists
					const eventExists = state.events.some(
						(existing) => existing.id === event.id,
					);

					if (eventExists) {
						return state;
					}

					// Add position if not present
					const eventWithPosition = {
						...event,
						position: event.position || {
							left: `${Math.floor(Math.random() * 80) + 10}%`,
						},
					};

					// Keep only the 10 most recent events
					const updatedEvents = [eventWithPosition, ...state.events].slice(
						0,
						10,
					);

					return {
						events: updatedEvents,
						latestEvent: eventWithPosition,
					};
				});
			},

			setPondInfo: (pondInfo) => set({ pondInfo }),
			clearEvents: () => set({ events: [], latestEvent: null }),

			// Sound state
			isSoundEnabled: false,
			hasFirstClicked: false,
			setSoundEnabled: (enabled) => set({ isSoundEnabled: enabled }),
			setFirstClicked: () => set({ hasFirstClicked: true }),
		}),
		{
			name: 'app-storage',
			partialize: (state) => ({
				selectedToken: state.selectedToken,
				isSoundEnabled: state.isSoundEnabled,
				hasFirstClicked: state.hasFirstClicked,
			}),
		},
	),
);
