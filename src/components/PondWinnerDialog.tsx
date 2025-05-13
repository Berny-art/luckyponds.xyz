'use client';

import { useReadContract } from 'wagmi';
import { luckyPondsContractConfig } from '@/contracts/LuckyPonds';
import { formatEther } from 'viem';
import { cn, formatAddress, formatValue } from '@/lib/utils';
import { Trophy } from 'lucide-react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import getPondInfo from '@/functions/getPondInfo';

/**
 * Mobile-friendly component for displaying pond winners
 * Shows a trophy button that opens a dialog with all winners
 */
export default function PondWinnerDialog({
	classNames,
}: { classNames?: string }) {
	// Get standard pond types
	const { data: standardPondTypes } = useReadContract({
		...luckyPondsContractConfig,
		functionName: 'getStandardPondTypes',
	}) as { data: string[] | undefined };

	// Use your existing getPondInfo function for each pond type
	const dailyPondType = standardPondTypes?.[0];
	const weeklyPondType = standardPondTypes?.[1];
	const monthlyPondType = standardPondTypes?.[2];

	const dailyPondInfo = getPondInfo(dailyPondType || '');
	const weeklyPondInfo = getPondInfo(weeklyPondType || '');
	const monthlyPondInfo = getPondInfo(monthlyPondType || '');

	// Check if there's a winner (address is not zero)
	const hasWinner = (address: string | undefined) => {
		return address && address !== '0x0000000000000000000000000000000000000000';
	};

	// Format address or show "No winner yet"
	const formatWinner = (address: string | undefined) => {
		if (hasWinner(address)) {
			return formatAddress(address as string);
		}
		return 'No winner yet';
	};

	// Handle sharing on Twitter/X
	const shareOnX = (title: string, amount: string, winner: string) => {
		const tweetText = encodeURIComponent(
			`Winner of ${amount} HYPE in the ${title.split(' ')[0]} Lucky Pond is ${winner}!`,
		);
		const tweetUrl = encodeURIComponent('https://luckyponds.xyz');
		window.open(
			`https://x.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`,
			'_blank',
		);
	};

	const isLoading = !dailyPondType || !weeklyPondType || !monthlyPondType;

	// Create winner data for all ponds
	const winners = [
		{
			title: 'Daily Winner',
			amount: formatValue(dailyPondInfo?.lastPondPrize),
			winner: formatWinner(dailyPondInfo?.lastPondWinner),
			colorClass: 'text-primary-200',
			hasWinner: hasWinner(dailyPondInfo?.lastPondWinner),
			bgClass: 'bg-primary-200/10',
			borderClass: 'border-primary-200',
		},
		{
			title: 'Weekly Winner',
			amount: formatValue(weeklyPondInfo?.lastPondPrize),
			winner: formatWinner(weeklyPondInfo?.lastPondWinner),
			colorClass: 'text-orange-400',
			hasWinner: hasWinner(weeklyPondInfo?.lastPondWinner),
			bgClass: 'bg-orange-400/10',
			borderClass: 'border-orange-400',
		},
		{
			title: 'Monthly Winner',
			amount: formatValue(monthlyPondInfo?.lastPondPrize),
			winner: formatWinner(monthlyPondInfo?.lastPondWinner),
			colorClass: 'text-drip-300',
			hasWinner: hasWinner(monthlyPondInfo?.lastPondWinner),
			bgClass: 'bg-drip-300/10',
			borderClass: 'border-drip-300',
		},
	];

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					// className="border-primary-200 bg-secondary-950 hover:bg-secondary-950/80"
					className={cn(
						'!bg-drip-300/10 flex w-24 justify-start border-2 border-drip-300 px-4 py-[18px] hover:bg-drip-300/40',
						classNames,
					)}
				>
					<Trophy className="h-5 w-5 text-primary-200" />
				</Button>
			</DialogTrigger>
			<DialogContent className=" max-w-md border-none bg-primary-950/90 px-8 text-primary-200 backdrop-blur-sm">
				<DialogHeader>
					<DialogTitle className="pt-8 text-center font-bold font-mono text-3xl">
						<span className="flex items-center justify-center gap-2">
							Recent Pond Winners
						</span>
					</DialogTitle>
				</DialogHeader>

				{isLoading ? (
					<div className="py-4 text-center">Loading winners...</div>
				) : (
					<div className="flex flex-col gap-4">
						{winners.map((winner, index) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
								key={index}
								className={cn(
									'flex flex-col items-center justify-center rounded-lg border-2 p-4 text-center',
									winner.bgClass,
									winner.borderClass,
								)}
							>
								<h3 className="font-bold font-mono text-lg">{winner.title}</h3>
								<p className={cn('mt-1 font-bold text-2xl', winner.colorClass)}>
									{winner.amount} HYPE
								</p>
								<div className="mt-2 font-mono text-primary-200 text-sm">
									{winner.hasWinner ? (
										<div className="flex flex-col items-center gap-1">
											<p>{winner.winner}</p>
											{/* <Button
												variant="outline"
												size="sm"
												className={cn(
													'mt-2 border text-xs',
													winner.colorClass,
													winner.borderClass,
												)}
												onClick={() =>
													shareOnX(winner.title, winner.amount, winner.winner)
												}
											>
												Share on X
											</Button> */}
										</div>
									) : (
										'No winner yet'
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
