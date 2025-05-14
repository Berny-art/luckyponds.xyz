'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { useReadContract, useAccount } from 'wagmi';
import { luckyPondsContractConfig } from '@/contracts/LuckyPonds';
import type { PondComprehensiveInfo, TokenType } from '@/lib/types';
import { parseEther } from 'viem';

// Cache for pond info
const pondInfoCache: Record<
	string,
	{
		data: PondComprehensiveInfo;
		timestamp: number;
		userAddress: string; // Include user address in cache key
	}
> = {};

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Default values for faster rendering
const getDefaultPondInfo = (pondType: string): PondComprehensiveInfo => {
	// Determine pond type from address
	const isPond = (type: string) => pondType.toLowerCase().includes(type);
	const isDaily = isPond('daily');
	const isWeekly = isPond('weekly');
	const isMonthly = isPond('monthly');

	// Set default values based on pond type
	const now = Math.floor(Date.now() / 1000);

	return {
		name: isDaily
			? 'Daily Pond'
			: isWeekly
				? 'Weekly Pond'
				: isMonthly
					? 'Monthly Pond'
					: 'Lucky Pond',
		startTime: BigInt(now - 3600), // Started 1 hour ago
		endTime: BigInt(now + (isDaily ? 86400 : isWeekly ? 604800 : 2592000)), // 1 day, 1 week, or 30 days
		totalTosses: BigInt(isDaily ? 50 : isWeekly ? 150 : 300),
		totalValue: parseEther(isDaily ? '0.5' : isWeekly ? '1.5' : '3'),
		totalParticipants: BigInt(isDaily ? 20 : isWeekly ? 50 : 100),
		prizeDistributed: true, // Set to true as we're showing a pond with prizes distributed in the default view
		timeUntilEnd: BigInt(isDaily ? 86400 : isWeekly ? 604800 : 2592000),
		minTossPrice: parseEther('0.01'),
		maxTotalTossAmount: parseEther(isDaily ? '10' : isWeekly ? '20' : '50'),
		tokenType: 0 as TokenType, // Default to native token
		tokenAddress: '0x0000000000000000000000000000000000000000',
		userTossAmount: parseEther('0'),
		remainingTossAmount: parseEther(isDaily ? '9.5' : isWeekly ? '18.5' : '47'),
		lastPondWinner: '0x0000000000000000000000000000000000000000',
		lastPondPrize: parseEther('0'),
		recentParticipants: [],
	};
};

// Helper function to map the array returned by the contract to our type
function mapArrayToPondInfo(data: any[]): PondComprehensiveInfo | null {
	if (!data || !Array.isArray(data)) return null;

	return {
		name: data[0],
		startTime: data[1],
		endTime: data[2],
		totalTosses: data[3],
		totalValue: data[4],
		totalParticipants: data[5],
		prizeDistributed: data[6],
		timeUntilEnd: data[7],
		minTossPrice: data[8],
		maxTotalTossAmount: data[9],
		tokenType: data[10] as TokenType,
		tokenAddress: data[11],
		userTossAmount: data[12],
		remainingTossAmount: data[13],
		lastPondWinner: data[14],
		lastPondPrize: data[15],
		recentParticipants: data[16] || [],
	};
}

// Get cache key that includes both pond type and user address
const getCacheKey = (pondType: string, userAddress: string) => {
	return `${pondType}-${userAddress}`;
};

// Hook version of getPondInfo with optimizations
export default function usePondInfo(
	pondType: string,
): PondComprehensiveInfo | null {
	const { address } = useAccount();
	const user = address ?? '0xaacDF5D6b6dF6215d895a3F8E6398AfF35E3b2Cf';

	// State to store the pond info
	const [pondInfo, setPondInfo] = useState<PondComprehensiveInfo | null>(null);

	// Determine if we should fetch from blockchain
	const shouldFetch = Boolean(user && pondType);

	// Use the read contract hook from wagmi
	const {
		data: rawPondInfo,
		isLoading,
		isError,
	} = useReadContract({
		...luckyPondsContractConfig,
		functionName: 'getPondComprehensiveInfo',
		args: shouldFetch
			? [pondType as `0x${string}`, user as `0x${string}`]
			: undefined,
		query: {
			enabled: shouldFetch,
		},
	});

	// Effect to handle data loading, caching, and optimistic rendering
	useEffect(() => {
		// If no valid inputs, return null
		if (!pondType) {
			setPondInfo(null);
			return;
		}

		// Generate cache key
		const cacheKey = getCacheKey(pondType, user);

		// Check cache first
		const cachedData = pondInfoCache[cacheKey];
		const now = Date.now();

		if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
			// Use cached data if it's fresh
			setPondInfo(cachedData.data);
			return;
		}

		// If no cache hit, use optimistic rendering with defaults
		if (!pondInfo) {
			setPondInfo(getDefaultPondInfo(pondType));
		}

		// When data is loaded from contract, update state and cache
		if (rawPondInfo && !isLoading && !isError) {
			const mappedData = mapArrayToPondInfo(rawPondInfo as any[]);

			if (mappedData) {
				// Update cache
				pondInfoCache[cacheKey] = {
					data: mappedData,
					timestamp: now,
					userAddress: user,
				};

				// Update state
				setPondInfo(mappedData);
			}
		}
	}, [pondType, user, rawPondInfo, isLoading, isError, pondInfo]);

	// Return the current state (either cached, default, or blockchain data)
	return pondInfo;
}
