// src/components/PondInfo.tsx
'use client';

import { formatValue } from '@/lib/utils';
import { useAccount } from 'wagmi';
import { Skeleton } from './ui/skeleton';
import type { PondComprehensiveInfo } from '@/lib/types';
import { useAppStore } from '@/stores/appStore';

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
	const { selectedToken } = useAppStore();

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
			<h2 className="font-bold text-lg">
				{pondInfo.name.replace('ETH', '')} Info
			</h2>
			<div className="flex flex-col gap-2">
				{/* <div className="flex items-center justify-between">
					<span className="font-bold text-sm">Status:</span>
					<span className="font-mono text-sm">{pondStatus}</span>
				</div> */}
				<div className="flex items-center justify-between">
					<span className="font-bold text-sm">Participants:</span>
					<span className="font-mono text-sm">
						{pondInfo.totalParticipants.toString()}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="font-bold text-sm">Prize Pool:</span>
					<span className="font-mono text-drip-300 text-sm">
						{formatValue(pondInfo.totalValue)} {selectedToken.symbol}
					</span>
				</div>

				{isConnected && (
					<div className="flex items-center justify-between">
						<span className="font-bold text-sm">Your Stake:</span>
						<span className="font-mono text-sm">
							{formatValue(pondInfo.userTossAmount)} {selectedToken.symbol}
						</span>
					</div>
				)}

			</div>
		</div>
	);
}
