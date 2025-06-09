// src/lib/timeUtils.ts
import { PondPeriod } from '@/lib/types';

/**
 * Calculates the time remaining for a pond based on its period and end time
 * @param endTime The end time in seconds (blockchain format)
 * @returns Time remaining in seconds
 */
export function calculateTimeRemaining(endTime: bigint): number {
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

/**
 * Calculate the next 5-minute interval boundary (aligned to UTC)
 */
function getNext5MinuteEndTime(): number {
	const now = new Date();

	// Get current UTC time components
	const currentUTCMinutes = now.getUTCMinutes();

	// Calculate the next 5-minute boundary in UTC (00, 05, 10, 15, etc.)
	const currentFiveMinuteMark = Math.floor(currentUTCMinutes / 5) * 5;
	let nextFiveMinuteMark = currentFiveMinuteMark + 5;

	// Create target time in UTC
	const targetTime = new Date(now);

	// Handle hour rollover
	if (nextFiveMinuteMark >= 60) {
		targetTime.setUTCHours(targetTime.getUTCHours() + 1);
		nextFiveMinuteMark = 0;
	}

	targetTime.setUTCMinutes(nextFiveMinuteMark, 0, 0); // Set to next 5-min boundary

	return targetTime.getTime();
}

/**
 * Calculate the next hourly interval boundary (aligned to UTC)
 */
function getNextHourlyEndTime(): number {
	const now = new Date();
	const targetTime = new Date(now);

	// Set to next hour boundary (0 minutes, 0 seconds)
	targetTime.setUTCHours(targetTime.getUTCHours() + 1, 0, 0, 0);

	return targetTime.getTime();
}

/**
 * Calculate the next daily interval boundary (aligned to UTC)
 */
function getNextDailyEndTime(): number {
	const now = new Date();
	const targetTime = new Date(now);

	// Set to next day boundary (0 hours, 0 minutes, 0 seconds)
	targetTime.setUTCDate(targetTime.getUTCDate() + 1);
	targetTime.setUTCHours(0, 0, 0, 0);

	return targetTime.getTime();
}

/**
 * Calculate the next weekly interval boundary (aligned to UTC, Monday start)
 */
function getNextWeeklyEndTime(): number {
	const now = new Date();
	const targetTime = new Date(now);

	// Get current day of week (0 = Sunday, 1 = Monday, etc.)
	const currentDay = targetTime.getUTCDay();

	// Calculate days until next Monday (start of week)
	const daysUntilNextMonday = currentDay === 0 ? 1 : 8 - currentDay;

	targetTime.setUTCDate(targetTime.getUTCDate() + daysUntilNextMonday);
	targetTime.setUTCHours(0, 0, 0, 0);

	return targetTime.getTime();
}

/**
 * Calculate the next monthly interval boundary (aligned to UTC)
 */
function getNextMonthlyEndTime(): number {
	const now = new Date();
	const targetTime = new Date(now);

	// Set to first day of next month (0 hours, 0 minutes, 0 seconds)
	targetTime.setUTCMonth(targetTime.getUTCMonth() + 1, 1);
	targetTime.setUTCHours(0, 0, 0, 0);

	return targetTime.getTime();
}

/**
 * Get the next UTC-based end time for a pond based on its period
 * This is used for frontend timing logic independent of contract endTime
 * @param period The pond period type
 * @param contractEndTime Fallback to contract end time for custom periods
 * @returns Next end time in milliseconds
 */
export function getNextPondEndTime(period: PondPeriod, contractEndTime?: string | number): number {
	switch (period) {
		case PondPeriod.FIVE_MIN:
			return getNext5MinuteEndTime();
		case PondPeriod.HOURLY:
			return getNextHourlyEndTime();
		case PondPeriod.DAILY:
			return getNextDailyEndTime();
		case PondPeriod.WEEKLY:
			return getNextWeeklyEndTime();
		case PondPeriod.MONTHLY:
			return getNextMonthlyEndTime();
		default:
			// For custom or unknown periods, use contract end time
			return contractEndTime ? Number(contractEndTime) * 1000 : Date.now();
	}
}

/**
 * Calculate if a pond should be disabled based on UTC timing
 * Ponds are disabled 10s before end and 25s after end
 * @param period The pond period type
 * @param contractEndTime Fallback to contract end time for custom periods
 * @returns Boolean indicating if pond should be disabled
 */
export function isPondDisabledByTiming(period: PondPeriod, contractEndTime?: string | number): boolean {
	const nextEndTime = getNextPondEndTime(period, contractEndTime);
	const currentTime = Date.now();
	const timeUntilEnd = Math.floor((nextEndTime - currentTime) / 1000); // Convert to seconds

	// Pond is disabled 10s before end and 25s after end
	return timeUntilEnd <= 10 && timeUntilEnd >= -25;
}
