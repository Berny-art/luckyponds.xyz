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

	// Validate token exists
	useEffect(() => {
		if (!tokenParam) {
			notFound();
			return;
		}

		// Try to find token by symbol first, then by address
		let targetToken = getTokenBySymbol(tokenParam.toUpperCase());

		if (!targetToken) {
			// If not found by symbol, try by address
			targetToken = getTokenByAddress(tokenParam);
		}

		if (!targetToken) {
			// Token not found, redirect to 404
			notFound();
			return;
		}
	}, [tokenParam, getTokenBySymbol, getTokenByAddress]);

	// Pass the token address to PondInterface
	return <PondInterface tokenAddress={tokenParam} />;
}
