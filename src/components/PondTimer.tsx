'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect, useRef, type JSX } from 'react';
import Countdown from 'react-countdown';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PondComprehensiveInfo } from '@/lib/types';
import { PondPeriod } from '@/lib/types';
import { Progress } from './ui/progress';
import usePondInfo from '@/hooks/usePondInfo';
import { usePondStore } from '@/stores/pondStore';

export default function PondTimer({
	pondInfo,
}: { pondInfo: PondComprehensiveInfo }) {
	// Get selected pond and refetch function
	const { selectedPond } = usePondStore();
	const { refetch: refetchPondInfo } = usePondInfo(selectedPond);

	// State to track end time in milliseconds
	const [endTimeMs, setEndTimeMs] = useState<number | null>(null);

	// State to know if time has ended
	const [isCompleted, setIsCompleted] = useState(false); //eslint-disable-line @typescript-eslint/no-unused-vars

	// State for progress bar (0-100)
	const [progressValue, setProgressValue] = useState(100);

	// State to track if we should show progress bar
	const [showProgressBar, setShowProgressBar] = useState(false);

	// Reference to the countdown component for manual updates
	const countdownRef = useRef<Countdown>(null);

	// Interval reference for short-duration ponds
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
			// Access the refetchAll function from the hook's meta if available
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const refetchAll = (refetchPondInfo as any)?.meta?.refetchAll; //eslint-disable-line @typescript-eslint/no-explicit-any
			if (refetchAll) {
				await refetchAll();
			} else {
				await refetchPondInfo();
			}
			console.log('Timer triggered data refresh');
		} catch (error) {
			console.error('Failed to refresh pond data from timer:', error);
		}
	};

	// Set up progress bar calculation
	const setupProgressBar = () => {
		if (!pondInfo.endTime || Number(pondInfo.endTime) === 0) {
			setProgressValue(0);
			setShowProgressBar(false);
			return;
		}

		const endTimeSeconds = Number(pondInfo.endTime);
		const endTimeMilliseconds = endTimeSeconds * 1000;
		const now = Date.now();
		const timeRemaining = endTimeMilliseconds - now;

		// For 5-minute ponds, always show progress bar
		if (pondInfo.period === PondPeriod.FIVE_MIN) {
			// Calculate start time (5 minutes before end)
			startTimeRef.current = endTimeMilliseconds - FIVE_MINUTES_MS;
			durationRef.current = FIVE_MINUTES_MS;
			setShowProgressBar(true);
		}
		// For other ponds, only show progress bar if 5 minutes or less remaining
		else if (timeRemaining <= FIVE_MINUTES_MS && timeRemaining > 0) {
			// Start time is 5 minutes before end time, duration is always 5 minutes
			startTimeRef.current = endTimeMilliseconds - FIVE_MINUTES_MS;
			durationRef.current = FIVE_MINUTES_MS;
			setShowProgressBar(true);
		} else {
			setShowProgressBar(false);
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

		// More frequent updates for short-duration ponds or when showing progress
		const updateFrequency =
			pondInfo.period === PondPeriod.FIVE_MIN || showProgressBar ? 250 : 1000;

		// Set interval for updates
		intervalRef.current = setInterval(() => {
			// Update progress if we're showing the progress bar
			if (showProgressBar) {
				updateProgress();
			}

			// Check if we need to start showing progress bar for non-5min ponds
			if (pondInfo.period !== PondPeriod.FIVE_MIN && !showProgressBar) {
				checkIfShouldShowProgress();
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
			// Start time is 5 minutes before end time, duration is always 5 minutes
			startTimeRef.current = endTimeMilliseconds - FIVE_MINUTES_MS;
			durationRef.current = FIVE_MINUTES_MS;
			setShowProgressBar(true);
		}
	};

	// Function to update progress based on elapsed time
	const updateProgress = () => {
		if (durationRef.current === 0) return;

		// If end time is 0, progress is 0
		if (Number(pondInfo.endTime) === 0) {
			setProgressValue(0);
			return;
		}

		const now = Date.now();

		// For both 5-minute ponds and other ponds showing progress:
		// Calculate progress from 5 minutes before end time to end time
		const elapsed = now - startTimeRef.current;
		const remaining = Math.max(0, durationRef.current - elapsed);
		const progress = (remaining / durationRef.current) * 100;
		setProgressValue(Math.max(0, Math.min(100, progress)));
	};

	// Update end time when pond info changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (pondInfo) {
			// Reset refetch trigger when pond changes
			hasTriggeredRefetchRef.current = false;

			// Always use the contract's end time, even if it's 0
			updateEndTime();

			// Set up the progress bar calculation
			setupProgressBar();

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

	// Function to update the end time - always use contract's value
	const updateEndTime = () => {
		if (pondInfo?.endTime === undefined) return;

		// Convert from seconds (blockchain timestamp) to milliseconds (JS timestamp)
		// Use the contract's value directly, even if it's 0
		const endTimeMilliseconds = Number(pondInfo.endTime) * 1000;

		// Check if already completed
		const now = Date.now();
		const isEnded = endTimeMilliseconds === 0 || now > endTimeMilliseconds;

		setEndTimeMs(endTimeMilliseconds);
		setIsCompleted(isEnded);
	};

	// Handle completion
	const handleComplete = () => {
		setIsCompleted(true);
		setProgressValue(0);
		setShowProgressBar(false);

		// Trigger data refresh only once when timer completes
		if (!hasTriggeredRefetchRef.current) {
			hasTriggeredRefetchRef.current = true;
			// Small delay to ensure completion state is set
			setTimeout(() => {
				triggerDataRefresh();
			}, 500);
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
		// Always display time digits, even when completed
		// Format based on pond period
		let timeDisplay: JSX.Element;

		if (pondInfo?.period === PondPeriod.FIVE_MIN) {
			// For 5-minute ponds, show minutes and seconds
			timeDisplay = (
				<>
					<span className="flex w-8 justify-center rounded bg-primary-200/10 py-1 font-bold font-mono text-lg">
						{completed || Number(pondInfo.endTime) === 0
							? '00'
							: minutes.toString().padStart(2, '0')}
					</span>
					:
					<span className="flex w-8 justify-center rounded bg-primary-200/10 py-1 font-bold font-mono text-lg">
						{completed || Number(pondInfo.endTime) === 0
							? '00'
							: seconds.toString().padStart(2, '0')}
					</span>
				</>
			);
		} else if (pondInfo?.period === PondPeriod.HOURLY) {
			// For hourly ponds, focus on hours, minutes and seconds
			timeDisplay = (
				<>
					<span className="flex w-8 justify-center rounded bg-primary-200/10 py-1 font-bold font-mono text-lg">
						{completed || Number(pondInfo.endTime) === 0
							? '00'
							: hours.toString().padStart(2, '0')}
					</span>
					:
					<span className="flex w-8 justify-center rounded bg-primary-200/10 py-1 font-bold font-mono text-lg">
						{completed || Number(pondInfo.endTime) === 0
							? '00'
							: minutes.toString().padStart(2, '0')}
					</span>
					:
					<span className="flex w-8 justify-center rounded bg-primary-200/10 py-1 font-bold font-mono text-lg">
						{completed || Number(pondInfo.endTime) === 0
							? '00'
							: seconds.toString().padStart(2, '0')}
					</span>
				</>
			);
		} else {
			// For longer duration ponds (daily, weekly, monthly)
			timeDisplay = (
				<>
					<span className="flex w-8 justify-center rounded bg-primary-200/10 py-1 font-bold font-mono text-lg">
						{completed || Number(pondInfo.endTime) === 0
							? '00'
							: days.toString().padStart(2, '0')}
					</span>
					:
					<span className="flex w-8 justify-center rounded bg-primary-200/10 py-1 font-bold font-mono text-lg">
						{completed || Number(pondInfo.endTime) === 0
							? '00'
							: hours.toString().padStart(2, '0')}
					</span>
					:
					<span className="flex w-8 justify-center rounded bg-primary-200/10 py-1 font-bold font-mono text-lg">
						{completed || Number(pondInfo.endTime) === 0
							? '00'
							: minutes.toString().padStart(2, '0')}
					</span>
					:
					<span className="flex w-8 justify-center rounded bg-primary-200/10 py-1 font-bold font-mono text-lg">
						{completed || Number(pondInfo.endTime) === 0
							? '00'
							: seconds.toString().padStart(2, '0')}
					</span>
				</>
			);
		}

		// Show progress bar for 5-minute ponds or when any pond has 5 minutes or less
		return (
			<div
				className={cn(
					'flex w-full items-center justify-center gap-1.5 text-primary-200',
				)}
			>
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

	// Standard timer content - always show this regardless of the end time
	return (
		<div className={cn('font-mono text-sm')}>
			<Countdown
				ref={countdownRef}
				date={endTimeMs ?? 0}
				renderer={renderer}
				onComplete={handleComplete}
				key={`countdown-${endTimeMs}`}
			/>
		</div>
	);
}
