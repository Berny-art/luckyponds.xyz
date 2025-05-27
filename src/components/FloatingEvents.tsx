// components/FloatingEvents.tsx
'use client';

import { useAppStore } from '@/stores/appStore';
import FloatingEventBadge from './FloatingEventBadge';
import { useEffect } from 'react';
import type { PondComprehensiveInfo } from '@/lib/types';

interface FloatingEventsProps {
	pondInfo: PondComprehensiveInfo;
	className?: string;
}

/**
 * Component that shows only the floating event badges
 */
export default function FloatingEvents({
	pondInfo,
	className = '',
}: FloatingEventsProps) {
	// Get events from store
	const { events } = useAppStore();

	return (
		<div
			className={`pointer-events-none fixed inset-0 z-40 overflow-hidden ${className}`}
		>
			{events.map((event) => (
				<FloatingEventBadge
					key={event.id}
					event={event}
					minTossAmount={pondInfo.minTossPrice}
				/>
			))}
		</div>
	);
}
