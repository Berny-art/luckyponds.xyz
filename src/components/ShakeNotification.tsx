// components/ShakeNotification.tsx
'use client';

import { formatAddress } from '@/lib/utils';
import { useEventsStore } from '@/stores/eventsStore';
import { useEffect, useState } from 'react';
import type { PondComprehensiveInfo } from '@/lib/types';

// Define the shifting gradient animation CSS with variables for customization
const gradientAnimation = `
@keyframes shiftGradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.animate-gradient {
  background: linear-gradient(60deg, 
    var(--color-1) 0%, 
    var(--color-2) 25%, 
    var(--color-3) 50%,
    var(--color-4) 75%,
    var(--color-1) 100%
  );
  background-size: 300% 300%;
  animation: shiftGradient var(--animation-duration, 5s) ease infinite;
}
`;

interface ShakeNotificationProps {
	pondInfo: PondComprehensiveInfo;
	position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
	className?: string;
	animationSpeed?: 'slow' | 'medium' | 'fast';
}

/**
 * Component that shows a shake notification with an animated shifting gradient
 * More customizable with speed options
 */
export default function ShakeNotification({
	pondInfo,
	position = 'top-left',
	className = '',
	animationSpeed = 'medium',
}: ShakeNotificationProps) {
	// Get latest event from store
	const { latestEvent, setPondInfo } = useEventsStore();
	// Track the event ID to force re-renders for shake animation
	const [eventKey, setEventKey] = useState('');

	// Update pond info in store
	useEffect(() => {
		setPondInfo(pondInfo);
	}, [pondInfo, setPondInfo]);

	// Update the key whenever latestEvent changes to trigger animation
	useEffect(() => {
		if (latestEvent && latestEvent.id !== eventKey) {
			setEventKey(latestEvent.id);
		}
	}, [latestEvent, eventKey]);

	// Map position to Tailwind classes
	const positionClasses = {
		'top-left': 'top-0 left-0',
		'top-right': 'top-0 right-0',
		'bottom-left': 'bottom-0 left-0',
		'bottom-right': 'bottom-0 right-0',
	};

	// Map animation speed to duration
	const animationDuration = {
		slow: '8s',
		medium: '5s',
		fast: '3s',
	};

	// Only render if we have a latest event
	if (!latestEvent) return null;

	return (
		<div
			key={eventKey} // Add key here to force remount and restart animation
			className={`!-left-16 absolute z-40 animate-[shake_1s_ease-in-out] ${positionClasses[position]} ${className}`}
		>
			{/* Include the gradient animation CSS */}
			<style>{gradientAnimation}</style>

			{/* Animated gradient background with CSS variables */}
			<div
				className="animate-gradient rounded-md border-2 border-drip-300 p-[2px] pl-12"
				style={
					{
						'--color-1': 'rgba(242, 231, 24, .7)',
						'--color-2': 'rgba(128, 232, 169, .7)',
						'--color-3': 'rgba(147, 83, 237, .7)',
						'--color-4': 'rgba(237, 83, 83, .7)',
						'--animation-duration': animationDuration[animationSpeed],
					} as React.CSSProperties
				}
			>
				{/* Content */}
				<div className="flex items-center gap-1 rounded-[4px] p-2 backdrop-blur-sm">
					<span className="font-bold font-mono text-drip-300 text-xs">
						{formatAddress(latestEvent.address)}
					</span>
					<span className="font-bold font-mono text-white text-xs">Tossed</span>
					<span className="font-bold font-mono text-primary-200 text-xs">
						{latestEvent.amount} HYPE
					</span>
				</div>
			</div>
		</div>
	);
}
