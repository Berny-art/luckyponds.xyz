'use client';

import { useState, useEffect, useRef } from 'react';
import { Badge } from './ui/badge';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';

export default function FloatingAnimationRenderer() {
	const {
		isAnimationVisible: isVisible,
		animationPosition: position,
		animationText: text,
		animationTimestamp: timestamp,
		hideAnimation,
	} = useAppStore();

	// Use a ref to track animation timers for cleanup
	const animationTimers = useRef<{
		animate?: NodeJS.Timeout;
		hide?: NodeJS.Timeout;
	}>({});

	const [animationState, setAnimationState] = useState({
		isActive: false,
		styles: {
			left: 0,
			top: 0,
			opacity: 0,
		},
	});

	// Clear all existing timers to prevent race conditions
	const clearAllTimers = () => {
		if (animationTimers.current.animate) {
			clearTimeout(animationTimers.current.animate);
			animationTimers.current.animate = undefined;
		}
		if (animationTimers.current.hide) {
			clearTimeout(animationTimers.current.hide);
			animationTimers.current.hide = undefined;
		}
	};

	// Handle animation lifecycle
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		// Only proceed if we have valid position and text
		if (isVisible && position && position.x && position.y && text) {
			// Clean up first to avoid multiple animations running
			clearAllTimers();

			// Immediately reset to starting position with full opacity
			setAnimationState({
				isActive: true,
				styles: {
					left: position.x,
					top: position.y,
					opacity: 1, // Start fully visible immediately
				},
			});

			// Force a repaint before starting the float animation
			requestAnimationFrame(() => {
				// Start float animation after a brief delay
				animationTimers.current.animate = setTimeout(() => {
					setAnimationState((prev) => ({
						...prev,
						styles: {
							left: position.x + (Math.random() * 40 - 20), // Random horizontal drift
							top: position.y - 80, // Float up
							opacity: 0, // Fade out as it floats up
						},
					}));

					// Hide the animation in the store after it completes
					animationTimers.current.hide = setTimeout(() => {
						hideAnimation();
					}, 1000); // Make the hide timeout slightly longer than transition
				}, 100); // Slight delay to ensure DOM is ready
			});
		} else if (!isVisible) {
			// Reset the animation state when not visible
			setAnimationState({
				isActive: false,
				styles: {
					left: 0,
					top: 0,
					opacity: 0,
				},
			});
		}

		// Clean up on unmount
		return () => {
			clearAllTimers();
		};
	}, [isVisible, position, text, hideAnimation, timestamp]); // Include timestamp in dependencies

	// Don't render if no active animation or missing essential props
	if (!animationState.isActive || !text) return null;

	// Get a random gradient class from available options
	const getGradientClass = () => {
		const gradients = [
			'bg-gradient-to-r from-drip-300 to-drip-600',
			'bg-gradient-to-r from-secondary-600 to-secondary-400',
			'bg-gradient-to-r from-purple-600 to-purple-400',
			'bg-gradient-to-r from-orange-300 to-orange-600',
			'bg-gradient-to-r from-blue-300 to-blue-600',
			'bg-gradient-to-r from-green-600 to-green-300',
		];
		
		return gradients[Math.floor(Math.random() * gradients.length)];
	};

	return (
		<div
			className="pointer-events-none fixed inset-0 z-50"
			style={{ overflow: 'visible' }}
		>
			<div
				className="pointer-events-none absolute"
				style={{
					left: `${animationState.styles.left}px`,
					top: `${animationState.styles.top}px`,
					opacity: animationState.styles.opacity,
					transition: 'all 1.8s ease-out',
					transform: 'translate(-50%, -50%)', // Center badge on cursor
				}}
			>
				<Badge
					variant={'secondary'}
					className={cn(
						getGradientClass(),
						'text-primary-foreground',
						'px-4 py-1 font-bold uppercase shadow-md',
					)}
				>
					{text}
				</Badge>
			</div>
		</div>
	);
}
