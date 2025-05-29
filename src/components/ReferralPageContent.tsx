'use client';
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useReferralCode } from '@/hooks/useReferralCode';
import { CopyIcon, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { useCopyToClipboard } from 'usehooks-ts';
import { useUserData } from '@/hooks/useUserData';

interface ReferralPageContentProps {
	initialReferrerCode?: string | null;
}

export default function ReferralPageContent({
	initialReferrerCode,
}: ReferralPageContentProps) {
	const { address, isConnected } = useAccount();
	const {
		referralCode,
		referrerCode,
		isLoading,
		error,
		hasAppliedReferral,
		fetchReferralCode,
		getReferralLink,
	} = useReferralCode({ initialReferrerCode });
	const [copiedText, copy] = useCopyToClipboard();
	const [isCodeFetched, setIsCodeFetched] = useState(false);
	const [referralLink, setReferralLink] = useState('');
	const { data } = useUserData(address as `0x${string}`);
	const amountOfReferrals = (data?.referral_points || 0) / 20;

	// Generate referral link when the code is available
	useEffect(() => {
		if (referralCode) {
			setReferralLink(getReferralLink());
		}
	}, [referralCode, getReferralLink]);

	// Handle fetching referral code when user connects
	useEffect(() => {
		if (isConnected && !isCodeFetched && !isLoading) {
			fetchReferralCode();
			setIsCodeFetched(true);
		}
	}, [isConnected, isCodeFetched, isLoading, fetchReferralCode]);

	// Reset state when user disconnects
	useEffect(() => {
		if (!isConnected) {
			setIsCodeFetched(false);
		}
	}, [isConnected]);

	// Handle copy action
	const handleCopy = async (text: string) => {
		const success = await copy(text);
		if (success) {
			toast.success('Copied to clipboard!');
		} else {
			toast.error('Failed to copy');
		}
	};

	// Handle get referral code button click
	const handleGetCode = async () => {
		if (!isConnected) return;

		try {
			const code = await fetchReferralCode();
			if (code) {
				toast.success('Referral code generated!');
			}
		} catch (err) {
			toast.error(`Failed to generate referral code. ${err}`);
		}
	};

	return (
		<div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-6 p-4">
			<h1 className="text-center font-bold font-mono text-3xl text-primary-200 md:text-5xl">
				Feeling Lucky Yet?
			</h1>

			<div className="text-center font-mono text-lg text-primary-200/50 leading-7">
				Join the waitlist. Start earning{' '}
				<span className="text-green-400">LUCK 🍀</span> by inviting your
				friends. You referred{' '}
				<Badge className="border border-drip-300 bg-drip-300/30 font-mono text-drip-300">
					{amountOfReferrals} {amountOfReferrals === 1 ? 'friend' : 'friends'}
				</Badge>
			</div>

			{/* Referrer notification */}
			{referrerCode && hasAppliedReferral && (
				<div className="w-full rounded-md border-2 border-drip-300 bg-drip-300/10 p-4 text-center">
					<p className="font-mono text-primary-200">
						You&apos;ve been referred by code: {referrerCode}
					</p>
				</div>
			)}

			{/* Connect wallet or show referral code */}
			<div className="flex w-full flex-col items-center gap-4">
				{!isConnected ? (
					<ConnectButton label="Connect Wallet" />
				) : !referralCode ? (
					<Button
						onClick={handleGetCode}
						disabled={isLoading}
						className="w-full bg-drip-300 font-bold font-mono text-secondary-950 hover:bg-drip-300/70"
					>
						{isLoading ? (
							<>
								<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
								Generating...
							</>
						) : (
							'Get Referral Code'
						)}
					</Button>
				) : (
					<div className="flex w-full flex-col gap-4">
						<div className="flex w-full flex-col gap-4 rounded-md border-2 border-primary-200 bg-primary-200/10 p-4">
							<div className="flex items-center justify-between">
								<h3 className="font-bold font-mono text-primary-200">
									Your Referral Code:
								</h3>
							</div>

							<div className="relative flex w-full items-center gap-2">
								<Input
									value={referralCode}
									readOnly
									className="border-primary-200 bg-secondary-950 font-mono text-drip-300"
								/>
								<Button
									onClick={() => handleCopy(referralLink)}
									variant="ghost"
									size="icon"
									className="-translate-y-1/2 absolute top-1/2 right-1"
								>
									<CopyIcon className="h-4 w-4 text-primary-200" />
								</Button>
							</div>
							<Button
								onClick={() => handleCopy(referralLink)}
								className="w-full animate-gradient bg-[linear-gradient(90deg,#F2E718_0%,#80E8A9_20%,#9353ED_50%,#ED5353_75%,#EDA553_100%)] font-bold font-mono text-white"
							>
								<CopyIcon className="mr-2 h-4 w-4" />
								Copy Referral Link
							</Button>
						</div>
					</div>
				)}
			</div>

			{/* Error display */}
			{error && (
				<div className="w-full rounded-md border-2 border-red-400 bg-red-400/10 p-4 text-center">
					<p className="font-mono text-red-400">{error}</p>
				</div>
			)}
		</div>
	);
}
