'use client';

import { useEffect } from 'react';
import getStandardPondTypes from '@/functions/useStandardPondTypes';
import { usePondStore } from '@/stores/pondStore';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useAnimationStore } from '@/stores/animationStore';

export default function StandardPonds() {
	const pondTypes = getStandardPondTypes();
	const { selectedPond, setSelectedPond } = usePondStore((state) => state);
	const { showRandom } = useAnimationStore(); // Import the showRandom animation

	// Set first pond as active on load
	useEffect(() => {
		if (!selectedPond && pondTypes.length > 0) {
			setSelectedPond(pondTypes[0].type);
		}
	}, [pondTypes, selectedPond, setSelectedPond]);

	// Daily pond is Tiny, Weekly is Small, Monthly is Big
	const pondNameMap: Record<string, string> = {
		Daily: 'Tiny',
		Weekly: 'Small',
		Monthly: 'Big',
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

	return (
		<div className="flex w-full items-center justify-start gap-2 rounded">
			{pondTypes.map((pond) => (
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
					{pond.name}
					{pondNameMap[pond.name as keyof typeof pondNameMap] && (
						<span className="font-normal text-primary-200 text-xs">
							{pondNameMap[pond.name as keyof typeof pondNameMap]} Pond
						</span>
					)}
				</Button>
			))}
		</div>
	);
}
