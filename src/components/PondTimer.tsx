'use client';

import { useState, useEffect } from 'react';
import Countdown from 'react-countdown';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PondComprehensiveInfo } from '@/lib/types';

export default function PondTimer({
	pondInfo,
}: { pondInfo: PondComprehensiveInfo }) {
	// State to track end time in milliseconds
	const [endTimeMs, setEndTimeMs] = useState<number | null>(null);

	// State to know if time has ended
	const [isCompleted, setIsCompleted] = useState(false);

	// Update end time when pond info changes
	useEffect(() => {
		if (pondInfo?.endTime) {
			// Convert from seconds (blockchain timestamp) to milliseconds (JS timestamp)
			const endTimeMilliseconds = Number(pondInfo.endTime) * 1000;
			setEndTimeMs(endTimeMilliseconds);

			// Check if already completed
			setIsCompleted(Date.now() > endTimeMilliseconds);
		}
	}, [pondInfo]);

	// Handle completion
	const handleComplete = () => {
		setIsCompleted(true);
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
		if (completed) {
			return (
				<div className="flex items-center gap-1.5">
					<span className="font-mono">Draw pending...</span>
				</div>
			);
		}

		return (
			<div className="-ml-4 flex items-center gap-1.5 text-primary-200">
				<Clock className="mr-2 size-8" />
				<span className="flex w-8 justify-center rounded bg-primary-200/10 py-1 font-bold font-mono text-lg">
					{days}
				</span>
				:
				<span className="flex w-8 justify-center rounded bg-primary-200/10 py-1 font-bold font-mono text-lg">
					{hours}
				</span>
				:
				<span className="flex w-8 justify-center rounded bg-primary-200/10 py-1 font-bold font-mono text-lg">
					{minutes}
				</span>
				:
				<span className="flex w-8 justify-center rounded bg-primary-200/10 py-1 font-bold font-mono text-lg">
					{seconds}
				</span>
			</div>
		);
	};

	// If no end time is available yet
	if (!endTimeMs) {
		return (
			<div className={cn('flex items-center gap-1.5 opacity-70')}>
				<Clock className="h-4 w-4" />
				<span className="font-mono">Loading time...</span>
			</div>
		);
	}

	return (
		<div className={cn('font-mono text-sm')}>
			<Countdown
				date={endTimeMs}
				renderer={renderer}
				onComplete={handleComplete}
			/>
		</div>
	);
}
