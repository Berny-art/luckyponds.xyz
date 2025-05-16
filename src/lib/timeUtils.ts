// src/lib/timeUtils.ts
import { PondPeriod } from '@/lib/types';

/**
 * Calculates the time remaining for a pond based on its period and end time
 * @param endTime The end time in seconds (blockchain format)
 * @param period The pond period (FIVE_MIN, HOURLY, etc.)
 * @returns Time remaining in seconds
 */
export function calculateTimeRemaining(
	endTime: bigint,
	period: PondPeriod,
): number {
	// Current time in seconds
	const now = Math.floor(Date.now() / 1000);

	// Convert endTime to a number for easier math
	const endTimeNum = Number(endTime);

	// Calculate raw time remaining
	const timeRemaining = endTimeNum - now;

	// Ensure we never show negative time
	if (timeRemaining < 0) {
		return 0;
	}

	return timeRemaining;
}

/**
 * Formats time remaining in a human-readable format based on pond period
 * @param timeRemainingSeconds Time remaining in seconds
 * @param period The pond period (FIVE_MIN, HOURLY, etc.)
 * @returns Formatted time string
 */
export function formatTimeRemaining(
	timeRemainingSeconds: number,
	period: PondPeriod,
): string {
	// Convert to respective units
	const days = Math.floor(timeRemainingSeconds / 86400);
	const hours = Math.floor((timeRemainingSeconds % 86400) / 3600);
	const minutes = Math.floor((timeRemainingSeconds % 3600) / 60);
	const seconds = timeRemainingSeconds % 60;

	// Format based on pond period
	switch (period) {
		case PondPeriod.FIVE_MIN:
			// For 5-minute ponds, show minutes and seconds
			return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

		case PondPeriod.HOURLY:
			// For hourly ponds, show hours, minutes, and seconds
			return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

		default:
			// For longer ponds, adapt based on remaining time
			if (days > 0) {
				return `${days}d ${hours}h`;
			}
			if (hours > 0) {
				return `${hours}h ${minutes}m`;
			}
			return `${minutes}m ${seconds}s`;
	}
}

/**
 * Checks if a pond has ended
 * @param endTime End time in seconds (blockchain format)
 * @returns Boolean indicating if pond has ended
 */
export function hasPondEnded(endTime: bigint): boolean {
	const now = Math.floor(Date.now() / 1000);
	return now >= Number(endTime);
}

/**
 * Gets the display format for a countdown based on pond period
 * @param period The pond period
 * @returns An object with format settings
 */
export function getCountdownFormat(period: PondPeriod) {
	switch (period) {
		case PondPeriod.FIVE_MIN:
			return {
				showDays: false,
				showHours: false,
				showMinutes: true,
				showSeconds: true,
			};

		case PondPeriod.HOURLY:
			return {
				showDays: false,
				showHours: true,
				showMinutes: true,
				showSeconds: true,
			};

		default:
			return {
				showDays: true,
				showHours: true,
				showMinutes: true,
				showSeconds: true,
			};
	}
}
