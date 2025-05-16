'use client';

import { create } from 'zustand';

interface AnimationPosition {
	x: number;
	y: number;
}

interface AnimationState {
	// Animation state
	isVisible: boolean;
	position: AnimationPosition;
	text: string;
	fromColor: string;
	toColor: string;
	textColor: string;
	timestamp: number; // Added timestamp to ensure state updates even with same values

	// Actions
	showAnimation: (
		position: AnimationPosition,
		text: string,
		fromColor?: string,
		toColor?: string,
		textColor?: string,
	) => void;
	hideAnimation: () => void;

	// Presets
	showHigher: (position: AnimationPosition) => void;
	showDegen: (position: AnimationPosition) => void;
	showLFG: (position: AnimationPosition) => void;
	showRandom: (position: AnimationPosition) => void;
}

export const useAnimationStore = create<AnimationState>((set) => ({
	// Default state
	isVisible: false,
	position: { x: 0, y: 0 },
	text: '',
	fromColor: '',
	toColor: '',
	textColor: '',
	timestamp: 0,

	// Show animation with custom options
	showAnimation: (
		position,
		text,
		fromColor = 'from-drip-300',
		toColor = 'to-primary-200',
		textColor = 'text-primary-foreground',
	) =>
		set({
			isVisible: true,
			position,
			text,
			fromColor,
			toColor,
			textColor,
			timestamp: Date.now(), // Update timestamp to force re-render
		}),

	// Hide animation
	hideAnimation: () =>
		set({
			isVisible: false,
			// Don't clear other properties to allow for smooth transitions
		}),

	// Preset: Higher animation
	showHigher: (position) =>
		set({
			isVisible: true,
			position,
			text: 'HIGHER',
			fromColor: 'from-drip-300',
			toColor: 'to-primary-200',
			textColor: 'text-white',
			timestamp: Date.now(), // Update timestamp to force re-render
		}),

	// Preset: Degen animation
	showDegen: (position) =>
		set({
			isVisible: true,
			position,
			text: 'DEGEN',
			textColor: 'text-white',
			timestamp: Date.now(), // Update timestamp to force re-render
		}),

	// Preset: LFG animation
	showLFG: (position) =>
		set({
			isVisible: true,
			position,
			text: 'LFG',
			textColor: 'text-white',
			timestamp: Date.now(), // Update timestamp to force re-render
		}),

	showRandom: (position) =>
		set({
			isVisible: true,
			position,
			text: [
				'LFG',
				'RIBBIT',
				'DEGEN',
				'HIGHER',
				'HYPE',
				'WAGMI',
				'TO THE MOON',
				"LET'S GO",
				'ALRIGHT BUDDY',
			][Math.floor(Math.random() * 9)],
			textColor: 'text-white',
			timestamp: Date.now(), // Update timestamp to force re-render
		}),
}));
