'use client';

import { useReadContract } from 'wagmi';
import { luckyPondsContractConfig } from '@/contracts/LuckyPonds';
import { formatEther } from 'viem';
import { cn, formatAddress } from '@/lib/utils';
import getPondInfo from '@/functions/getPondInfo';
import PondWinnerCard from './PondWinnerCard';

export default function PondWinners({ classNames }: { classNames?: string }) {
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

	// Function to format prize amounts nicely
	const formatPrize = (amount: bigint | undefined) => {
		if (!amount) return '0.00';
		const formatted = formatEther(amount);
		return Number.parseFloat(formatted).toFixed(2);
	};

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

	const isLoading = !dailyPondType || !weeklyPondType || !monthlyPondType;

	if (isLoading) {
		return <div className="py-4 text-center">Loading winners...</div>;
	}

	return (
		<div className={cn('flex w-full flex-col gap-3', classNames)}>
			<PondWinnerCard
				title="Daily Winner"
				amount={formatPrize(dailyPondInfo?.lastPondPrize)}
				winner={formatWinner(dailyPondInfo?.lastPondWinner)}
				colorClass="bg-primary-200/10 border-primary-200"
				hasWinner={!!hasWinner(dailyPondInfo?.lastPondWinner)}
			/>

			<PondWinnerCard
				title="Weekly Winner"
				amount={formatPrize(weeklyPondInfo?.lastPondPrize)}
				winner={formatWinner(weeklyPondInfo?.lastPondWinner)}
				colorClass="bg-orange-400/10 border-orange-400"
				hasWinner={true}
			/>

			<PondWinnerCard
				title="Monthly Winner"
				amount={formatPrize(monthlyPondInfo?.lastPondPrize)}
				winner={formatWinner(monthlyPondInfo?.lastPondWinner)}
				colorClass="bg-drip-300/10 border-drip-300"
				hasWinner={true}
			/>
		</div>
	);
}
