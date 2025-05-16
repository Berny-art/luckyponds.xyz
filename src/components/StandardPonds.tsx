// src/components/StandardPonds.tsx
'use client';

import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useAnimationStore } from '@/stores/animationStore';
import { PondPeriod } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { usePondStore, type EnhancedPond } from '@/stores/pondStore';
import { useState, useEffect } from 'react';

interface StandardPondsProps {
	pondTypes: EnhancedPond[];
	isLoading: boolean;
	selectedPond: string | null;
	onPondSelect: (pondType: string) => void;
}

export default function StandardPonds({
	pondTypes,
	isLoading,
	selectedPond,
	onPondSelect,
}: StandardPondsProps) {
	const { showRandom } = useAnimationStore();
	const { lightningMode } = usePondStore();
	const [displayPonds, setDisplayPonds] = useState<EnhancedPond[]>([]);

	// Update display ponds when pond types change
	useEffect(() => {
		// Only show ponds that have data
		const validPonds = pondTypes.filter(
			(pond) => pond?.type && pond.exists !== false,
		);
		setDisplayPonds(validPonds);

		// If we have ponds but no selection, select the first one
		if (validPonds.length > 0 && !selectedPond) {
			onPondSelect(validPonds[0].type);
		}
	}, [pondTypes, selectedPond, onPondSelect]);

	// Enhanced pond name mapping with descriptions
	const getPondDescription = (period: PondPeriod): string => {
		switch (period) {
			case PondPeriod.FIVE_MIN:
				return 'Fast draw';
			case PondPeriod.HOURLY:
				return 'Quick draw';
			case PondPeriod.DAILY:
				return 'Pick';
			case PondPeriod.WEEKLY:
				return 'Draw';
			case PondPeriod.MONTHLY:
				return 'Lucky';
			default:
				return 'Custom';
		}
	};

	// Handle pond selection with animation
	const handlePondSelect = (pondType: string, e: React.MouseEvent) => {
		// Only trigger animation and selection if it's not already selected
		if (selectedPond !== pondType) {
			// Get click coordinates
			const x = e.clientX;
			const y = e.clientY;

			if (x && y) {
				// Trigger animation at click position
				showRandom({ x, y });
			}

			// Set the selected pond
			onPondSelect(pondType);
		}
	};

	// Loading state - show placeholders
	if (isLoading) {
		return (
			<div className="flex w-full items-center justify-start gap-2 rounded">
				{[1, 2, 3].map((i) => (
					<Skeleton
						key={i}
						className="h-16 w-full rounded-md bg-primary-200/5"
					/>
				))}
			</div>
		);
	}

	// No data state
	if (!displayPonds || displayPonds.length === 0) {
		return (
			<div className="flex w-full items-center justify-center p-4 text-primary-200/50">
				No active ponds available
			</div>
		);
	}
	// lightningMode
	const visiblePonds = !lightningMode
		? displayPonds.filter((pond) =>
				[PondPeriod.DAILY, PondPeriod.WEEKLY, PondPeriod.MONTHLY].includes(
					pond.period,
				),
			)
		: displayPonds.filter(
				(pond) =>
					![PondPeriod.DAILY, PondPeriod.WEEKLY, PondPeriod.MONTHLY].includes(
						pond.period,
					),
			);

	return (
		<div className="flex w-full items-center justify-start gap-2 rounded">
			{visiblePonds.map((pond) => (
				<Button
					key={pond.type}
					onClick={(e) => handlePondSelect(pond.type, e)}
					className={cn(
						'flex size-full flex-col items-center justify-center gap-0 border-2 font-bold font-mono text-lg text-primary-200 hover:bg-primary-200/10',
						selectedPond === pond.type
							? 'border-drip-300 bg-drip-300/10'
							: 'border-primary-200 bg-transparent',
					)}
				>
					{pond.displayName}
					<span className="font-normal text-primary-200 text-xs">
						{getPondDescription(pond.period)}
					</span>
				</Button>
			))}
		</div>
	);
}
