// src/hooks/useWinnerSelection.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useWriteContract } from 'wagmi';
import { pondCoreConfig } from '@/contracts/PondCore';
import type { PondComprehensiveInfo } from '@/lib/types';
import { PondStatus } from '@/functions/getPondStatus';
import { toast } from 'sonner';

interface UseWinnerSelectionProps {
	pondInfo: PondComprehensiveInfo;
	selectedPond: string | null;
	pondStatus: PondStatus;
	onTransactionSuccess?: () => void;
}

export function useWinnerSelection({ 
	pondInfo, 
	selectedPond, 
	pondStatus, 
	onTransactionSuccess 
}: UseWinnerSelectionProps) {
	const { writeContractAsync } = useWriteContract();

	// Function to select a winner for the pond
	const selectWinner = useCallback(async () => {
		if (!selectedPond) return;

		const hash = await writeContractAsync({
			...pondCoreConfig,
			address: pondCoreConfig.address as `0x${string}`,
			functionName: 'selectLuckyWinner',
			args: [selectedPond as `0x${string}`],
			type: 'legacy',
		});

		return hash;
	}, [selectedPond, writeContractAsync]);

	// Use React Query to handle SelectWinner status detection and auto-refresh
	useQuery({
		queryKey: ['winner-selection-status', selectedPond, pondStatus],
		queryFn: async () => {
			if (pondStatus === PondStatus.SelectWinner && onTransactionSuccess) {
				// Trigger data refresh when SelectWinner status is detected
				await new Promise((resolve) => setTimeout(resolve, 1000));
				onTransactionSuccess();
			}
			return pondStatus;
		},
		enabled: pondStatus === PondStatus.SelectWinner,
		refetchInterval: false, // Only run once when status changes
		staleTime: 0,
	});

	// Check if pond needs winner selection
	const needsWinnerSelection = useCallback(() => {
		return pondInfo.timeUntilEnd <= 0 && pondInfo.prizeDistributed === false;
	}, [pondInfo.timeUntilEnd, pondInfo.prizeDistributed]);

	return {
		selectWinner,
		needsWinnerSelection,
	};
}
