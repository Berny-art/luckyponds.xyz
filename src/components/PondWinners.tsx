'use client';

import { cn, formatAddress, formatValue } from '@/lib/utils';
import PondWinnerCard from './PondWinnerCard';
import { PondPeriod } from '@/lib/types';
import { usePondStore } from '@/stores/pondStore';
import { usePondData } from '@/stores/pondDataStore';
import useLocalStorage from 'use-local-storage';
import { useEffect, useState } from 'react';
import type { PondComprehensiveInfo } from '@/lib/types';

export default function PondWinners({ classNames }: { classNames?: string }) {
	// Get pond types and lightning mode directly from the store
	const { isLoadingPondTypes } = usePondStore();
	const { pondInfo } = usePondData();

	const [lightningMode] = useLocalStorage('lightningMode', false);
	const [pondDataCache, setPondDataCache] = useState<
		Record<string, PondComprehensiveInfo>
	>({});

	// Cache pond data when available
	useEffect(() => {
		if (pondInfo) {
			setPondDataCache((prev) => ({
				...prev,
				[pondInfo.period]: pondInfo,
			}));
		}
	}, [pondInfo]);

	// Get cached data for each pond period
	const fiveMinInfo = pondDataCache[PondPeriod.FIVE_MIN];
	const hourlyInfo = pondDataCache[PondPeriod.HOURLY];
	const dailyInfo = pondDataCache[PondPeriod.DAILY];
	const weeklyInfo = pondDataCache[PondPeriod.WEEKLY];
	const monthlyInfo = pondDataCache[PondPeriod.MONTHLY];

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
	const isWinnersLoading = isLoadingPondTypes;

	if (isWinnersLoading) {
		return null;
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
