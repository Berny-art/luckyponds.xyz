'use client';

import { cn, formatAddress, formatValue } from '@/lib/utils';
import PondWinnerCard from './PondWinnerCard';
import { Skeleton } from './ui/skeleton';
import { PondPeriod } from '@/lib/types';
import usePondInfo from '@/hooks/usePondInfo';
import { usePondStore } from '@/stores/pondStore';

export default function PondWinners({ classNames }: { classNames?: string }) {
	// Get pond types and lightning mode directly from the store
	const {
		pondTypes,
		isLoadingPondTypes,
		lightningMode = false,
	} = usePondStore();

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

	// Only fetch data for ponds we'll actually show based on lightning mode
	// This avoids unnecessary contract calls
	const { data: fiveMinInfo, isLoading: isFiveMinLoading } = usePondInfo(
		lightningMode ? fiveMinPondType || '' : null,
	);

	const { data: hourlyInfo, isLoading: isHourlyLoading } = usePondInfo(
		lightningMode ? hourlyPondType || '' : null,
	);

	const { data: dailyInfo, isLoading: isDailyLoading } = usePondInfo(
		!lightningMode ? dailyPondType || '' : null,
	);

	const { data: weeklyInfo, isLoading: isWeeklyLoading } = usePondInfo(
		!lightningMode ? weeklyPondType || '' : null,
	);

	const { data: monthlyInfo, isLoading: isMonthlyLoading } = usePondInfo(
		!lightningMode ? monthlyPondType || '' : null,
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

	// Determine loading state based on which ponds we're showing
	const isLoading =
		isLoadingPondTypes ||
		(lightningMode
			? !fiveMinPondType ||
				!hourlyPondType ||
				isFiveMinLoading ||
				isHourlyLoading
			: !dailyPondType ||
				!weeklyPondType ||
				!monthlyPondType ||
				isDailyLoading ||
				isWeeklyLoading ||
				isMonthlyLoading);

	if (isLoading) {
		// Show appropriate number of skeletons based on mode
		const skeletonCount = lightningMode ? 2 : 3;
		return (
			<div className={cn('flex w-full flex-col gap-3', classNames)}>
				{Array(skeletonCount)
					.fill(0)
					.map((_, index) => (
						<Skeleton
							// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
							key={index} //eslint-disable-line react/no-array-index-key
							className="h-20 w-full rounded-lg bg-primary-200/5"
						/>
					))}
			</div>
		);
	}

	// Define all pond configurations
	const allPondConfigs = [
		{
			pondInfo: fiveMinInfo,
			title: '5 Min Winner',
			colorClass: 'bg-primary-200/10 border-primary-200',
			textClass: 'text-primary-200',
			period: PondPeriod.FIVE_MIN,
		},
		{
			pondInfo: hourlyInfo,
			title: 'Hourly Winner',
			colorClass: 'bg-blue-400/10 border-blue-400',
			period: PondPeriod.HOURLY,
		},
		{
			pondInfo: dailyInfo,
			title: 'Daily Winner',
			colorClass: 'bg-orange-400/10 border-orange-400',
			textClass: 'text-orange-400',
			period: PondPeriod.DAILY,
		},
		{
			pondInfo: weeklyInfo,
			title: 'Weekly Winner',

			colorClass: 'bg-drip-300/10 border-drip-300',
			textClass: 'text-drip-300',
			period: PondPeriod.WEEKLY,
		},
		{
			pondInfo: monthlyInfo,
			title: 'Monthly Winner',

			colorClass: 'bg-purple-500/10 border-purple-500',
			textClass: 'text-purple-500',
			period: PondPeriod.MONTHLY,
		},
	];

	// Filter pond configs based on lightning mode
	const displayPondConfigs = allPondConfigs.filter((config) => {
		if (lightningMode) {
			// In lightning mode, show only 5-min and hourly ponds
			return (
				config.period === PondPeriod.FIVE_MIN ||
				config.period === PondPeriod.HOURLY
			);
		}
		// In normal mode, show daily, weekly, and monthly ponds
		return (
			config.period === PondPeriod.DAILY ||
			config.period === PondPeriod.WEEKLY ||
			config.period === PondPeriod.MONTHLY
		);
	});

	return (
		<div className={cn('flex w-full flex-col gap-3', classNames)}>
			{displayPondConfigs.map(
				(config) =>
					config.pondInfo && (
						<PondWinnerCard
							key={config.title}
							title={config.title}
							amount={formatValue(config.pondInfo?.lastPondPrize)}
							winner={formatWinner(config.pondInfo?.lastPondWinner)}
							colorClass={config.colorClass}
							textClass={config.textClass}
							hasWinner={!!hasWinner(config.pondInfo?.lastPondWinner)}
						/>
					),
			)}
		</div>
	);
}
