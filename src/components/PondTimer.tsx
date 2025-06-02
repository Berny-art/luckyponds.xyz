'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect, useRef, type JSX } from 'react';
import Countdown from 'react-countdown';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PondComprehensiveInfo } from '@/lib/types';
import { PondPeriod } from '@/lib/types';
import { Progress } from './ui/progress';
import { usePondData } from '@/hooks/usePondData';

interface PondTimerProps {
	pondInfo: PondComprehensiveInfo;
	onTimerUpdate?: (timeRemaining: number, isAboutToEnd: boolean) => void;
}

export default function PondTimer({ pondInfo, onTimerUpdate }: PondTimerProps) {
	// Get refetch function from pond data hook
	const { refetchAll } = usePondData({
		pondId: pondInfo?.name || null,
		tokenAddress: pondInfo?.tokenAddress || null,
	});

	// State to track end time in milliseconds
	const [endTimeMs, setEndTimeMs] = useState<number | null>(null);

	// State for progress bar (0-100)
	const [progressValue, setProgressValue] = useState(100);

	// State to track if we should show progress bar
	const [showProgressBar, setShowProgressBar] = useState(false);

	// State to force countdown re-render when cycle changes
	const [cycleCounter, setCycleCounter] = useState(0);

	// Reference to the countdown component for manual updates
	const countdownRef = useRef<Countdown>(null);

	// Interval reference for updates
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	// Duration reference for progress calculation
	const durationRef = useRef<number>(0);
	const startTimeRef = useRef<number>(0);

	// Reference to track if we've already triggered refetch on completion
	const hasTriggeredRefetchRef = useRef(false);

	// Debounce ref to prevent rapid successive refreshes
	const lastRefreshTimeRef = useRef(0);

	// Reference to track the current cycle end time to prevent duplicate calculations
	const currentCycleEndTimeRef = useRef<number | null>(null);

	// Reference to prevent recursive completion calls
	const isHandlingCompletionRef = useRef(false);

	// Constants
	const FIVE_MINUTES_MS = 5 * 60 * 1000;
	const DEBOUNCE_DELAY = 2000; // 2 seconds minimum between refreshes

	// Function to trigger data refresh with debouncing
	const triggerDataRefresh = async () => {
		const now = Date.now();
		if (now - lastRefreshTimeRef.current < DEBOUNCE_DELAY) {
			return;
		}

		lastRefreshTimeRef.current = now;
		try {
			await refetchAll();
		} catch (error) {
			console.error('Failed to refresh pond data:', error);
			// Don't throw error to prevent breaking the timer flow
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

	// Calculate the next hourly interval boundary (aligned to UTC)
	const getNextHourlyEndTime = () => {
		const now = new Date();
		const targetTime = new Date(now);
		
		// Set to next hour boundary (0 minutes, 0 seconds)
		targetTime.setUTCHours(targetTime.getUTCHours() + 1, 0, 0, 0);
		
		return targetTime.getTime();
	};

	// Calculate the next daily interval boundary (aligned to UTC)
	const getNextDailyEndTime = () => {
		const now = new Date();
		const targetTime = new Date(now);
		
		// Set to next day boundary (0 hours, 0 minutes, 0 seconds)
		targetTime.setUTCDate(targetTime.getUTCDate() + 1);
		targetTime.setUTCHours(0, 0, 0, 0);
		
		return targetTime.getTime();
	};

	// Calculate the next weekly interval boundary (aligned to UTC, Monday start)
	const getNextWeeklyEndTime = () => {
		const now = new Date();
		const targetTime = new Date(now);
		
		// Get current day of week (0 = Sunday, 1 = Monday, etc.)
		const currentDay = targetTime.getUTCDay();
		
		// Calculate days until next Monday (start of week)
		const daysUntilNextMonday = currentDay === 0 ? 1 : 8 - currentDay;
		
		targetTime.setUTCDate(targetTime.getUTCDate() + daysUntilNextMonday);
		targetTime.setUTCHours(0, 0, 0, 0);
		
		return targetTime.getTime();
	};

	// Calculate the next monthly interval boundary (aligned to UTC)
	const getNextMonthlyEndTime = () => {
		const now = new Date();
		const targetTime = new Date(now);
		
		// Set to first day of next month (0 hours, 0 minutes, 0 seconds)
		targetTime.setUTCMonth(targetTime.getUTCMonth() + 1, 1);
		targetTime.setUTCHours(0, 0, 0, 0);
		
		return targetTime.getTime();
	};

	// Get the next end time based on pond period
	const getNextEndTime = () => {
		switch (pondInfo.period) {
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
				return Number(pondInfo.endTime) * 1000;
		}
	};

	// Get the duration for the current period cycle
	const getPeriodDuration = () => {
		switch (pondInfo.period) {
			case PondPeriod.FIVE_MIN:
				return 5 * 60 * 1000; // 5 minutes
			case PondPeriod.HOURLY:
				return 60 * 60 * 1000; // 1 hour
			case PondPeriod.DAILY:
				return 24 * 60 * 60 * 1000; // 1 day
			case PondPeriod.WEEKLY:
				return 7 * 24 * 60 * 60 * 1000; // 1 week
			case PondPeriod.MONTHLY:
				return 30 * 24 * 60 * 60 * 1000; // 30 days (approximate)
			default:
				return FIVE_MINUTES_MS; // fallback
		}
	};

	// Calculate the start time for the current cycle
	const getCycleStartTime = (endTime: number) => {
		const duration = getPeriodDuration();
		return endTime - duration;
	};

	// Set up progress bar calculation
	const setupProgressBar = () => {
		// For all standard pond periods, calculate based on UTC cycles
		if (pondInfo.period !== PondPeriod.CUSTOM) {
			const nextEndTime = getNextEndTime();
			const cycleStartTime = getCycleStartTime(nextEndTime);

			startTimeRef.current = cycleStartTime;
			durationRef.current = getPeriodDuration();
			
			// Only show progress bar for 5-minute ponds or when other ponds have 5 minutes or less
			if (pondInfo.period === PondPeriod.FIVE_MIN) {
				setShowProgressBar(true);
			} else {
				const now = Date.now();
				const timeRemaining = nextEndTime - now;
				setShowProgressBar(timeRemaining <= FIVE_MINUTES_MS && timeRemaining > 0);
			}
			
			setEndTimeMs(nextEndTime);

			// Track this cycle
			currentCycleEndTimeRef.current = nextEndTime;
		} else {
			// For custom ponds, use the contract end time
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

		// More conservative update frequency to reduce request spam
		const updateFrequency =
			pondInfo.period === PondPeriod.FIVE_MIN ? 1000 : 2000; // 1s for 5-min, 2s for others

		// Set interval for updates
		intervalRef.current = setInterval(() => {
			// For standard pond periods (not custom), check if we need to recalculate the cycle
			if (pondInfo.period !== PondPeriod.CUSTOM) {
				const now = Date.now();
				// If we've passed the current end time AND we haven't already handled this cycle
				if (endTimeMs && now >= endTimeMs && !isHandlingCompletionRef.current) {
					isHandlingCompletionRef.current = true;

					// Use setTimeout to break out of the current execution context
					setTimeout(() => {
						// Trigger immediate refetch when cycle completes
						triggerDataRefresh();

						const nextEndTime = getNextEndTime();
						const cycleStartTime = getCycleStartTime(nextEndTime);

						// Update refs FIRST
						startTimeRef.current = cycleStartTime;
						durationRef.current = getPeriodDuration();
						hasTriggeredRefetchRef.current = false; // Reset for new cycle

						// Update current cycle tracking
						currentCycleEndTimeRef.current = nextEndTime;

						// Reset progress to 0 for new cycle AFTER refs are updated
						// Use setTimeout to ensure refs are processed first
						setTimeout(() => {
							setProgressValue(0);
						}, 50);

						// Increment cycle counter to force countdown re-render
						setCycleCounter((prev) => prev + 1);

						// Set new end time - this will cause the countdown component to reset via key prop
						setEndTimeMs(nextEndTime);

						// Schedule additional refetch after timelock period
						// Use different timelock durations based on pond period
						const timelockDuration = pondInfo.period === PondPeriod.FIVE_MIN ? 25000 : 65000; // 25s for 5-min, 65s for others
						setTimeout(() => {
							triggerDataRefresh();
							// Reset completion handling flag after post-timelock refresh
							isHandlingCompletionRef.current = false;
						}, timelockDuration);
					}, 100); // Small delay to break execution context
				}

				// Always update progress for standard ponds (this ensures continuous updates)
				updateProgress();
			} else {
				// For custom ponds, check if we should show progress and update accordingly
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
					}
					updateProgress();
				} else if (showProgressBar) {
					// Hide progress bar if time is up or too far away
					setShowProgressBar(false);
				}
			}

			// Force countdown to update
			if (countdownRef.current) {
				countdownRef.current.forceUpdate();
			}
		}, updateFrequency);
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

		// Calculate time remaining for callback
		const timeRemaining = Math.max(0, endTimeMs ? endTimeMs - now : 0);
		const isAboutToEnd = timeRemaining > 0 && timeRemaining <= 5000; // 5 seconds

		// Call the callback if provided
		if (onTimerUpdate) {
			onTimerUpdate(timeRemaining, isAboutToEnd);
		}

		setProgressValue(progress);
	};

	// Update end time when pond info changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (pondInfo) {
			// Reset all tracking refs when pond changes
			hasTriggeredRefetchRef.current = false;
			isHandlingCompletionRef.current = false;
			currentCycleEndTimeRef.current = null;

			// Reset cycle counter for fresh start
			setCycleCounter(0);

			// Set up the timer and progress bar for all pond types
			setupProgressBar(); // This now handles all pond types

			// Set up update interval
			setupInterval();
		}

		// Cleanup
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			// Reset flags on cleanup
			isHandlingCompletionRef.current = false;
			currentCycleEndTimeRef.current = null;
		};
	}, [pondInfo]);



	// Handle completion
	const handleComplete = () => {
		// Prevent recursive calls
		if (isHandlingCompletionRef.current) {
			return;
		}

		// For standard pond periods (not custom), immediately set up the next cycle
		if (pondInfo.period !== PondPeriod.CUSTOM) {
			isHandlingCompletionRef.current = true;

			// Immediate refetch when timer completes
			triggerDataRefresh();

			const nextEndTime = getNextEndTime();
			const cycleStartTime = getCycleStartTime(nextEndTime);

			// Update refs FIRST
			startTimeRef.current = cycleStartTime;
			durationRef.current = getPeriodDuration();
			hasTriggeredRefetchRef.current = false; // Reset for new cycle

			// Update cycle tracking AFTER refs are updated
			currentCycleEndTimeRef.current = nextEndTime;

			// Reset progress to 0 for new cycle AFTER refs are updated
			// Use setTimeout to ensure refs are processed first
			setTimeout(() => {
				setProgressValue(0);
			}, 50);

			// Increment cycle counter to force countdown re-render
			setCycleCounter((prev) => prev + 1);

			// Set the new end time - this will trigger the key change and countdown reset
			setEndTimeMs(nextEndTime);

			// Schedule additional refetch after timelock period ends
			// Use different timelock durations based on pond period
			const timelockDuration = pondInfo.period === PondPeriod.FIVE_MIN ? 25000 : 65000; // 25s for 5-min, 65s for others
			setTimeout(() => {
				triggerDataRefresh();
				// Reset completion handling flag after refresh
				isHandlingCompletionRef.current = false;
			}, timelockDuration);
		} else {
			// For custom ponds, immediate refetch when timer completes
			triggerDataRefresh();

			// Hide progress bar when completed
			setProgressValue(0);
			setShowProgressBar(false);

			// Trigger additional data refresh only once when timer completes
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
				key={`countdown-${endTimeMs}-${pondInfo.period}-${cycleCounter}`}
			/>
		</div>
	);
}
