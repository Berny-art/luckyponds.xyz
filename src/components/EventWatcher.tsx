// components/EventWatcher.tsx
'use client';

import { useWatchContractEvent } from 'wagmi';
import { type ContractEvent, useEventsStore } from '@/stores/eventsStore';
import { pondCoreConfig } from '@/contracts/PondCore';
import { formatEther } from 'viem';

// Define specific types for contract event logs
interface CoinTossedLog {
	args: {
		pondType: string | bigint;
		participant: string; // Changed from 'frog' to 'participant'
		amount: bigint;
		timestamp: bigint;
		totalPondTosses?: bigint;
		totalPondValue?: bigint;
	};
	transactionHash: string;
	logIndex: number | bigint;
}

/**
 * Component that watches for contract events and stores them in the events store.
 * This component doesn't render anything - it's just for event handling.
 */
export default function EventWatcher() {
	const { addEvent } = useEventsStore();

	// Watch for CoinTossed events
	useWatchContractEvent({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		eventName: 'CoinTossed',
		enabled: true,
		onError(error) {
			console.log('Error watching CoinTossed events:', error);
		},
		onLogs(logs) {
			for (const log of logs) {
				// Type assertion to let TypeScript know that our log includes args property
				const typedLog = log as unknown as CoinTossedLog;

				// Skip if args doesn't exist or required properties are missing
				if (
					!typedLog.args ||
					!typedLog.args.pondType ||
					!typedLog.args.participant ||
					!typedLog.args.amount
				) {
					continue;
				}

				// Extract args from the event log
				const { pondType, participant, amount, timestamp } = typedLog.args;

				const event: Omit<ContractEvent, 'position'> = {
					id: `${typedLog.transactionHash}-${typedLog.logIndex}`,
					address: participant.toString(),
					amount: formatEther(amount), // Format from wei to ether
					timestamp: Number(timestamp || BigInt(Math.floor(Date.now() / 1000))),
					type: 'CoinTossed',
					pondType: pondType.toString(),
				};

				addEvent(event);
			}
		},
		poll: true,
		pollingInterval: 5000, // Poll every 3 seconds
	});

	return null; // This component doesn't render anything
}
