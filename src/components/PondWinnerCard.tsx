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
import { PondPeriod } from '@/lib/types';
import { usePartyHorn } from '@/hooks/usePartyHorn';
import { triggerFullConfetti } from '@/lib/confetti';

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
	const triggerPartyHorn = usePartyHorn();
	const tweetText = encodeURIComponent(
		`I Just Won ${amount} HYPE Playing Lucky Ponds on`,
	);
	const tweetUrl = encodeURIComponent('https://luckyponds.xyz');

	// Fire confetti and party horn when dialog opens
	useEffect(() => {
		if (open && hasWinner) {
			triggerFullConfetti(period);
			triggerPartyHorn();
		}
	}, [open, hasWinner, period]); //eslint-disable-line react-hooks/exhaustive-deps

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

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger className="w-full">
				<div
					className={cn(
						'flex w-full flex-col items-start justify-center rounded border-2 px-4 py-2 text-primary-200',
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
