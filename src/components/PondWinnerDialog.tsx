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
import useStandardPondsForUi from '@/hooks/useStandardPondsForUI'; // Fixed casing
import usePondInfo from '@/hooks/usePondInfo';
import { PondPeriod } from '@/lib/types';

/**
 * Mobile-friendly component for displaying pond winners
 * Shows a trophy button that opens a dialog with all winners
 */
export default function PondWinnerDialog({
	classNames,
}: { classNames?: string }) {
	// Get standard pond types using our hook
	const { data: pondsData, isLoading: isLoadingPonds } =
		useStandardPondsForUi();

	// Extract pond types if available
	const fiveMinPondType = pondsData?.find(
		(p) => p.period === PondPeriod.FIVE_MIN,
	)?.type;
	const hourlyPondType = pondsData?.find(
		(p) => p.period === PondPeriod.HOURLY,
	)?.type;
	const dailyPondType = pondsData?.find(
		(p) => p.period === PondPeriod.DAILY,
	)?.type;
	const weeklyPondType = pondsData?.find(
		(p) => p.period === PondPeriod.WEEKLY,
	)?.type;
	const monthlyPondType = pondsData?.find(
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

	const isLoading =
		isLoadingPonds || !dailyPondType || !weeklyPondType || !monthlyPondType;

	// Define display configuration for all pond types
	const pondsConfig = [
		{
			pondInfo: fiveMinInfo,
			title: '5 Min Winner',
			colorClass: 'text-purple-400',
			bgClass: 'bg-purple-400/10',
			borderClass: 'border-purple-400',
		},
		{
			pondInfo: hourlyInfo,
			title: 'Hourly Winner',
			colorClass: 'text-blue-400',
			bgClass: 'bg-blue-400/10',
			borderClass: 'border-blue-400',
		},
		{
			pondInfo: dailyInfo,
			title: 'Daily Winner',
			colorClass: 'text-primary-200',
			bgClass: 'bg-primary-200/10',
			borderClass: 'border-primary-200',
		},
		{
			pondInfo: weeklyInfo,
			title: 'Weekly Winner',
			colorClass: 'text-orange-400',
			bgClass: 'bg-orange-400/10',
			borderClass: 'border-orange-400',
		},
		{
			pondInfo: monthlyInfo,
			title: 'Monthly Winner',
			colorClass: 'text-drip-300',
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
					className={cn(
						'!bg-drip-300/10 flex w-24 justify-start border-2 border-drip-300 px-4 py-[18px] hover:bg-drip-300/40',
						classNames,
					)}
				>
					<Trophy className="h-5 w-5 text-primary-200" />
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-md border-none bg-primary-950/90 px-8 text-primary-200 backdrop-blur-sm">
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
						{pondsConfig.map((pond) => (
							<div
								key={pond.title}
								className={cn(
									'flex flex-col items-center justify-center rounded-lg border-2 p-4 text-center',
									pond.bgClass,
									pond.borderClass,
								)}
							>
								<h3 className="font-bold font-mono text-lg">{pond.title}</h3>
								<p className={cn('mt-1 font-bold text-2xl', pond.colorClass)}>
									{formatValue(pond.pondInfo?.lastPondPrize)} HYPE
								</p>
								<div className="mt-2 font-mono text-primary-200 text-sm">
									{hasWinner(pond.pondInfo?.lastPondWinner) ? (
										<div className="flex flex-col items-center gap-1">
											<p>{formatWinner(pond.pondInfo?.lastPondWinner)}</p>
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
