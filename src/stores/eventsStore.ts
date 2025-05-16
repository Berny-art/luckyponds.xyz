// stores/eventsStore.ts
'use client';

import { create } from 'zustand';
import type { PondComprehensiveInfo } from '@/lib/types';

// Define event types based on the contract events
export interface ContractEvent {
	id: string;
	address: string; // Now represents 'participant' instead of 'frog'
	amount: string;
	timestamp: number;
	type: 'CoinTossed' | 'LuckyWinnerSelected'; // Updated name from 'LuckyFrogSelected'
	pondType: string;
	position?: {
		left: string;
	};
}

interface EventsState {
	events: ContractEvent[];
	latestEvent: ContractEvent | null;
	pondInfo: PondComprehensiveInfo | null;
	addEvent: (event: ContractEvent) => void;
	setPondInfo: (pondInfo: PondComprehensiveInfo) => void;
	clearEvents: () => void;
}

export const useEventsStore = create<EventsState>((set) => ({
	events: [],
	latestEvent: null,
	pondInfo: null,
	addEvent: (event) => {
		set((state) => {
			// Check if an event with this ID already exists in the store
			const eventExists = state.events.some(
				(existing) => existing.id === event.id,
			);

			if (eventExists) {
				// If the event already exists, don't add it again
				console.log('Skipping duplicate event in store:', event.id);
				return state; // Return the current state unchanged
			}

			// Add position property for floating events if not already present
			const eventWithPosition = {
				...event,
				position: event.position || {
					left: `${Math.floor(Math.random() * 80) + 10}%`, // Random position between 10-90%
				},
			};

			// Create a new array with the new event at the beginning
			const updatedEvents = [eventWithPosition, ...state.events].slice(0, 10); // Keep only the 10 most recent events

			return {
				events: updatedEvents,
				latestEvent: eventWithPosition,
			};
		});
	},
	setPondInfo: (pondInfo) => set({ pondInfo }),
	clearEvents: () => set({ events: [], latestEvent: null }),
}));
