import { type PondComprehensiveInfo, PondPeriod } from '@/lib/types';

/**
 * Enum representing the possible states of a pond
 */
export enum PondStatus {
	NotStarted = 'Not Started',
	Open = 'Open',
	SelectWinner = 'Select Winner',
	TimeLocked = 'Time Locked',
	Completed = 'Completed',
}

/**
 * Gets the status of a pond based on its configuration and current state
 *
 * @param pondInfo The pond information object
 * @param timelockSeconds Optional timelock duration in seconds (from contract)
 * @returns The current status of the pond as a PondStatus enum
 */
export function getPondStatus(
	pondInfo: PondComprehensiveInfo,
	timelockSeconds?: bigint,
): PondStatus {
	// If pond info doesn't exist or is incomplete, consider it not started
	if (!pondInfo?.startTime || !pondInfo?.endTime) {
		return PondStatus.NotStarted;
	}

	const now = BigInt(Math.floor(Date.now() / 1000));

	// Check if pond hasn't started yet
	if (now < pondInfo.startTime) {
		return PondStatus.NotStarted;
	}

	// Special handling for 5-minute ponds (prioritize over general completion check)
	if (pondInfo.period === PondPeriod.FIVE_MIN) {
		// 5-minute ponds cycle continuously based on UTC 5-minute boundaries
		// The pond is "Open" during the 5-minute countdown, then "TimeLocked" for 20 seconds after the timer hits zero

		const nowMs = Date.now();
		const now = new Date(nowMs);
		const currentUTCMinutes = now.getUTCMinutes();

		// Calculate the NEXT 5-minute boundary (where the timer is counting down to)
		const currentFiveMinuteMark = Math.floor(currentUTCMinutes / 5) * 5;
		let nextFiveMinuteMark = currentFiveMinuteMark + 5;

		const nextBoundary = new Date(now);

		// Handle hour rollover
		if (nextFiveMinuteMark >= 60) {
			nextBoundary.setUTCHours(nextBoundary.getUTCHours() + 1);
			nextFiveMinuteMark = 0;
		}

		nextBoundary.setUTCMinutes(nextFiveMinuteMark, 0, 0);

		// Calculate time until the next boundary
		const timeUntilBoundaryMs = nextBoundary.getTime() - nowMs;
		const timeUntilBoundarySeconds = Math.floor(timeUntilBoundaryMs / 1000);

		// Get timelock duration in seconds (20 seconds for 5-min ponds)
		const timelockDuration =
			timelockSeconds || getEstimatedTimelock(pondInfo.period);
		const timelockDurationSeconds = Number(timelockDuration);

		// If we've passed the boundary (timer hit zero), check if we're in timelock
		if (timeUntilBoundarySeconds < 0) {
			const timePastBoundarySeconds = -timeUntilBoundarySeconds;

			// Timelock for the first N seconds after crossing the boundary
			if (timePastBoundarySeconds < timelockDurationSeconds) {
				return PondStatus.TimeLocked;
			}

			// After timelock expires, pond needs winner selection before next cycle
			return PondStatus.SelectWinner;
		}

		// During countdown (before boundary), pond is Open
		return PondStatus.Open;
	}

	// General completion check for non-5-minute ponds
	if (now > pondInfo.endTime && pondInfo.prizeDistributed) {
		return PondStatus.Completed;
	}

	// Standard logic for non-5-minute ponds
	// Check if pond has ended but prize hasn't been distributed
	if (now > pondInfo.endTime) {
		// Use the provided timelock or a period-based estimate
		const timelockDuration =
			timelockSeconds || getEstimatedTimelock(pondInfo.period);
		const timelockEndTime = pondInfo.endTime + timelockDuration;

		// Pond is time-locked if current time is between end time and timelock end time
		if (now < timelockEndTime) {
			return PondStatus.TimeLocked;
		}

		return PondStatus.SelectWinner;
	}

	// If none of the above, pond is open
	return PondStatus.Open;
}

/**
 * Gets an estimated timelock duration based on pond period
 * Used as a fallback when contract value is not available
 *
 * @param period The pond period
 * @returns Estimated timelock duration in seconds as a bigint
 */
function getEstimatedTimelock(period: PondPeriod | undefined): bigint {
	// Determine timelock based on pond period
	switch (period) {
		case PondPeriod.FIVE_MIN:
			return BigInt(20); // 20 seconds for 5-minute ponds
		case PondPeriod.HOURLY:
			return BigInt(60); // 1 minute for other ponds
		case PondPeriod.DAILY:
			return BigInt(60);
		case PondPeriod.WEEKLY:
			return BigInt(60);
		case PondPeriod.MONTHLY:
			return BigInt(60);
		default:
			return BigInt(60);
	}
}
