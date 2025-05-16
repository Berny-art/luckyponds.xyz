'use client';

import { useState, useEffect, useRef } from 'react';
import { Progress } from './ui/progress';
import { PondPeriod } from '@/lib/types';
import type { PondComprehensiveInfo } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PondProgressBarProps {
	pondInfo: PondComprehensiveInfo;
	className?: string;
}

export default function PondProgressBar({
	pondInfo,
	className,
}: PondProgressBarProps) {
	// State for progress value (0-100)
	const [progress, setProgress] = useState(100);
	// Keep track of start time to calculate progress
	const startTimeRef = useRef<number>(Date.now());
	// Duration in milliseconds
	const durationRef = useRef<number>(5 * 60 * 1000); // 5 minutes
	// Interval reference
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	// Initialize or reset the progress bar when pond info changes
	useEffect(() => {
		// Only show for 5-minute ponds
		if (pondInfo.period !== PondPeriod.FIVE_MIN) {
			return;
		}

		// Set up the progress calculation
		const setupProgress = () => {
			const now = Date.now();

			// If we have a valid end time, use it to calculate total duration
			if (
				pondInfo.endTime &&
				Number(pondInfo.endTime) > Math.floor(now / 1000)
			) {
				const endTimeMs = Number(pondInfo.endTime) * 1000;
				const startTimeMs = endTimeMs - 5 * 60 * 1000; // 5 minutes before end

				startTimeRef.current = startTimeMs;
				durationRef.current = 5 * 60 * 1000; // 5 minutes
			} else {
				// If no valid end time, use default 5 minutes starting from now
				startTimeRef.current = now;
				durationRef.current = 5 * 60 * 1000; // 5 minutes
			}

			// Update progress immediately
			updateProgress();

			// Set interval to update progress
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}

			intervalRef.current = setInterval(updateProgress, 1000);
		};

		setupProgress();

		// Clean up interval when component unmounts or pond changes
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [pondInfo]);

	// Function to update progress based on elapsed time
	const updateProgress = () => {
		const now = Date.now();
		const elapsed = now - startTimeRef.current;
		const remaining = Math.max(0, durationRef.current - elapsed);
		const progressValue = (remaining / durationRef.current) * 100;

		setProgress(progressValue);

		// If progress is complete, stop the interval
		if (progressValue <= 0) {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		}
	};

	// Only render for 5-minute ponds
	if (pondInfo.period !== PondPeriod.FIVE_MIN) {
		return null;
	}

	return (
		<div className={cn('w-full space-y-2', className)}>
			<div className="flex justify-between">
				<span className="font-medium text-primary-200 text-sm">
					5-Minute Pond Progress
				</span>
				<span className="font-medium text-primary-200 text-sm">
					{Math.round(progress)}%
				</span>
			</div>
			<Progress value={progress} className="h-2 bg-primary-200/10" />
			{/* Custom indicator with different color based on progress */}
			<div
				className={cn(
					'h-2 transition-all',
					progress > 66
						? 'bg-green-400'
						: progress > 33
							? 'bg-yellow-400'
							: 'bg-red-400',
				)}
				style={{
					width: `${progress}%`,
					marginTop: '-8px',
					borderRadius: '9999px',
				}}
			/>
		</div>
	);
}
