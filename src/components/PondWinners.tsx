// src/components/PondWinners.tsx
'use client';

import { cn, formatAddress, formatValue } from '@/lib/utils';
import PondWinnerCard from './PondWinnerCard';
import { Skeleton } from './ui/skeleton';
import { PondPeriod } from '@/lib/types';
import usePondInfo from '@/hooks/usePondInfo';
import { usePondStore } from '@/stores/pondStore';

export default function PondWinners({ classNames }: { classNames?: string }) {
	// Get pond types directly from the store
	const { pondTypes, isLoadingPondTypes } = usePondStore();

	// Extract pond types if available
	const fiveMinPondType = pondTypes.find(
		(p) => p.period === PondPeriod.FIVE_MIN,
	)?.type;

	const hourlyPondType = pondTypes.find(
		(p) => p.period === PondPeriod.HOURLY,
	)?.type;

	const dailyPondType = pondTypes.find(
		(p) => p.period === PondPeriod.DAILY,
	)?.type;

	const weeklyPondType = pondTypes.find(
		(p) => p.period === PondPeriod.WEEKLY,
	)?.type;

	const monthlyPondType = pondTypes.find(
		(p) => p.period === PondPeriod.MONTHLY,
	)?.type;

	// Use our usePondInfo hook to get info for each pond
	const { data: fiveMinInfo } = usePondInfo(fiveMinPondType || '');
	const { data: hourlyInfo } = usePondInfo(hourlyPondType || '');
	const { data: dailyInfo } = usePondInfo(dailyPondType || '');
	const { data: weeklyInfo } = usePondInfo(weeklyPondType || '');
	const { data: monthlyInfo } = usePondInfo(monthlyPondType || '');

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

	// Check if we're still loading data
	const isLoading =
		isLoadingPondTypes ||
		!dailyPondType ||
		!weeklyPondType ||
		!monthlyPondType ||
		!dailyInfo ||
		!weeklyInfo ||
		!monthlyInfo;

	if (isLoading) {
		return (
			<div className={cn('flex w-full flex-col gap-3', classNames)}>
				<Skeleton className="h-20 w-full rounded-lg bg-primary-200/5" />
				<Skeleton className="h-20 w-full rounded-lg bg-primary-200/5" />
				<Skeleton className="h-20 w-full rounded-lg bg-primary-200/5" />
			</div>
		);
	}

	// Define display configuration for each pond type
	const pondConfigs = [
		{
			pondInfo: dailyInfo,
			title: 'Daily Winner',
			colorClass: 'bg-primary-200/10 border-primary-200',
			textClass: 'text-primary-200',
		},
		{
			pondInfo: weeklyInfo,
			title: 'Weekly Winner',
			colorClass: 'bg-orange-400/10 border-orange-400',
			textClass: 'text-orange-400',
		},
		{
			pondInfo: monthlyInfo,
			title: 'Monthly Winner',
			colorClass: 'bg-drip-300/10 border-drip-300',
			textClass: 'text-drip-300',
		},
	];

	return (
		<div className={cn('flex w-full flex-col gap-3', classNames)}>
			{pondConfigs.map((config) => (
				<PondWinnerCard
					key={config.title}
					title={config.title}
					amount={formatValue(config.pondInfo?.lastPondPrize)}
					winner={formatWinner(config.pondInfo?.lastPondWinner)}
					colorClass={config.colorClass}
					textClass={config.textClass}
					hasWinner={!!hasWinner(config.pondInfo?.lastPondWinner)}
				/>
			))}
		</div>
	);
}
