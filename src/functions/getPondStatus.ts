import type { PondComprehensiveInfo } from '@/lib/types';

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
 * Gets the status of a pond based on its start time, end time, and prize distribution status
 *
 * @param pondInfo The pond information object
 * @returns The current status of the pond as a PondStatus enum
 */
export function getPondStatus(pondInfo: PondComprehensiveInfo): PondStatus {
	if (!pondInfo?.startTime || !pondInfo?.endTime) {
		return PondStatus.NotStarted;
	}

	const now = BigInt(Math.floor(Date.now() / 1000));

	if (now < pondInfo.startTime) {
		return PondStatus.NotStarted;
	}

	if (now > pondInfo.endTime && pondInfo.prizeDistributed) {
		return PondStatus.Completed;
	}

	if (now > pondInfo.endTime) {
		return PondStatus.SelectWinner;
	}

	return PondStatus.Open;
}
