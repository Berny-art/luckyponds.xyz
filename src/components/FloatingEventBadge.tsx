// components/FloatingEventBadge.tsx
'use client';

import { formatAddress, formatValue } from '@/lib/utils';
import {
	OneCoin,
	TwoCoins,
	ThreeCoins,
	FourCoins,
	FiveCoins,
	MultipleCoins,
} from './elements/CoinIcons';
import { Badge } from './ui/badge';
import { formatEther } from 'ethers';
import { useEffect, useState, useRef } from 'react';
import type { ContractEvent } from '@/stores/eventsStore';
import { useEnsName } from 'wagmi';

function getCoinIcon(multiplier: number) {
	if (multiplier >= 6) return <MultipleCoins />;
	if (multiplier >= 5) return <FiveCoins />;
	if (multiplier >= 4) return <FourCoins />;
	if (multiplier >= 3) return <ThreeCoins />;
	if (multiplier >= 2) return <TwoCoins />;
	return <OneCoin />;
}

// Add position to the event type if it doesn't exist in the store
interface FloatingEventBadgeProps {
	event: ContractEvent & {
		position?: {
			left: string;
		};
	};
	minTossAmount: bigint;
}

function FloatingEventBadge({ event, minTossAmount }: FloatingEventBadgeProps) {
	// If the event doesn't have a position, generate one
	const eventWithPosition = {
		...event,
		position: event.position || {
			left: `${Math.floor(Math.random() * 80) + 10}%`, // Random position between 10-90%
		},
	};

	const user = useEnsName({
		address: event.address as `0x${string}`,
	});

	// Create a more balanced randomization that evenly distributes left and right
	const randomHorizontalOffset = Math.floor(Math.random() * 120) - 60; // Range: -60 to +60

	// Use ref to track if animation has been applied
	const animationApplied = useRef(false);

	// Set initial state without transition to prevent visible "snap"
	const [style, setStyle] = useState({
		left: eventWithPosition.position.left,
		top: '75%',
		opacity: 1,
		transform: 'translateX(0)',
		transition: 'none', // Start with no transition
	});

	// Immediately schedule the animation frame to apply transition
	useEffect(() => {
		if (animationApplied.current) return;

		// Use requestAnimationFrame to apply transition on next paint
		// This prevents the delay while ensuring smooth animation
		requestAnimationFrame(() => {
			// First, add the transition property
			setStyle((prev) => ({
				...prev,
				transition: 'all 8s ease-out',
			}));

			// Then immediately schedule the actual position change for the next frame
			requestAnimationFrame(() => {
				setStyle((prev) => ({
					...prev,
					left: `calc(${eventWithPosition.position.left} + ${randomHorizontalOffset}px)`,
					top: '120%',
					opacity: 0,
					transform: `translateX(${randomHorizontalOffset}px)`,
				}));

				animationApplied.current = true;
			});
		});

		// No cleanup needed here
	}, [eventWithPosition.position.left, randomHorizontalOffset]);

	// Parse event amount to calculate multiplier
	const eventAmount = Number.parseFloat(event.amount);
	const minAmount = Number.parseFloat(formatEther(minTossAmount));
	const multiplier = eventAmount / minAmount;

	const coinIcon = getCoinIcon(multiplier);

	return (
		<div
			className="pointer-events-none absolute z-50"
			style={{
				left: style.left,
				top: style.top,
				opacity: style.opacity,
				transform: style.transform,
				transition: style.transition,
			}}
		>
			<div className="flex items-center space-x-2">
				{coinIcon}
				<Badge
					variant="default"
					className="flex items-center gap-2 bg-primary-200/30 text-primary-200 text-xs"
				>
					<span className="text-nowrap font-bold">
						{formatValue(event.amount)} HYPE
					</span>
					<span className="text-nowrap font-bold">/</span>
					<span className="text-nowrap font-mono">
						{formatAddress(event.address)}
					</span>
				</Badge>
			</div>
		</div>
	);
}

export default FloatingEventBadge;
