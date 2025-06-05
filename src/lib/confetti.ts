import confetti from 'canvas-confetti';
import { PondPeriod } from '@/lib/types';

// Get themed emoji based on period
const getThemedEmoji = (period: PondPeriod) => {
	switch (period) {
		case PondPeriod.FIVE_MIN:
			return '⚡'; // Lightning for fast 5-min ponds
		case PondPeriod.HOURLY:
			return '⏱️'; // Clock for hourly ponds
		case PondPeriod.DAILY:
			return '🌟'; // Star for daily
		case PondPeriod.WEEKLY:
			return '💧'; // Water drop for weekly
		case PondPeriod.MONTHLY:
			return '💜'; // Heart for monthly
		default:
			return '💎';
	}
};

// Full desktop confetti effect with multiple bursts
export const triggerFullConfetti = (period: PondPeriod) => {
	// Create a variety of emoji shapes with a consistent scale
	const scalar = 2;

	// Create a good variety of themed emojis
	const frogs = confetti.shapeFromText({ text: '🐸', scalar });
	const money = confetti.shapeFromText({ text: '💰', scalar });
	const trophy = confetti.shapeFromText({ text: '🏆', scalar });
	const celebration = confetti.shapeFromText({ text: '🎉', scalar });
	const party = confetti.shapeFromText({ text: '🥳', scalar });

	// Add themed emoji based on period
	const specialEmoji = confetti.shapeFromText({
		text: getThemedEmoji(period),
		scalar,
	});

	// Common settings for the burst
	const defaults = {
		spread: 360, // Full 360° spread for an omnidirectional burst
		ticks: 120, // Longer-lasting particles
		gravity: 0.2, // Lower gravity for slower falling
		decay: 0.92, // Slower decay so particles last longer
		startVelocity: 30, // Good initial velocity
		scalar,
		zIndex: 2000,
		disableForReducedMotion: true,
		origin: { x: 0.5, y: 0.5 }, // Center of the screen
	};

	// Main emoji burst
	confetti({
		...defaults,
		particleCount: 25, // Primary emoji count
		shapes: [frogs, specialEmoji, celebration],
	});

	// Smaller burst of flat particles
	confetti({
		...defaults,
		particleCount: 10, // Fewer particles for secondary burst
		shapes: [money, trophy],
		flat: true,
		ticks: 110,
	});

	// Small circles and party emojis for contrast
	confetti({
		...defaults,
		particleCount: 15,
		shapes: ['circle', party],
		scalar: scalar / 1.5,
		startVelocity: 25,
		ticks: 90,
	});

	// Add side bursts for dramatic effect
	setTimeout(() => {
		// Left side burst
		confetti({
			particleCount: 8,
			angle: 60,
			spread: 50,
			origin: { x: 0, y: 0.65 },
			shapes: [specialEmoji, celebration],
			scalar,
			startVelocity: 25,
			gravity: 0.3,
			drift: 2,
			ticks: 100,
		});

		// Right side burst
		confetti({
			particleCount: 8,
			angle: 120,
			spread: 50,
			origin: { x: 1, y: 0.65 },
			shapes: [trophy, party],
			scalar,
			startVelocity: 25,
			gravity: 0.3,
			drift: -2,
			ticks: 100,
		});
	}, 200);
};

// Simple mobile-friendly confetti effect
export const triggerSimpleConfetti = (period?: PondPeriod) => {
	const scalar = 1.5;
	
	// Create simpler emoji shapes for mobile
	const frogs = confetti.shapeFromText({ text: '🐸', scalar });
	const celebration = confetti.shapeFromText({ text: '🎉', scalar });
	const money = confetti.shapeFromText({ text: '💰', scalar });
	
	// Add themed emoji if period is provided
	const shapes = period 
		? [frogs, celebration, confetti.shapeFromText({ text: getThemedEmoji(period), scalar })]
		: [frogs, celebration, money];

	// Single burst optimized for mobile
	confetti({
		particleCount: 15, // Fewer particles for better mobile performance
		spread: 70,
		origin: { x: 0.5, y: 0.6 },
		shapes,
		scalar,
		startVelocity: 20,
		gravity: 0.3,
		decay: 0.9,
		ticks: 80,
		zIndex: 2000,
		disableForReducedMotion: true,
	});
};

