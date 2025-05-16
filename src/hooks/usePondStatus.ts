'use client';

import { useSelectionTimelock } from '@/hooks/useSelectionTimelock';
import { getPondStatus, PondStatus } from '@/functions/getPondStatus';
import type { PondComprehensiveInfo } from '@/lib/types';

/**
 * Hook that provides pond status with accurate timelock information
 * @param pondInfo The pond information object
 * @returns An object with status, timeRemaining, and isLoading
 */
export function usePondStatus(pondInfo: PondComprehensiveInfo | null) {
	// Get the timelock value from the contract
	const { data: timelockSeconds, isLoading: isTimelockLoading } =
		useSelectionTimelock();

	// If we don't have pond info, return not started
	if (!pondInfo) {
		return {
			status: PondStatus.NotStarted,
			timeRemaining: undefined,
			isLoading: isTimelockLoading,
		};
	}

	// Calculate the pond status using the contract timelock value
	const status = getPondStatus(pondInfo, timelockSeconds);

	// Calculate the time remaining in the timelock if applicable
	let timeRemaining: number | undefined;
	if (status === PondStatus.TimeLocked && timelockSeconds) {
		const now = Math.floor(Date.now() / 1000);
		const timelockEndTime = Number(pondInfo.endTime) + Number(timelockSeconds);
		timeRemaining = Math.max(0, timelockEndTime - now);
	}

	return {
		status,
		timeRemaining,
		isLoading: isTimelockLoading,
	};
}
