import { type PondComprehensiveInfo } from '@/lib/types';

/**
 * Enum representing the possible states of a pond
 */
export enum PondStatus {
	NotStarted = 'Not Started',
	Open = 'Open',
	SelectWinner = 'Select Winner',
	Completed = 'Completed',
}

/**
 * Gets the status of a pond based on its configuration and current state
 *
 * @param pondInfo The pond information object
 * @returns The current status of the pond as a PondStatus enum
 */
export function getPondStatus(
	pondInfo: PondComprehensiveInfo,
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

	if (now > pondInfo.endTime && !pondInfo.prizeDistributed) {
		return PondStatus.SelectWinner;
	}

	// Check if pond has ended and prize is distributed
	if (now > pondInfo.endTime && pondInfo.prizeDistributed) {
		return PondStatus.Completed;
	}

	// If none of the above, pond is open
	return PondStatus.Open;
}
