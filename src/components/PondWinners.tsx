'use client';

import { cn, formatAddress, formatValue } from '@/lib/utils';
import PondWinnerCard from './PondWinnerCard';
import { PondPeriod } from '@/lib/types';
import { useAllPondWinners } from '@/hooks/useAllPondWinners';
import { useAppStore } from '@/stores/appStore';
import useLocalStorage from 'use-local-storage';

export default function PondWinners({ classNames }: { classNames?: string }) {
	// Get current token address and lightning mode
	const { selectedToken } = useAppStore();
	const [lightningMode] = useLocalStorage('lightningMode', false);

	// Fetch all pond winners independently of selected pond
	const { winners, isLoading } = useAllPondWinners(selectedToken.address);

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

	if (isLoading) {
		return null;
	}

	// Filter winners based on lightning mode
	const displayWinners = winners.filter((winner) => {
		if (lightningMode) {
			// In lightning mode, show only 5-min and hourly ponds
			return (
				winner.period === PondPeriod.FIVE_MIN ||
				winner.period === PondPeriod.HOURLY
			);
		}
		// In normal mode, show daily, weekly, and monthly ponds
		return (
			winner.period === PondPeriod.DAILY ||
			winner.period === PondPeriod.WEEKLY ||
			winner.period === PondPeriod.MONTHLY
		);
	});

	return (
		<div className={cn('flex w-full flex-col gap-3', classNames)}>
			{displayWinners.map((winner) => (
				<PondWinnerCard
					key={winner.title}
					title={winner.title}
					amount={formatValue(winner.lastPrize)}
					winner={formatWinner(winner.lastWinner)}
					hasWinner={!!hasWinner(winner.lastWinner)}
					period={winner.period}
				/>
			))}
		</div>
	);
}
