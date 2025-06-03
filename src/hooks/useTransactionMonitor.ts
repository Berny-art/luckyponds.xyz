// src/hooks/useTransactionMonitor.ts
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { useWaitForTransactionReceipt } from 'wagmi';

interface TransactionResult {
	success: boolean;
	hash?: `0x${string}`;
	error?: Error;
}

interface UseTransactionMonitorProps {
	txHash: `0x${string}` | null;
	onSuccess?: () => void;
	enabled?: boolean;
}

export function useTransactionMonitor({ 
	txHash, 
	onSuccess, 
	enabled = true 
}: UseTransactionMonitorProps) {
	const queryClient = useQueryClient();
	const processedTxHashRef = useRef<string | null>(null);

	// Watch for transaction receipt
	const { 
		data: receipt, 
		isSuccess, 
		isError, 
		error 
	} = useWaitForTransactionReceipt({
		hash: txHash as `0x${string}`,
		query: {
			enabled: !!txHash && enabled,
		},
	});

	// Use React Query to manage transaction result state
	const { data: transactionResult } = useQuery({
		queryKey: ['transaction-result', txHash],
		queryFn: (): TransactionResult => {
			if (isSuccess && receipt) {
				return {
					success: true,
					hash: txHash as `0x${string}`,
				};
			}
			if (isError && error) {
				return {
					success: false,
					hash: txHash as `0x${string}`,
					error: error as Error,
				};
			}
			return { success: false };
		},
		enabled: !!txHash && (isSuccess || isError),
		staleTime: Infinity, // Transaction results never become stale
	});

	// Handle success callback with deduplication
	const handleSuccess = useCallback(() => {
		if (
			transactionResult?.success &&
			transactionResult.hash &&
			onSuccess &&
			processedTxHashRef.current !== transactionResult.hash
		) {
			processedTxHashRef.current = transactionResult.hash;
			onSuccess();
			
			// Invalidate related queries that might need refreshing
			queryClient.invalidateQueries({ queryKey: ['pond-data'] });
			queryClient.invalidateQueries({ queryKey: ['allowance'] });
		}
	}, [transactionResult, onSuccess, queryClient]);

	// Use React Query to handle the success callback
	useQuery({
		queryKey: ['transaction-success-handler', transactionResult?.hash],
		queryFn: () => {
			handleSuccess();
			return null;
		},
		enabled: !!transactionResult?.success && !!transactionResult.hash,
		staleTime: Infinity,
	});

	return {
		transactionResult,
		isMonitoring: !!txHash && !isSuccess && !isError,
		reset: () => {
			processedTxHashRef.current = null;
			queryClient.removeQueries({ queryKey: ['transaction-result', txHash] });
		},
	};
}
