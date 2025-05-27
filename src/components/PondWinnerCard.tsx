'use client';

import { useState, useEffect } from 'react';
import { cn, formatAddress } from '@/lib/utils';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { PondPeriod } from '@/lib/types';

interface PondWinnerCardProps {
	title: string;
	amount: string;
	winner: string;
	hasWinner: boolean;
	period: PondPeriod;
}

export default function PondWinnerCard({
	title,
	amount,
	winner,
	hasWinner,
	period,
}: PondWinnerCardProps) {
	const [open, setOpen] = useState(false);
	const tweetText = encodeURIComponent(
		`I Just Won ${amount} HYPE Playing Lucky Ponds on`,
	);
	const tweetUrl = encodeURIComponent('https://luckyponds.xyz');

	// Fire confetti when dialog opens
	useEffect(() => {
		if (open && hasWinner) {
			triggerEmojiConfetti();
		}
	}, [open, hasWinner]); // eslint-disable-line react-hooks/exhaustive-deps

	// Get themed emoji based on period
	const getThemedEmoji = () => {
		switch (period) {
			case PondPeriod.FIVE_MIN:
				return '⚡'; // Lightning for fast 5-min ponds
			case PondPeriod.HOURLY:
				return '⏱️'; // Clock for hourly ponds
			case PondPeriod.DAILY:
				return '🌟'; // Star for daily
			case PondPeriod.WEEKLY:
				return '💧'; // Water drop for weekly
			case PondPeriod.MONTHLY:
				return '💜'; // Heart for monthly
			default:
				return '💎';
		}
	};

	// Get button color based on period
	const getButtonColor = () => {
		switch (period) {
			case PondPeriod.FIVE_MIN:
				return 'bg-primary-200 hover:bg-primary-200/80 border-primary-200';
			case PondPeriod.HOURLY:
				return 'bg-blue-400 hover:bg-blue-400/80 border-blue-400';
			case PondPeriod.DAILY:
				return 'bg-orange-400 hover:bg-orange-400/80 border-orange-400';
			case PondPeriod.WEEKLY:
				return 'bg-drip-300 hover:bg-drip-300/80 border-drip-300';
			case PondPeriod.MONTHLY:
				return 'bg-purple-500 hover:bg-purple-500/80 border-purple-500';
			default:
				return 'bg-primary-200 hover:bg-primary-200/80 border-primary-200';
		}
	};

	// Get card background and border color based on period
	const getCardColor = () => {
		switch (period) {
			case PondPeriod.FIVE_MIN:
				return 'bg-primary-200/10 border-primary-200';
			case PondPeriod.HOURLY:
				return 'bg-blue-400/10 border-blue-400';
			case PondPeriod.DAILY:
				return 'bg-orange-400/10 border-orange-400';
			case PondPeriod.WEEKLY:
				return 'bg-drip-300/10 border-drip-300';
			case PondPeriod.MONTHLY:
				return 'bg-purple-500/10 border-purple-500';
			default:
				return 'bg-primary-200/10 border-primary-200';
		}
	};

	// Get text color based on period
	const getTextColor = () => {
		switch (period) {
			case PondPeriod.FIVE_MIN:
				return 'text-primary-200';
			case PondPeriod.HOURLY:
				return 'text-blue-400';
			case PondPeriod.DAILY:
				return 'text-orange-400';
			case PondPeriod.WEEKLY:
				return 'text-drip-300';
			case PondPeriod.MONTHLY:
				return 'text-purple-500';
			default:
				return 'text-primary-200';
		}
	};

	// Fire confetti when dialog opens
	useEffect(() => {
		if (open && hasWinner) {
			triggerEmojiConfetti();
		}
	}, [open, hasWinner]); // eslint-disable-line react-hooks/exhaustive-deps

	// Simplified emoji confetti effect with a single high-intensity burst
	const triggerEmojiConfetti = () => {
		// Create a variety of emoji shapes with a consistent scale
		const scalar = 2;

		// Create a good variety of themed emojis
		const frogs = confetti.shapeFromText({ text: '🐸', scalar });
		const money = confetti.shapeFromText({ text: '💰', scalar });
		const trophy = confetti.shapeFromText({ text: '🏆', scalar });
		const celebration = confetti.shapeFromText({ text: '🎉', scalar });
		const party = confetti.shapeFromText({ text: '🥳', scalar });

		// Add themed emoji based on period
		const specialEmoji = confetti.shapeFromText({
			text: getThemedEmoji(),
			scalar,
		});

		// Common settings for the burst
		const defaults = {
			spread: 360, // Full 360° spread for an omnidirectional burst
			ticks: 120, // Longer-lasting particles
			gravity: 0.2, // Lower gravity for slower falling
			decay: 0.92, // Slower decay so particles last longer
			startVelocity: 30, // Good initial velocity
			scalar,
			zIndex: 2000,
			disableForReducedMotion: true,
			origin: { x: 0.5, y: 0.5 }, // Center of the screen
		};

		// Main emoji burst
		confetti({
			...defaults,
			particleCount: 25, // Primary emoji count
			shapes: [frogs, specialEmoji, celebration],
		});

		// Smaller burst of flat particles
		confetti({
			...defaults,
			particleCount: 10, // Fewer particles for secondary burst
			shapes: [money, trophy],
			flat: true,
			ticks: 110,
		});

		// Small circles and party emojis for contrast
		confetti({
			...defaults,
			particleCount: 15,
			shapes: ['circle', party],
			scalar: scalar / 1.5,
			startVelocity: 25,
			ticks: 90,
		});

		// Add side bursts for dramatic effect
		setTimeout(() => {
			// Left side burst
			confetti({
				particleCount: 8,
				angle: 60,
				spread: 50,
				origin: { x: 0, y: 0.65 },
				shapes: [specialEmoji, celebration],
				scalar,
				startVelocity: 25,
				gravity: 0.3,
				drift: 2,
				ticks: 100,
			});

			// Right side burst
			confetti({
				particleCount: 8,
				angle: 120,
				spread: 50,
				origin: { x: 1, y: 0.65 },
				shapes: [trophy, party],
				scalar,
				startVelocity: 25,
				gravity: 0.3,
				drift: -2,
				ticks: 100,
			});
		}, 200);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger className="w-full">
				<div
					className={cn(
						'flex w-full flex-col items-start justify-center rounded border px-4 py-2 text-primary-200',
						getCardColor(),
					)}
				>
					<div className="font-mono">{title}</div>
					<div className={cn('font-bold font-mono text-xl', getTextColor())}>
						{amount} HYPE
					</div>
					<div className="font-mono text-sm opacity-70">{winner}</div>
				</div>
			</DialogTrigger>

			{hasWinner && (
				<DialogContent
					className={cn(
						'flex flex-col items-center justify-center gap-4 border-2 p-6 text-center font-mono text-secondary-200',
						getCardColor(),
					)}
				>
					<DialogHeader>
						<DialogTitle className="text-center">
							{/* biome-ignore lint/nursery/useSortedClasses: <explanation> */}
							<span className="text-xl font-bold">{title}</span>
						</DialogTitle>
					</DialogHeader>
					<p className="text">🎉 {formatAddress(winner)} 🎉</p>
					<p className={cn('text-5xl', getTextColor())}>{amount} HYPE</p>
					<Link
						href={`https://x.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`}
						target="_blank"
					>
						<Button
							variant="default"
							className={cn(
								'border-2 font-bold font-mono text-secondary-950 shadow-none',
								getButtonColor(),
							)}
						>
							Share on X
						</Button>
					</Link>
				</DialogContent>
			)}
		</Dialog>
	);
}
