'use client';

import { cn, formatAddress, formatValue } from '@/lib/utils';
import { Trophy } from 'lucide-react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { useAllPondWinners } from '@/hooks/useAllPondWinners';
import { useAppStore } from '@/stores/appStore';
import PondWinnerCard from './PondWinnerCard';
import { usePartyHorn } from '@/hooks/usePartyHorn';
import { triggerFullConfetti } from '@/lib/confetti';
import { PondPeriod } from '@/lib/types';

export default function PondWinnerDialog({
	classNames,
}: { classNames?: string }) {
	const { selectedToken } = useAppStore();
	const triggerPartyHorn = usePartyHorn();

	// Fetch winners for all pond periods using the dedicated hook
	const { winners, isLoading, isError } = useAllPondWinners(
		selectedToken.address,
	);

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

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					className={cn(
						'!bg-drip-300/10 flex w-24 justify-start border-2 border-drip-300 px-4 py-[21px] hover:bg-primary-200/10',
						classNames,
					)}
					onClick={() => {
						// Trigger confetti and party horn when opening the dialog
						triggerFullConfetti(PondPeriod.WEEKLY);
						triggerPartyHorn();
					}}
				>
					<Trophy className="h-5 w-5 text-primary-200" />
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-screen max-w-[95vw] overflow-y-scroll border-2 border-primary-200 rounded-lg bg-primary-950/90 px-8 text-primary-200 backdrop-blur-sm">
				<DialogHeader>
					<DialogTitle className="pt-8 text-center font-bold font-mono text-3xl">
						<span className="flex items-center justify-center gap-2">
							Recent Winners
						</span>
					</DialogTitle>
				</DialogHeader>

				{isLoading ? (
					<div className="py-2 text-center">Loading winners...</div>
				) : isError ? (
					<div className="py-2 text-center text-red-400">
						Error loading winners
					</div>
				) : (
					<div className="flex flex-col gap-2">
						{winners.map((winner) => (
							<PondWinnerCard
								key={winner.title}
								title={winner.title}
								amount={formatValue(winner.lastPrize, selectedToken.decimals).toString()}
								winner={formatWinner(winner.lastWinner)}
								hasWinner={!!hasWinner(winner.lastWinner)}
								period={winner.period}
							/>
						))}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
