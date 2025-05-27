'use client';

import { useState, useEffect } from 'react';
import { useSelectionTimelock } from '@/hooks/useSelectionTimelock';
import { getPondStatus, PondStatus } from '@/functions/getPondStatus';
import type { PondComprehensiveInfo } from '@/lib/types';
import { PondPeriod } from '@/lib/types';

/**
 * Hook that provides pond status with accurate timelock information
 * @param pondInfo The pond information object
 * @returns An object with status, timeRemaining, and isLoading
 */
export function usePondStatus(pondInfo: PondComprehensiveInfo | null) {
	// Get the timelock value from the contract
	const { data: timelockSeconds, isLoading: isTimelockLoading } =
		useSelectionTimelock();

	// State to track current status and trigger re-renders
	const [currentStatus, setCurrentStatus] = useState<PondStatus>(
		PondStatus.NotStarted,
	);
	const [timeRemaining, setTimeRemaining] = useState<number | undefined>();

	// Effect to recalculate status based on time changes
	useEffect(() => {
		if (!pondInfo) {
			setCurrentStatus(PondStatus.NotStarted);
			setTimeRemaining(undefined);
			return;
		}

		const calculateStatus = () => {
			// Calculate the pond status using the contract timelock value
			const newStatus = getPondStatus(pondInfo, timelockSeconds);

			// Only update if status actually changed to prevent unnecessary re-renders
			setCurrentStatus((prevStatus) => {
				if (prevStatus !== newStatus) {
					return newStatus;
				}
				return prevStatus;
			});

			// Calculate the time remaining in the timelock if applicable
			let remaining: number | undefined;
			if (newStatus === PondStatus.TimeLocked && timelockSeconds) {
				const now = Math.floor(Date.now() / 1000);
				const timelockEndTime =
					Number(pondInfo.endTime) + Number(timelockSeconds);
				remaining = Math.max(0, timelockEndTime - now);
			}
			setTimeRemaining(remaining);
		};

		// Calculate initial status
		calculateStatus();

		// Set up interval for regular status updates
		// Use smarter intervals to reduce unnecessary requests
		let updateInterval: number;

		if (pondInfo.period === PondPeriod.FIVE_MIN) {
			const now = Math.floor(Date.now() / 1000);
			const endTime = Number(pondInfo.endTime);
			const timeSinceEnd = now - endTime;

			// Only use frequent updates during critical transition periods
			if (timeSinceEnd >= -10 && timeSinceEnd <= 30) {
				updateInterval = 2000; // 2s during transition
			} else if (pondInfo.prizeDistributed) {
				updateInterval = 10000; // 10s when prize distributed
			} else {
				updateInterval = 5000; // 5s otherwise
			}
		} else {
			// For non-5min ponds, if completed and prize distributed, much slower updates
			if (pondInfo.prizeDistributed) {
				updateInterval = 30000; // 30s for completed ponds
			} else {
				updateInterval = 10000; // 10s for other ponds
			}
		}

		const interval = setInterval(calculateStatus, updateInterval);

		return () => clearInterval(interval);
	}, [pondInfo, timelockSeconds]);

	// If we don't have pond info, return not started
	if (!pondInfo) {
		return {
			status: PondStatus.NotStarted,
			timeRemaining: undefined,
			isLoading: isTimelockLoading,
		};
	}

	return {
		status: currentStatus,
		timeRemaining,
		isLoading: isTimelockLoading,
	};
}
