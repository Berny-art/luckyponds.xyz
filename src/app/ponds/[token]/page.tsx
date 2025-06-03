// src/app/ponds/[token]/page.tsx
'use client';

import { useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useAppStore } from '@/stores/appStore';
import PondInterface from '@/components/PondInterface';

export default function TokenPondPage() {
	const params = useParams();
	const tokenParam = params.token as string;

	const { getTokenBySymbol, getTokenByAddress } = useAppStore();

	// Resolve token and get the address
	const resolveTokenAddress = (param: string): string | null => {
		if (!param) return null;

		// Try to find token by symbol first, then by address
		let targetToken = getTokenBySymbol(param.toUpperCase());

		if (!targetToken) {
			// If not found by symbol, try by address
			targetToken = getTokenByAddress(param);
		}

		return targetToken ? targetToken.address : null;
	};

	const tokenAddress = resolveTokenAddress(tokenParam);

	// Validate token exists
	useEffect(() => {
		if (!tokenParam || !tokenAddress) {
			notFound();
			return;
		}
	}, [tokenParam, tokenAddress]);

	// If tokenAddress is null, don't render anything (notFound will be called)
	if (!tokenAddress) {
		return null;
	}

	// Pass the resolved token address to PondInterface
	return <PondInterface tokenAddress={tokenAddress} />;
}
