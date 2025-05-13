'use client';

import type { PondComprehensiveInfo } from '@/lib/types';
import { formatValue } from '@/lib/utils';
import { useAccount } from 'wagmi';

export default function PondInfo({
	pondInfo,
}: { pondInfo: PondComprehensiveInfo }) {
	// Use the hook to get pond info

	if (!pondInfo) return null;

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

	return (
		<div className="flex w-full flex-col gap-4 rounded border-2 border-drip-300 bg-primary-200/10 p-4 font-mono text-primary-200">
			<h2 className="font-bold text-lg">{pondInfo.name} Info</h2>
			<div className="flex flex-col gap-2">
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
