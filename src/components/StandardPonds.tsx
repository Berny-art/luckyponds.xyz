'use client';

import { useEffect } from 'react';
import { usePondStore } from '@/stores/pondStore';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useAnimationStore } from '@/stores/animationStore';
import { PondPeriod } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import useStandardPondsForUI from '@/hooks/useStandardPondsForUI';

export default function StandardPonds() {
	// Use our custom hook to get pond types
	const { data: pondTypes, isLoading } = useStandardPondsForUI();
	const { selectedPond, setSelectedPond } = usePondStore((state) => state);
	const { showRandom } = useAnimationStore();

	// Set first pond as active on load
	useEffect(() => {
		if (!selectedPond && pondTypes && pondTypes.length > 0) {
			setSelectedPond(pondTypes[0].type);
		}
	}, [pondTypes, selectedPond, setSelectedPond]);

	// Enhanced pond name mapping with descriptions
	const getPondDescription = (period: PondPeriod): string => {
		switch (period) {
			case PondPeriod.FIVE_MIN:
				return 'Quick Pond';
			case PondPeriod.HOURLY:
				return 'Fast Pond';
			case PondPeriod.DAILY:
				return 'Tiny Pond';
			case PondPeriod.WEEKLY:
				return 'Small Pond';
			case PondPeriod.MONTHLY:
				return 'Big Pond';
			default:
				return 'Custom Pond';
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
			setSelectedPond(pondType);
		}
	};

	// Loading state
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

	// Filter to show only Daily, Weekly, and Monthly ponds on smaller screens
	// Can be adjusted based on screen size if needed
	const displayPonds =
		pondTypes?.filter((pond) =>
			[PondPeriod.DAILY, PondPeriod.WEEKLY, PondPeriod.MONTHLY].includes(
				pond.period,
			),
		) || [];

	return (
		<div className="flex w-full items-center justify-start gap-2 rounded">
			{displayPonds.map((pond) => (
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
