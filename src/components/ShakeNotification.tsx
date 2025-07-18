// components/ShakeNotification.tsx
'use client';

import { formatAddress, formatValue } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import { useEffect, useState, memo } from 'react';

interface ShakeNotificationProps {
	className?: string;
}

function ShakeNotification({
	className = '',
}: ShakeNotificationProps) {
	// Get latest event from store
	const { latestEvent, selectedToken } = useAppStore();
	// Track the event ID to force re-renders for shake animation
	const [eventKey, setEventKey] = useState('');

	// Update the key whenever latestEvent changes to trigger animation
	useEffect(() => {
		if (latestEvent && latestEvent.id !== eventKey) {
			setEventKey(latestEvent.id);
		}
	}, [latestEvent?.id, eventKey, latestEvent]); // Only depend on the ID, not the entire event object

	return (
		<div
			key={eventKey} // Add key here to force remount and restart animation
			className={`animate-[shake_1s_ease-in-out] ${className}`}
		>
			{/* Animated gradient background with CSS variables */}
			<div className="animate-gradient rounded-md border-2 border-drip-300 bg-[linear-gradient(90deg,#F2E718_0%,#80E8A9_20%,#9353ED_50%,#ED5353_75%,#EDA553_100%)] pl-12">
				{/* Content */}
				<div className="flex min-w-48 items-center gap-1 rounded-[4px] p-3 backdrop-blur-sm uppercase">
					<span className="font-bold font-mono text-drip-300 text-xs">
						{latestEvent
							? formatAddress(latestEvent.address)
							: 'Awaiting tosses'}
					</span>
					<span className="font-bold font-mono text-white text-xs">
						{latestEvent ? 'tossed' : ''}
					</span>
					<span className="font-bold font-mono text-primary-200 text-xs">
						{latestEvent ? `${formatValue(latestEvent.amount, selectedToken?.decimals)} ${selectedToken?.symbol || 'HYPE'}` : '...'}
					</span>
				</div>
			</div>
		</div>
	);
}

// Memoize to prevent unnecessary re-renders
export default memo(ShakeNotification);
