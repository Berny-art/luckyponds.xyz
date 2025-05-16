'use client';

import { useQuery } from '@tanstack/react-query';
import { useReadContract, useAccount } from 'wagmi';
import { pondCoreConfig } from '@/contracts/PondCore';
import type {
	PondComprehensiveInfo,
	TokenType,
	ParticipantInfo,
} from '@/lib/types';
import { PondPeriod } from '@/lib/types';
import { parseEther } from 'viem';

// Default values for faster rendering
const getDefaultPondInfo = (pondType: string): PondComprehensiveInfo => {
	// Determine pond type from address or name pattern
	const isPond = (type: string) => {
		if (!pondType) return false;
		return pondType.toLowerCase().includes(type);
	};

	const isDaily = isPond('daily');
	const isWeekly = isPond('weekly');
	const isMonthly = isPond('monthly');
	const isHourly = isPond('hourly');
	const isFiveMin = isPond('fivemin') || isPond('five_min');

	// Set default values based on pond type
	const now = Math.floor(Date.now() / 1000);
	let duration: number;
	let name: string;
	let period: PondPeriod;

	if (isFiveMin) {
		duration = 300; // 5 minutes
		name = 'Five Minute Pond';
		period = PondPeriod.FIVE_MIN;
	} else if (isHourly) {
		duration = 3600; // 1 hour
		name = 'Hourly Pond';
		period = PondPeriod.HOURLY;
	} else if (isDaily) {
		duration = 86400; // 1 day
		name = 'Daily Pond';
		period = PondPeriod.DAILY;
	} else if (isWeekly) {
		duration = 604800; // 1 week
		name = 'Weekly Pond';
		period = PondPeriod.WEEKLY;
	} else if (isMonthly) {
		duration = 2592000; // 30 days
		name = 'Monthly Pond';
		period = PondPeriod.MONTHLY;
	} else {
		duration = 86400; // Default to daily
		name = 'Lucky Pond';
		period = PondPeriod.CUSTOM;
	}

	// Scale values based on duration
	const scaleFactor = duration / 86400; // Scale relative to a day
	const tossesScale = Math.max(1, Math.min(10, scaleFactor * 50));
	const valueScale = Math.max(0.1, Math.min(5, scaleFactor * 0.5));
	const participantsScale = Math.max(5, Math.min(200, scaleFactor * 20));
	const maxAmountScale = Math.max(1, Math.min(100, scaleFactor * 10));

	return {
		name,
		startTime: BigInt(now - Math.floor(duration * 0.1)), // Started 10% ago
		endTime: BigInt(now + duration),
		totalTosses: BigInt(Math.floor(tossesScale)),
		totalValue: parseEther(valueScale.toFixed(2)),
		totalParticipants: BigInt(Math.floor(participantsScale)),
		prizeDistributed: false,
		timeUntilEnd: BigInt(duration),
		minTossPrice: parseEther('0.01'),
		maxTotalTossAmount: parseEther(maxAmountScale.toFixed(2)),
		tokenType: 0 as TokenType, // Default to native token
		tokenAddress: '0x0000000000000000000000000000000000000000',
		userTossAmount: parseEther('0'),
		remainingTossAmount: parseEther((maxAmountScale - valueScale).toFixed(2)),
		lastPondWinner: '0x0000000000000000000000000000000000000000',
		lastPondPrize: parseEther('0'),
		recentParticipants: [],
		period, // Add period from PondCore
	};
};

export default function usePondInfo(pondType: string) {
	const { address } = useAccount();
	// Use a default address for anonymous viewing, or the connected wallet address
	const user = address ?? '0xaacDF5D6b6dF6215d895a3F8E6398AfF35E3b2Cf';

	// Cast addresses to the format expected by wagmi
	const pondTypeFormatted = pondType as `0x${string}`;
	const userFormatted = user as `0x${string}`;

	// Get basic pond status
	const { data: pondStatusData } = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'getPondStatus',
		args: pondType ? [pondTypeFormatted] : undefined,
		query: {
			enabled: Boolean(pondType),
		},
	});

	// Get user's toss amount
	const { data: userTossAmount } = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'getUserTossAmount',
		args: pondType && user ? [pondTypeFormatted, userFormatted] : undefined,
		query: {
			enabled: Boolean(pondType && user),
		},
	});

	// Get last winner
	const { data: lastWinner } = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'lastWinner',
		args: pondType ? [pondTypeFormatted] : undefined,
		query: {
			enabled: Boolean(pondType),
		},
	});

	// Get last prize
	const { data: lastPrize } = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'lastPrize',
		args: pondType ? [pondTypeFormatted] : undefined,
		query: {
			enabled: Boolean(pondType),
		},
	});

	// Get recent participants
	const { data: participants } = useReadContract({
		...pondCoreConfig,
		address: pondCoreConfig.address as `0x${string}`,
		functionName: 'getPondParticipants',
		args: pondType ? [pondTypeFormatted] : undefined,
		query: {
			enabled: Boolean(pondType),
			// Fetch less frequently as this can be expensive
			refetchInterval: 60000, // 1 minute
		},
	});

	// Use React Query to combine all the data and provide a comprehensive pond info object
	return useQuery({
		queryKey: ['pondInfo', pondType, user],
		queryFn: async () => {
			// If no pond status yet, return null (won't happen with placeholderData)
			if (!pondStatusData) return null;

			// Prepare the return object with the base pond status
			const status = pondStatusData as unknown[];

			// Get the max toss amount from pond status
			const maxTotalTossAmount = status[9] as bigint;

			// Calculate remaining amount (max - user amount)
			const userAmount = (userTossAmount as bigint) || BigInt(0);
			const remainingTossAmount = maxTotalTossAmount - userAmount;

			// Prepare recent participants array
			let recentParticipants: ParticipantInfo[] = [];
			if (participants && Array.isArray(participants)) {
				// Limit to most recent 10 participants
				recentParticipants = (participants as ParticipantInfo[]).slice(0, 10);
			}

			// Construct the comprehensive info object
			return {
				name: status[0] as string,
				startTime: status[1] as bigint,
				endTime: status[2] as bigint,
				totalTosses: status[3] as bigint,
				totalValue: status[4] as bigint,
				totalParticipants: status[5] as bigint,
				prizeDistributed: status[6] as boolean,
				timeUntilEnd: status[7] as bigint,
				minTossPrice: status[8] as bigint,
				maxTotalTossAmount,
				tokenType: status[10] as TokenType,
				tokenAddress: status[11] as string,
				period: status[12] as PondPeriod,
				userTossAmount: userAmount,
				remainingTossAmount,
				lastPondWinner:
					(lastWinner as string) ||
					'0x0000000000000000000000000000000000000000',
				lastPondPrize: (lastPrize as bigint) || BigInt(0),
				recentParticipants,
			} as PondComprehensiveInfo;
		},
		// Use default pond info for immediate rendering
		placeholderData: () => (pondType ? getDefaultPondInfo(pondType) : null),
		// Enable query only if we have a pond type
		enabled: Boolean(pondType),
		// Auto-refresh every 15 seconds
		refetchInterval: 15000,
		// Don't refetch on window focus to reduce unnecessary calls
		refetchOnWindowFocus: false,
		// Define stale time to reduce refetches for the same data
		staleTime: 10000, // 10 seconds
	});
}
