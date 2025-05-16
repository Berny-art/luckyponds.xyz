// src/components/PondInfo.tsx
'use client';

import { formatValue } from '@/lib/utils';
import { useAccount } from 'wagmi';
import { Skeleton } from './ui/skeleton';
import type { PondComprehensiveInfo } from '@/lib/types';
import { getPondStatus } from '@/functions/getPondStatus';

type PondInfoProps = {
	pondInfo: PondComprehensiveInfo;
	isLoading?: boolean;
};

export default function PondInfo({
	pondInfo,
	isLoading = false,
}: PondInfoProps) {
	const { address } = useAccount();
	const isConnected = !!address;

	// Calculate time remaining in a human-readable format
	const getTimeRemaining = (timeUntilEnd: bigint) => {
		const totalSeconds = Number(timeUntilEnd);
		const days = Math.floor(totalSeconds / 86400);
		const hours = Math.floor((totalSeconds % 86400) / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);

		if (days > 0) return `${days}d ${hours}h`;
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	};

	// Loading state
	if (isLoading) {
		return (
			<div className="flex w-full flex-col gap-4 rounded bg-primary-200/5 p-4 font-mono">
				<Skeleton className="h-6 w-3/4 bg-secondary-900/30" />
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<Skeleton className="h-4 w-24 bg-secondary-900/30" />
						<Skeleton className="h-4 w-20 bg-secondary-900/30" />
					</div>
					<div className="flex items-center justify-between">
						<Skeleton className="h-4 w-28 bg-secondary-900/30" />
						<Skeleton className="h-4 w-16 bg-secondary-900/30" />
					</div>
					<div className="flex items-center justify-between">
						<Skeleton className="h-4 w-32 bg-secondary-900/30" />
						<Skeleton className="h-4 w-14 bg-secondary-900/30" />
					</div>
					{isConnected && (
						<div className="flex items-center justify-between">
							<Skeleton className="h-4 w-20 bg-secondary-900/30" />
							<Skeleton className="h-4 w-20 bg-secondary-900/30" />
						</div>
					)}
				</div>
			</div>
		);
	}

	// No data state - should never happen if properly called
	if (!pondInfo) {
		return (
			<div className="flex w-full flex-col gap-4 rounded border-2 border-drip-300/40 bg-primary-200/5 p-4 font-mono text-primary-200/50">
				<p className="text-center">No pond information available</p>
			</div>
		);
	}

	return (
		<div className="flex w-full flex-col gap-4 rounded border-2 border-drip-300 bg-primary-200/10 p-4 font-mono text-primary-200">
			<h2 className="font-bold text-lg">{pondInfo.name} Info</h2>
			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<span className="font-bold text-sm">Status:</span>
					<span className="font-mono text-sm">{getPondStatus(pondInfo)}</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="font-bold text-sm">Prize Pool:</span>
					<span className="font-mono text-sm">
						{formatValue(pondInfo.totalValue)} HYPE
					</span>
				</div>

				<div className="flex items-center justify-between">
					<span className="font-bold text-sm">Participants:</span>
					<span className="font-mono text-sm">
						{pondInfo.totalParticipants.toString()}
					</span>
				</div>

				<div className="flex items-center justify-between">
					<span className="font-bold text-sm">Time Remaining:</span>
					<span className="font-mono text-sm">
						{getTimeRemaining(pondInfo.timeUntilEnd)}
					</span>
				</div>

				{isConnected && (
					<div className="flex items-center justify-between">
						<span className="font-bold text-sm">Your Stake:</span>
						<span className="font-mono text-sm">
							{formatValue(pondInfo.userTossAmount)} HYPE
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
