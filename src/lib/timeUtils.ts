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
 * Get the start time of the current pond period
 * @param period The pond period type
 * @param contractEndTime Fallback to contract end time for custom periods
 * @returns Start time in milliseconds
 */
function getCurrentPondStartTime(period: PondPeriod, contractEndTime?: string | number): number {
	const endTime = getNextPondEndTime(period, contractEndTime);
	
	switch (period) {
		case PondPeriod.FIVE_MIN:
			return endTime - (5 * 60 * 1000); // 5 minutes before end
		case PondPeriod.HOURLY:
			return endTime - (60 * 60 * 1000); // 1 hour before end
		case PondPeriod.DAILY:
			return endTime - (24 * 60 * 60 * 1000); // 1 day before end
		case PondPeriod.WEEKLY:
			return endTime - (7 * 24 * 60 * 60 * 1000); // 1 week before end
		case PondPeriod.MONTHLY:
			// For monthly, we need to calculate the previous month boundary
			const endDate = new Date(endTime);
			const startDate = new Date(endDate);
			startDate.setUTCMonth(startDate.getUTCMonth() - 1);
			return startDate.getTime();
		default:
			// For custom periods, assume we don't know the duration
			return endTime - (60 * 60 * 1000); // Default to 1 hour
	}
}

/**
 * Calculate if a pond should be disabled based on UTC timing
 * Ponds are disabled 10s before end and 25s after start and end
 * @param period The pond period type
 * @param contractEndTime Fallback to contract end time for custom periods
 * @returns Boolean indicating if pond should be disabled
 */
export function isPondDisabledByTiming(period: PondPeriod, contractEndTime?: string | number): boolean {
	const nextEndTime = getNextPondEndTime(period, contractEndTime);
	const startTime = getCurrentPondStartTime(period, contractEndTime);
	const currentTime = Date.now();
	
	const timeUntilEnd = Math.floor((nextEndTime - currentTime) / 1000); // Convert to seconds
	const timeSinceStart = Math.floor((currentTime - startTime) / 1000); // Convert to seconds

	// Pond is disabled during:
	// 1. First 25 seconds after start
	// 2. Last 10 seconds before end  
	// 3. First 25 seconds after end
	const isInFirstSecondsAfterStart = timeSinceStart >= 0 && timeSinceStart <= 25;
	const isInLastSecondsBeforeEnd = timeUntilEnd <= 10 && timeUntilEnd > 0;
	const isInFirstSecondsAfterEnd = timeUntilEnd <= 0 && timeUntilEnd >= -25;

	return isInFirstSecondsAfterStart || isInLastSecondsBeforeEnd || isInFirstSecondsAfterEnd;
}

/**
 * Get specific timing states for pond UI display
 * @param period The pond period type
 * @param contractEndTime Fallback to contract end time for custom periods
 * @returns Object with timing states
 */
export function getPondTimingStates(period: PondPeriod, contractEndTime?: string | number) {
	const nextEndTime = getNextPondEndTime(period, contractEndTime);
	const startTime = getCurrentPondStartTime(period, contractEndTime);
	const currentTime = Date.now();
	
	const timeUntilEnd = Math.floor((nextEndTime - currentTime) / 1000);
	const timeSinceStart = Math.floor((currentTime - startTime) / 1000);

	const isInFirstSecondsAfterStart = timeSinceStart >= 0 && timeSinceStart <= 25;
	const isInLastSecondsBeforeEnd = timeUntilEnd <= 10 && timeUntilEnd > 0;
	const isInFirstSecondsAfterEnd = timeUntilEnd <= 0 && timeUntilEnd >= -25;

	return {
		timeUntilEnd,
		timeSinceStart,
		isInFirstSecondsAfterStart,
		isInLastSecondsBeforeEnd,
		isInFirstSecondsAfterEnd,
		isPondDisabled: isInFirstSecondsAfterStart || isInLastSecondsBeforeEnd || isInFirstSecondsAfterEnd
	};
}
