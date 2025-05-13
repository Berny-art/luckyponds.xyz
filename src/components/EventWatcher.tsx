// components/EventWatcher.tsx
'use client';

import { useWatchContractEvent } from 'wagmi';
import { type ContractEvent, useEventsStore } from '@/stores/eventsStore';
import { luckyPondsContractConfig } from '@/contracts/LuckyPonds';
import { formatEther } from 'viem';

// Define a more specific type for contract event logs that includes args
interface CoinTossedLog {
	args: {
		pondType: string | bigint;
		frog: string;
		amount: bigint;
		timestamp?: bigint;
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
		...luckyPondsContractConfig,
		eventName: 'CoinTossed',
		enabled: true,
		onError(error) {
			console.log('Error', error);
		},
		onLogs(logs) {
			for (const log of logs) {
				// Type assertion to let TypeScript know that our log includes args property
				const typedLog = log as unknown as CoinTossedLog;
				console.log('CoinTossed event log:', typedLog);
				// Skip if args doesn't exist or required properties are missing
				if (
					!typedLog.args ||
					!typedLog.args.pondType ||
					!typedLog.args.frog ||
					!typedLog.args.amount
				) {
					continue;
				}

				// Extract args from the event log
				const { pondType, frog, amount, timestamp } = typedLog.args;

				const event: Omit<ContractEvent, 'position'> = {
					id: `${typedLog.transactionHash}-${typedLog.logIndex}`,
					address: frog.toString(),
					amount: formatEther(amount), // Format from wei to ether
					timestamp: Number(timestamp || BigInt(Math.floor(Date.now() / 1000))),
					type: 'CoinTossed',
					pondType: pondType.toString(),
				};

				addEvent(event);
			}
		},
		poll: true,
		pollingInterval: 3000, // Poll every 10 seconds
	});

	return null; // This component doesn't render anything
}
