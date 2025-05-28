'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';

export function useReferralCode() {
	const { address, isConnected } = useAccount();
	const searchParams = useSearchParams();

	const [referralCode, setReferralCode] = useState<string | null>(null);
	const [referrerCode, setReferrerCode] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [hasAppliedReferral, setHasAppliedReferral] = useState(false);

	// Get the referral code from the URL if present
	useEffect(() => {
		const refCode = searchParams.get('ref');
		if (refCode) {
			setReferrerCode(refCode);
		}
	}, [searchParams]);

	// Fetch or create a referral code for the connected user
	const fetchReferralCode = async () => {
		if (!address || !isConnected) {
			setError('Please connect your wallet first');
			return null;
		}

		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch(`/api/referral/code/${address}`);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to fetch referral code');
			}

			const data = await response.json();
			setReferralCode(data.referral_code);
			return data.referral_code;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
			return null;
		} finally {
			setIsLoading(false);
		}
	};

	// Apply a referral code to the current user
	const applyReferralCode = async (codeToApply: string) => {
		if (!address || !isConnected) {
			setError('Please connect your wallet first');
			return false;
		}

		// If we have our own code already, make sure we're not trying to use it
		if (referralCode && codeToApply === referralCode) {
			setError('You cannot use your own referral code');
			return false;
		}

		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch('/api/referral/apply', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					address,
					referral_code: codeToApply,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to apply referral code');
			}

			setHasAppliedReferral(true);
			return true;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	// Automatically apply referrer code when user connects wallet
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const autoApplyReferral = async () => {
			if (isConnected && address && referrerCode && !hasAppliedReferral) {
				// First get our own code
				await fetchReferralCode();

				// Then apply the referrer's code
				await applyReferralCode(referrerCode);
			}
		};

		autoApplyReferral();
	}, [isConnected, address, referrerCode]); // eslint-disable-line react-hooks/exhaustive-deps

	// Generate a full referral link with the user's code
	const getReferralLink = () => {
		if (!referralCode) return '';

		// Use the full URL including hostname
		const baseUrl =
			typeof window !== 'undefined' ? `${window.location.origin}/` : '';

		return `${baseUrl}?ref=${referralCode}`;
	};

	return {
		referralCode,
		referrerCode,
		isLoading,
		error,
		hasAppliedReferral,
		fetchReferralCode,
		applyReferralCode,
		getReferralLink,
	};
}
