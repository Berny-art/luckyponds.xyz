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

interface PondWinnerCardProps {
	title: string;
	amount: string;
	winner: string;
	colorClass: string;
	hasWinner: boolean;
}

export default function PondWinnerCard({
	title,
	amount,
	winner,
	colorClass,
	hasWinner,
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

		// Add themed emojis based on pond type
		// biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
		let specialEmoji;

		if (colorClass.includes('primary-200')) {
			specialEmoji = confetti.shapeFromText({ text: '💧', scalar }); // Water-themed
		} else if (colorClass.includes('orange')) {
			specialEmoji = confetti.shapeFromText({ text: '🌟', scalar }); // Star-themed
		} else {
			specialEmoji = confetti.shapeFromText({ text: '💜', scalar }); // Heart-themed
		}

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

	// Determine dialog styling based on colorClass
	const getDialogClasses = () => {
		// Default base classes
		const baseClasses =
			'border-2 text-center font-mono text-secondary-200 flex flex-col items-center justify-center gap-4 p-6';

		if (colorClass.includes('primary')) {
			return cn(baseClasses, 'border-primary-200 bg-primary-200/10');
		}
		if (colorClass.includes('orange')) {
			return cn(baseClasses, 'border-orange-500 bg-orange-500/10');
		}
		if (colorClass.includes('drip')) {
			return cn(baseClasses, 'border-drip-300 bg-drip-300/10');
		}
		return cn(baseClasses, 'border-primary-200 bg-primary-200/10');
	};

	// Determine button styling based on colorClass
	const getButtonClasses = () => {
		const baseClasses = 'font-bold font-mono text-secondary-950 shadow-none';

		if (colorClass.includes('primary-200')) {
			return cn(baseClasses, 'bg-primary-200 hover:bg-primary-200/80');
		}
		if (
			colorClass.includes('orange-500') ||
			colorClass.includes('orange-300')
		) {
			return cn(baseClasses, 'bg-orange-500 hover:bg-orange-500/80');
		}
		if (colorClass.includes('drip-300')) {
			return cn(baseClasses, 'bg-drip-300 hover:bg-drip-300/80');
		}
		return cn(baseClasses, 'bg-primary-200 hover:bg-primary-200/80');
	};

	// Determine heading text color
	const getTextColorClass = () => {
		if (colorClass.includes('primary-200')) {
			return 'text-primary-200';
		}
		if (
			colorClass.includes('orange-500') ||
			colorClass.includes('orange-300')
		) {
			return 'text-orange-500';
		}
		if (colorClass.includes('drip-300')) {
			return 'text-drip-300';
		}
		return 'text-primary-200';
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger className="w-full">
				<div
					className={`flex w-full flex-col items-start justify-center rounded border ${colorClass} px-4 py-2 text-primary-200`}
				>
					<div className="font-mono">{title}</div>
					<div className="font-bold font-mono text-xl">{amount} HYPE</div>
					<div className="font-mono text-sm opacity-70">{winner}</div>
				</div>
			</DialogTrigger>

			{hasWinner && (
				<DialogContent className={getDialogClasses()}>
					<DialogHeader>
						<DialogTitle className="text-center">
							{/* biome-ignore lint/nursery/useSortedClasses: <explanation> */}
							<span className="text-xl font-bold">{title}</span>
						</DialogTitle>
					</DialogHeader>
					<p className="text">🎉 {formatAddress(winner)} 🎉</p>
					<p className={`text-5xl ${getTextColorClass()}`}>{amount} HYPE</p>
					<Link
						href={`https://x.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`}
						target="_blank"
					>
						<Button variant="default" className={getButtonClasses()}>
							Share on X
						</Button>
					</Link>
				</DialogContent>
			)}
		</Dialog>
	);
}
