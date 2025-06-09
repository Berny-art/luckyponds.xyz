'use client';

import { useState, useEffect, useRef, useMemo, type JSX } from 'react';
import Countdown from 'react-countdown';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PondComprehensiveInfo } from '@/lib/types';
import { PondPeriod } from '@/lib/types';
import { Progress } from './ui/progress';
import { usePondData } from '@/hooks/usePondData';
import { getNextPondEndTime } from '@/lib/timeUtils';

interface PondTimerProps {
	pondInfo: PondComprehensiveInfo;
}

export default function PondTimer({ pondInfo }: PondTimerProps) {
	// Memoize pond data hook dependencies to prevent unnecessary re-renders
	const pondDataDeps = useMemo(() => ({
		pondId: pondInfo?.name || null,
		tokenAddress: pondInfo?.tokenAddress || null,
	}), [pondInfo?.name, pondInfo?.tokenAddress]);

	// Get refetch function from pond data hook
	const { refetchAll } = usePondData(pondDataDeps);

	// State to track end time in milliseconds
	const [endTimeMs, setEndTimeMs] = useState<number | null>(null);

	// State for progress bar (0-100)
	const [progressValue, setProgressValue] = useState(0);

	// State to track if we should show progress bar
	const [showProgressBar, setShowProgressBar] = useState(false);

	// State to force countdown re-render when cycle changes
	const [cycleCounter, setCycleCounter] = useState(0);

	// Reference to the countdown component for manual updates
	const countdownRef = useRef<Countdown>(null);

	// Interval reference for updates
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	// Reference to prevent recursive completion calls
	const isHandlingCompletionRef = useRef(false);

	// Reference to store current endTimeMs for interval access
	const endTimeMsRef = useRef<number | null>(null);

	// Constants
	const FIVE_MINUTES_MS = 5 * 60 * 1000;

	// Function to trigger data refresh
	const triggerDataRefresh = async () => {
		try {
			await refetchAll();
		} catch (error) {
			console.error('Error refetching pond data:', error);
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

	// Update progress and visibility
	const updateProgress = () => {
		const currentEndTimeMs = endTimeMsRef.current;

		if (!currentEndTimeMs) {
			return;
		}

		const now = Date.now();
		const timeRemaining = currentEndTimeMs - now;

		// If time is expired, don't show progress
		if (timeRemaining <= 0) {
			setShowProgressBar(false);
			setProgressValue(0);
			return;
		}

		// Determine if we should show the progress bar
		const shouldShow = pondInfo.period === PondPeriod.FIVE_MIN ||
			(timeRemaining <= FIVE_MINUTES_MS && timeRemaining > 0);

		// Calculate progress
		let progressValue = 0;
		if (pondInfo.period === PondPeriod.FIVE_MIN && timeRemaining > 0) {
			const cycleDuration = getPeriodDuration();
			const elapsed = cycleDuration - timeRemaining;
			// Ensure elapsed is not negative and within bounds
			progressValue = Math.max(0, Math.min(100, (Math.max(0, elapsed) / cycleDuration) * 100));
		} else if (timeRemaining <= FIVE_MINUTES_MS && timeRemaining > 0) {
			const elapsed = FIVE_MINUTES_MS - timeRemaining;
			progressValue = Math.max(0, Math.min(100, (elapsed / FIVE_MINUTES_MS) * 100));
		}

		setShowProgressBar(shouldShow);
		setProgressValue(shouldShow ? progressValue : 0);
	};

	// Setup timer and progress tracking
	const setupTimer = () => {
		// Calculate the next end time
		let nextEndTime: number;

		if (pondInfo.period !== PondPeriod.CUSTOM) {
			nextEndTime = getNextPondEndTime(pondInfo.period, Number(pondInfo.endTime));
		} else {
			// For custom ponds, use the contract end time
			const endTimeSeconds = Number(pondInfo.endTime);
			nextEndTime = endTimeSeconds * 1000;
		}

		// Update both state and ref
		setEndTimeMs(nextEndTime);
		endTimeMsRef.current = nextEndTime;

		// Initial progress update
		setTimeout(updateProgress, 10);
	};

	// Set up interval for updates
	const setupInterval = () => {
		// Clear any existing interval
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
		}

		// Update every second for accurate progress
		intervalRef.current = setInterval(() => {
			updateProgress();
		}, 1000);
	};
	// Update timer when pond info changes
	useEffect(() => {
		if (!pondInfo) return;

		// Add a small delay to debounce rapid useEffect calls
		const timeoutId = setTimeout(() => {
			// Reset completion handling
			isHandlingCompletionRef.current = false;

			// Reset cycle counter for fresh start
			setCycleCounter(0);

			// Set up the timer first
			setupTimer();

			// Set up interval after a short delay to ensure state is updated
			setTimeout(() => {
				setupInterval();
			}, 50);
		}, 10);

		// Cleanup
		return () => {
			clearTimeout(timeoutId);
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			isHandlingCompletionRef.current = false;
			endTimeMsRef.current = null;
		};
	}, [pondInfo]); // eslint-disable-line react-hooks/exhaustive-deps

	// Handle completion
	const handleComplete = () => {
		// Prevent recursive calls
		if (isHandlingCompletionRef.current) {
			return;
		}

		isHandlingCompletionRef.current = true;

		// For standard pond periods (not custom), immediately set up the next cycle
		if (pondInfo.period !== PondPeriod.CUSTOM) {
			// Calculate next cycle immediately
			const nextEndTime = getNextPondEndTime(pondInfo.period, Number(pondInfo.endTime));

			// Set the new end time immediately to restart countdown
			setEndTimeMs(nextEndTime);
			// Update the ref immediately so progress calculation is correct
			endTimeMsRef.current = nextEndTime;

			// Increment cycle counter to force countdown re-render
			setCycleCounter((prev) => prev + 1);

			// Reset progress to 0 for new cycle and hide temporarily
			setProgressValue(0);
			setShowProgressBar(false);

			// Show progress bar again after a brief delay to allow reset
			setTimeout(() => {
				setShowProgressBar(pondInfo.period === PondPeriod.FIVE_MIN);
			}, 100);

			// Trigger immediate refetch when timer completes
			triggerDataRefresh();

			// Schedule additional refetch after 25 second period
			setTimeout(() => {
				triggerDataRefresh();
				// Reset completion handling flag after refresh
				isHandlingCompletionRef.current = false;
			}, 25000);
		} else {
			// For custom ponds, immediate refetch when timer completes
			triggerDataRefresh();

			// Hide progress bar when completed
			setProgressValue(0);
			setShowProgressBar(false);

			// Reset handling flag
			setTimeout(() => {
				isHandlingCompletionRef.current = false;
			}, 1000);
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
			// For hourly and daily ponds, focus on hours, minutes and seconds
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
			// For longer duration ponds (weekly, monthly)
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

		return (
			<div className="w-full">
				<div className="flex w-full items-center justify-center gap-1.5 text-primary-200 mb-2">
					<Clock className="mr-2 size-8" />
					<div className="flex items-center justify-center gap-1.5">
						{timeDisplay}
					</div>
					{showProgressBar && (
						<div className="w-full">
							<Progress
								value={progressValue}
								className="h-3 w-full animate-gradient bg-[linear-gradient(90deg,#F2E718_0%,#80E8A9_20%,#9353ED_50%,#ED5353_75%,#EDA553_100%)]"
							/>
						</div>
					)}
				</div>

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
		<div className='font-mono text-sm transition-all'>
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
