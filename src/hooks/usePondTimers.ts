// src/hooks/usePondTimers.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { PondComprehensiveInfo } from '@/lib/types';
import { PondPeriod } from '@/lib/types';
import { PondStatus } from '@/functions/getPondStatus';
import { usePondStatus } from './usePondStatus';

interface UsePondTimersProps {
	pondInfo: PondComprehensiveInfo;
	isAboutToEnd?: boolean;
}

export function usePondTimers({ pondInfo, isAboutToEnd }: UsePondTimersProps) {
	const { status: pondStatus } = usePondStatus(pondInfo);

	// Query for current time to trigger re-calculations
	const { data: currentTime } = useQuery({
		queryKey: ['current-time'],
		queryFn: () => Math.floor(Date.now() / 1000),
		refetchInterval: 1000, // Update every second
		staleTime: 0,
	});

	// Check if pond is about to end (5 seconds before end time)
	const isPondAboutToEnd = useMemo(() => {
		// Use the provided isAboutToEnd prop if available (for 5-minute ponds)
		if (isAboutToEnd !== undefined) {
			return isAboutToEnd;
		}

		if (!currentTime) return false;

		const endTime = Number(pondInfo.endTime);
		const timeUntilEnd = endTime - currentTime;

		// Disable 5 seconds before end
		return timeUntilEnd <= 10 && timeUntilEnd > 0;
	}, [isAboutToEnd, pondInfo.endTime, currentTime]);

	// Additional check for 5-minute pond timelock status
	const is5MinutePondInTimelock = useMemo(() => {
		if (pondInfo?.period !== PondPeriod.FIVE_MIN || !currentTime) return false;

		const nowMs = currentTime * 1000;
		const now = new Date(nowMs);
		const currentUTCMinutes = now.getUTCMinutes();

		// Calculate the NEXT 5-minute boundary
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

		// If we've passed the boundary (timer hit zero), check if we're in timelock
		if (timeUntilBoundarySeconds < 0) {
			const timePastBoundarySeconds = -timeUntilBoundarySeconds;
			// 20 second timelock for 5-minute ponds
			return timePastBoundarySeconds < 20;
		}

		return false;
	}, [pondInfo?.period, currentTime]);

	return {
		isPondAboutToEnd,
		is5MinutePondInTimelock,
		isTimeLocked: pondStatus === PondStatus.TimeLocked,
		pondStatus,
		currentTime,
	};
}
