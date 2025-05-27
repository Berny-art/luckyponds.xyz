'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect, useRef, type JSX } from 'react';
import Countdown from 'react-countdown';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PondComprehensiveInfo } from '@/lib/types';
import { PondPeriod } from '@/lib/types';
import { Progress } from './ui/progress';
import { usePondData } from '@/stores/pondDataStore';

export default function PondTimer({
	pondInfo,
}: { pondInfo: PondComprehensiveInfo }) {
	// Get refetch function from pond data store
	const { refetchAll } = usePondData();

	// State to track end time in milliseconds
	const [endTimeMs, setEndTimeMs] = useState<number | null>(null);

	// State for progress bar (0-100)
	const [progressValue, setProgressValue] = useState(100);

	// State to track if we should show progress bar
	const [showProgressBar, setShowProgressBar] = useState(false);

	// Reference to the countdown component for manual updates
	const countdownRef = useRef<Countdown>(null);

	// Interval reference for updates
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	// Duration reference for progress calculation
	const durationRef = useRef<number>(0);
	const startTimeRef = useRef<number>(0);

	// Reference to track if we've already triggered refetch on completion
	const hasTriggeredRefetchRef = useRef(false);

	// Constants
	const FIVE_MINUTES_MS = 5 * 60 * 1000;

	// Function to trigger data refresh
	const triggerDataRefresh = async () => {
		try {
			await refetchAll();
		} catch (error) {
			console.error('Failed to refresh pond data from timer:', error);
		}
	};

	// Calculate the next 5-minute interval boundary (aligned to UTC)
	const getNext5MinuteEndTime = () => {
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
	};

	// Calculate the start time for the current 5-minute cycle
	const get5MinuteCycleStartTime = (endTime: number) => {
		return endTime - FIVE_MINUTES_MS;
	};

	// Set up progress bar calculation
	const setupProgressBar = () => {
		if (pondInfo.period === PondPeriod.FIVE_MIN) {
			// For 5-minute ponds, always calculate based on 5-minute cycles
			const nextEndTime = getNext5MinuteEndTime();
			const cycleStartTime = get5MinuteCycleStartTime(nextEndTime);

			startTimeRef.current = cycleStartTime;
			durationRef.current = FIVE_MINUTES_MS;
			setShowProgressBar(true);
			setEndTimeMs(nextEndTime);
		} else {
			// For other ponds, use the contract end time
			if (!pondInfo.endTime || Number(pondInfo.endTime) === 0) {
				setProgressValue(0);
				setShowProgressBar(false);
				return;
			}

			const endTimeSeconds = Number(pondInfo.endTime);
			const endTimeMilliseconds = endTimeSeconds * 1000;
			const now = Date.now();
			const timeRemaining = endTimeMilliseconds - now;

			// Only show progress bar if 5 minutes or less remaining
			if (timeRemaining <= FIVE_MINUTES_MS && timeRemaining > 0) {
				startTimeRef.current = endTimeMilliseconds - FIVE_MINUTES_MS;
				durationRef.current = FIVE_MINUTES_MS;
				setShowProgressBar(true);
			} else {
				setShowProgressBar(false);
			}

			setEndTimeMs(endTimeMilliseconds);
		}

		// Initial progress update
		updateProgress();
	};

	// Set up interval for updates
	const setupInterval = () => {
		// Clear any existing interval
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
		}

		// More frequent updates for 5-minute ponds or when showing progress
		const updateFrequency =
			pondInfo.period === PondPeriod.FIVE_MIN ? 250 : 1000;

		// Set interval for updates
		intervalRef.current = setInterval(() => {
			// For 5-minute ponds, check if we need to recalculate the cycle
			if (pondInfo.period === PondPeriod.FIVE_MIN) {
				const now = Date.now();
				// If we've passed the current end time, recalculate for the next cycle
				if (endTimeMs && now > endTimeMs) {
					const nextEndTime = getNext5MinuteEndTime();
					const cycleStartTime = get5MinuteCycleStartTime(nextEndTime);

					startTimeRef.current = cycleStartTime;
					setEndTimeMs(nextEndTime);
					hasTriggeredRefetchRef.current = false; // Reset for new cycle

					console.log('New 5-min cycle started (UTC aligned):', {
						start: new Date(cycleStartTime).toISOString(),
						end: new Date(nextEndTime).toISOString(),
						utcMinutes: new Date(nextEndTime).getUTCMinutes(),
					});

					// Trigger data refresh when 5-minute cycle resets
					triggerDataRefresh();
				}

				// Always update progress for 5-minute ponds (this ensures continuous updates)
				updateProgress();
			} else {
				// For other ponds, check if we should show progress and update accordingly
				const endTimeSeconds = Number(pondInfo.endTime);
				const endTimeMilliseconds = endTimeSeconds * 1000;
				const now = Date.now();
				const timeRemaining = endTimeMilliseconds - now;

				// Start showing progress bar when 5 minutes or less remaining
				if (timeRemaining <= FIVE_MINUTES_MS && timeRemaining > 0) {
					// If not already showing, set it up
					if (!showProgressBar) {
						startTimeRef.current = endTimeMilliseconds - FIVE_MINUTES_MS;
						durationRef.current = FIVE_MINUTES_MS;
						setShowProgressBar(true);
						console.log(
							'Started showing progress bar with',
							timeRemaining / 1000 / 60,
							'minutes remaining',
						);
					}
					updateProgress();
				} else if (showProgressBar) {
					// Hide progress bar if time is up or too far away
					setShowProgressBar(false);
					console.log(
						'Hiding progress bar, time remaining:',
						timeRemaining / 1000 / 60,
						'minutes',
					);
				}
			}

			// Force countdown to update
			if (countdownRef.current) {
				countdownRef.current.forceUpdate();
			}
		}, updateFrequency);
	};

	// Function to check if we should start showing progress for non-5min ponds
	const checkIfShouldShowProgress = () => {
		if (!pondInfo.endTime || Number(pondInfo.endTime) === 0) return;

		const endTimeSeconds = Number(pondInfo.endTime);
		const endTimeMilliseconds = endTimeSeconds * 1000;
		const now = Date.now();
		const timeRemaining = endTimeMilliseconds - now;

		// Start showing progress bar when 5 minutes or less remaining
		if (timeRemaining <= FIVE_MINUTES_MS && timeRemaining > 0) {
			startTimeRef.current = endTimeMilliseconds - FIVE_MINUTES_MS;
			durationRef.current = FIVE_MINUTES_MS;
			setShowProgressBar(true);
		}
	};

	// Function to update progress based on elapsed time
	const updateProgress = () => {
		if (durationRef.current === 0) return;

		const now = Date.now();

		// Calculate progress from cycle start to cycle end
		const elapsed = now - startTimeRef.current;
		const progress = Math.max(
			0,
			Math.min(100, (elapsed / durationRef.current) * 100),
		);

		setProgressValue(progress);
	};

	// Update end time when pond info changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (pondInfo) {
			// Reset refetch trigger when pond changes
			hasTriggeredRefetchRef.current = false;

			// Set up the timer and progress bar
			if (pondInfo.period === PondPeriod.FIVE_MIN) {
				setupProgressBar(); // This handles 5-minute cycle calculation
			} else {
				updateEndTime(); // Use contract time for other ponds
				setupProgressBar();
			}

			// Set up update interval
			setupInterval();
		}

		// Cleanup
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [pondInfo]);

	// Function to update the end time for non-5-minute ponds
	const updateEndTime = () => {
		if (pondInfo?.endTime === undefined) return;

		// Convert from seconds (blockchain timestamp) to milliseconds (JS timestamp)
		const endTimeMilliseconds = Number(pondInfo.endTime) * 1000;

		setEndTimeMs(endTimeMilliseconds);
	};

	// Handle completion
	const handleComplete = () => {
		// For 5-minute ponds, immediately set up the next cycle
		if (pondInfo.period === PondPeriod.FIVE_MIN) {
			const nextEndTime = getNext5MinuteEndTime();
			const cycleStartTime = get5MinuteCycleStartTime(nextEndTime);

			// Update refs and state for the new cycle
			startTimeRef.current = cycleStartTime;
			setEndTimeMs(nextEndTime);
			hasTriggeredRefetchRef.current = false; // Reset for new cycle

			// Reset progress to 0 and immediately start calculating new progress
			setProgressValue(0);

			// Force countdown to update with new end time
			if (countdownRef.current) {
				countdownRef.current.forceUpdate();
			}

			// Trigger data refresh
			triggerDataRefresh();
		} else {
			// For other ponds, hide progress bar when completed
			setProgressValue(0);
			setShowProgressBar(false);

			// Trigger data refresh only once when timer completes
			if (!hasTriggeredRefetchRef.current) {
				hasTriggeredRefetchRef.current = true;
				setTimeout(() => {
					triggerDataRefresh();
				}, 500);
			}
		}
	};

	// Renderer for the countdown
	const renderer = ({
		days,
		hours,
		minutes,
		seconds,
		completed,
	}: {
		days: number;
		hours: number;
		minutes: number;
		seconds: number;
		completed: boolean;
	}) => {
		// For 5-minute ponds, never show completed state - always show countdown
		const showCompleted = completed && pondInfo?.period !== PondPeriod.FIVE_MIN;

		// Always display time digits
		let timeDisplay: JSX.Element;

		if (pondInfo?.period === PondPeriod.FIVE_MIN) {
			// For 5-minute ponds, show minutes and seconds
			timeDisplay = (
				<>
					<span className="flex w-8 justify-center rounded bg-primary-200/10 py-1 font-bold font-mono text-lg">
						{showCompleted ? '00' : minutes.toString().padStart(2, '0')}
					</span>
					:
					<span className="flex w-8 justify-center rounded bg-primary-200/10 py-1 font-bold font-mono text-lg">
						{showCompleted ? '00' : seconds.toString().padStart(2, '0')}
					</span>
				</>
			);
		} else if (
			pondInfo?.period === PondPeriod.HOURLY ||
			pondInfo?.period === PondPeriod.DAILY
		) {
			// For hourly ponds, focus on hours, minutes and seconds
			timeDisplay = (
				<>
					<span className="flex w-8 justify-center rounded bg-primary-200/10 py-1 font-bold font-mono text-lg">
						{showCompleted ? '00' : hours.toString().padStart(2, '0')}
					</span>
					:
					<span className="flex w-8 justify-center rounded bg-primary-200/10 py-1 font-bold font-mono text-lg">
						{showCompleted ? '00' : minutes.toString().padStart(2, '0')}
					</span>
					:
					<span className="flex w-8 justify-center rounded bg-primary-200/10 py-1 font-bold font-mono text-lg">
						{showCompleted ? '00' : seconds.toString().padStart(2, '0')}
					</span>
				</>
			);
		} else {
			// For longer duration ponds (daily, weekly, monthly)
			timeDisplay = (
				<>
					<span className="flex w-8 justify-center rounded bg-primary-200/10 py-1 font-bold font-mono text-lg">
						{showCompleted ? '00' : days.toString().padStart(2, '0')}
					</span>
					:
					<span className="flex w-8 justify-center rounded bg-primary-200/10 py-1 font-bold font-mono text-lg">
						{showCompleted ? '00' : hours.toString().padStart(2, '0')}
					</span>
					:
					<span className="flex w-8 justify-center rounded bg-primary-200/10 py-1 font-bold font-mono text-lg">
						{showCompleted ? '00' : minutes.toString().padStart(2, '0')}
					</span>
					:
					<span className="flex w-8 justify-center rounded bg-primary-200/10 py-1 font-bold font-mono text-lg">
						{showCompleted ? '00' : seconds.toString().padStart(2, '0')}
					</span>
				</>
			);
		}

		// Show progress bar for 5-minute ponds or when any pond has 5 minutes or less
		return (
			<div className="flex w-full items-center justify-center gap-1.5 text-primary-200">
				<Clock className="mr-2 size-8" />
				<div className="flex items-center justify-center gap-1.5">
					{timeDisplay}
				</div>

				{showProgressBar && (
					<div className="ml-4 flex w-full flex-col gap-1">
						<Progress
							value={progressValue}
							className="h-3 w-full animate-gradient bg-[linear-gradient(90deg,#F2E718_0%,#80E8A9_20%,#9353ED_50%,#ED5353_75%,#EDA553_100%)]"
						/>
					</div>
				)}
			</div>
		);
	};

	// If no pond info is available
	if (!pondInfo) {
		return (
			<div className={cn('flex items-center gap-1.5 opacity-70')}>
				<Clock className="size-8" />
				<span className="font-mono">Loading time...</span>
			</div>
		);
	}

	// Standard timer content
	return (
		<div className={cn('font-mono text-sm')}>
			<Countdown
				ref={countdownRef}
				date={endTimeMs ?? 0}
				renderer={renderer}
				onComplete={handleComplete}
				key={`countdown-${endTimeMs}-${pondInfo.period}`}
			/>
		</div>
	);
}
