'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect, useRef, type JSX } from 'react';
import Countdown from 'react-countdown';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PondComprehensiveInfo } from '@/lib/types';
import { PondPeriod } from '@/lib/types';
import { Progress } from './ui/progress';

export default function PondTimer({
	pondInfo,
}: { pondInfo: PondComprehensiveInfo }) {
	// State to track end time in milliseconds
	const [endTimeMs, setEndTimeMs] = useState<number | null>(null);

	// State to know if time has ended
	const [isCompleted, setIsCompleted] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars

	// State for progress bar (0-100)
	const [progressValue, setProgressValue] = useState(100);

	// Reference to the countdown component for manual updates
	const countdownRef = useRef<Countdown>(null);

	// Interval reference for short-duration ponds
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	// Duration reference for progress calculation
	const durationRef = useRef<number>(0);
	const startTimeRef = useRef<number>(0);

	// Set up progress bar for 5-minute ponds
	const setupProgressBar = () => {
		// For 5-minute ponds, we'll calculate progress based on total duration (5 minutes)
		const fiveMinutesMs = 5 * 60 * 1000;

		// If we have a valid end time, use it to calculate start time
		if (pondInfo.endTime && Number(pondInfo.endTime) > 0) {
			const endTimeSeconds = Number(pondInfo.endTime);
			const endTimeMilliseconds = endTimeSeconds * 1000;

			// Start time is 5 minutes before end time
			startTimeRef.current = endTimeMilliseconds - fiveMinutesMs;
			durationRef.current = fiveMinutesMs;
		} else {
			// If end time is 0, progress is 100% (full)
			startTimeRef.current = Date.now();
			durationRef.current = fiveMinutesMs;
			setProgressValue(100);
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

		// More frequent updates for short-duration ponds
		const updateFrequency =
			pondInfo.period === PondPeriod.FIVE_MIN ? 250 : 1000;

		// Set interval for updates
		intervalRef.current = setInterval(() => {
			// Update progress for 5-minute ponds
			if (pondInfo.period === PondPeriod.FIVE_MIN) {
				updateProgress();
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

		// If end time is 0, progress is 0
		if (Number(pondInfo.endTime) === 0) {
			setProgressValue(0);
			return;
		}

		const now = Date.now();
		const elapsed = now - startTimeRef.current;
		const remaining = Math.max(0, durationRef.current - elapsed);
		const progress = (remaining / durationRef.current) * 100;

		setProgressValue(progress);
	};

	// Update end time when pond info changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (pondInfo) {
			// Always use the contract's end time, even if it's 0
			updateEndTime();

			// For 5-minute ponds, set up the progress bar calculation
			if (pondInfo.period === PondPeriod.FIVE_MIN) {
				setupProgressBar();
			}

			// Set up update interval based on pond period
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

		// For 5-minute ponds, include the progress bar next to the timer
		return (
			<div
				className={cn(
					pondInfo.period === PondPeriod.FIVE_MIN ? '' : '-ml-4',
					'flex w-full items-center justify-center gap-1.5 text-primary-200',
				)}
			>
				<Clock className="mr-2 size-8" />
				<div className="flex items-center justify-center gap-1.5">
					{timeDisplay}
				</div>

				{pondInfo.period === PondPeriod.FIVE_MIN && (
					<Progress
						value={progressValue}
						className="ml-4 h-3 w-full animate-gradient bg-[linear-gradient(90deg,#F2E718_0%,#80E8A9_20%,#9353ED_50%,#ED5353_75%,#EDA553_100%)]"
					/>
				)}
			</div>
		);
	};

	// If no pond info is available
	if (!pondInfo) {
		return (
			<div className={cn('flex items-center gap-1.5 opacity-70')}>
				<Clock className="h-4 w-4" />
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
