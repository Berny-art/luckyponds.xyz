'use client';

import { useState, useEffect, useMemo, type ChangeEvent } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { formatEther, parseEther } from 'viem';
import { useAccount, useBalance } from 'wagmi';
import CoinTossButton from './CoinTossButton';
import type { PondComprehensiveInfo } from '@/lib/types';
import { useAppStore } from '@/stores/appStore';
import { formatValue } from '@/lib/utils';

export default function CoinTossInput({
	pondInfo,
	onTransactionSuccess,
	timeRemaining,
	isAboutToEnd,
}: {
	pondInfo: PondComprehensiveInfo;
	onTransactionSuccess?: () => void;
	timeRemaining?: number;
	isAboutToEnd?: boolean;
}) {
	const { address } = useAccount();
	const { selectedToken, showAnimation } = useAppStore();

	// Get balance for the selected token (native or ERC20)
	const { data: balance } = useBalance({
		address,
		token: selectedToken?.isNative ? undefined : selectedToken?.address as `0x${string}`
	});

	const isConnected = !!address;

	const [numberOfTosses, setNumberOfTosses] = useState(1);
	const [tossAmount, setTossAmount] = useState('0');

	// Get the price per toss from pond info
	const minTossPrice = pondInfo?.minTossPrice || parseEther('0.01');
	const remainingAmount = pondInfo?.remainingTossAmount || parseEther('10');
	const maxTotalAmount = pondInfo?.maxTotalTossAmount || parseEther('10');

	// Format the toss price for display
	const formattedTossPrice = formatEther(minTossPrice);

	// Calculate max possible tosses based on user balance and remaining pond amount
	const maxTosses = useMemo(() => {
		if (!balance || !pondInfo) return 1;

		// Calculate how many tosses are possible based on different constraints

		// 1. User's balance constraint - how many tosses can they afford?
		const maxFromBalance = balance.value / minTossPrice;

		// 2. Pond's remaining capacity constraint
		const maxFromRemaining = remainingAmount / minTossPrice;

		// 3. Any per-user maximum constraint (if applicable)
		const maxFromUserLimit = maxTotalAmount / minTossPrice;

		// Take the minimum of all constraints
		const maxPossible = Math.floor(
			Math.min(
				Number(maxFromBalance),
				Number(maxFromRemaining),
				Number(maxFromUserLimit),
			),
		);

		// Ensure at least 1 toss is possible, unless user can't afford any
		return maxPossible > 0 ? maxPossible : Number(maxFromBalance) >= 1 ? 1 : 0;
	}, [balance, pondInfo, minTossPrice, remainingAmount, maxTotalAmount]);

	// Update toss amount when number of tosses changes
	useEffect(() => {
		if (pondInfo) {
			const newAmount = (BigInt(numberOfTosses) * minTossPrice).toString();
			setTossAmount(newAmount);
		}
	}, [numberOfTosses, minTossPrice, pondInfo]);

	// Handle increment/decrement buttons
	const increment = (e: React.MouseEvent) => {
		if (numberOfTosses < maxTosses) {
			setNumberOfTosses((prev) => prev + 1);

			// Ensure we have valid coordinates and delay slightly to avoid race conditions
			setTimeout(() => {
				// Use clientX/Y for position relative to viewport
				const x = e.clientX;
				const y = e.clientY;

				if (x && y) {
					showAnimation({ x, y });
				}
			}, 10);
		}
	};

	const decrement = () => {
		if (numberOfTosses > 1) {
			setNumberOfTosses((prev) => prev - 1);
		}
	};

	// Set to maximum possible tosses
	const setMaximum = (e: React.MouseEvent) => {
		const oldValue = numberOfTosses;

		// Only update if the max is greater than current value
		if (maxTosses > oldValue) {
			setNumberOfTosses(maxTosses);
			// Ensure we have valid coordinates and delay slightly
			setTimeout(() => {
				const x = e.clientX;
				const y = e.clientY;

				if (x && y) {
					showAnimation({ x, y });
				}
			}, 10);
		}
	};

	// Handle direct input change
	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		const value = Number.parseInt(e.target.value, 10);

		// Validate input
		if (Number.isNaN(value)) {
			setNumberOfTosses(1);
		} else if (value < 1) {
			setNumberOfTosses(1);
		} else if (value > maxTosses) {
			setNumberOfTosses(maxTosses);
		} else {
			setNumberOfTosses(value);
		}
	};

	const tokenSymbol = selectedToken?.symbol || 'UNKNOWN';
	const canToss = balance && balance.value >= minTossPrice;

	return (
		<div className="flex w-full flex-col gap-4">
			{/* Grid layout for equal heights */}
			<div className="grid w-full gap-4 md:grid-cols-[1fr,auto]">
				<div className="flex w-full items-center gap-4 rounded-lg bg-primary-200 px-4 py-2 font-mono text-black">
					<div className="flex flex-col md:w-full">
						<div className='flex flex-col gap-0'>
							<div className="flex items-center gap-2">
								<h3 className="font-bold text-lg">Tosses</h3>

								<p className="text-nowrap text-xs opacity-60">
									({formattedTossPrice} {tokenSymbol} / Toss)
								</p>
							</div>
						</div>
						<p className='text-nowrap text-xs text-secondary-950'>Balance: {formatValue(balance?.value)} {balance?.symbol}</p>

						{!canToss && isConnected && (
							<p className="mt-1 text-red-600 text-xs">
								Insufficient balance for tossing
							</p>
						)}
					</div>

					<div className="relative flex w-full items-center gap-2">
						<Button
							onClick={decrement}
							className="size-4 rounded-lg bg-secondary-950 p-4 text-white hover:bg-secondary-950/80"
							variant="secondary"
							disabled={!canToss}
						>
							-
						</Button>

						<Input
							type="text"
							value={numberOfTosses}
							onChange={handleInputChange}
							min={1}
							max={maxTosses}
							className="border-2 border-secondary-950 text-center font-bold text-xl shadow-none"
							disabled={!canToss}
							onBlur={() => {
								// Ensure valid value on blur
								if (Number.isNaN(numberOfTosses) || numberOfTosses < 1) {
									setNumberOfTosses(1);
								}
							}}
						/>

						<Button
							onClick={increment}
							className="size-4 rounded-lg bg-secondary-950 p-4 text-white hover:bg-secondary-950/80"
							variant="secondary"
							disabled={!canToss || numberOfTosses >= maxTosses}
						>
							+
						</Button>
					</div>
				</div>

				{/* Max button with equal height */}
				<Button
					onClick={setMaximum}
					className="flex h-auto items-center justify-center rounded-lg border-2 border-primary-200 bg-transparent text-primary-200 hover:bg-primary-200/10"
					variant="default"
					disabled={!canToss || numberOfTosses >= maxTosses}
				>
					<span className="font-bold">Max</span>
				</Button>
			</div>

			{
				pondInfo && (
					<CoinTossButton
						amount={formatEther(BigInt(tossAmount))}
						numberOfTosses={numberOfTosses}
						pondInfo={pondInfo}
						onTransactionSuccess={onTransactionSuccess}
						timeRemaining={timeRemaining}
						isAboutToEnd={isAboutToEnd}
						canToss={canToss}
					/>
				)
			}
		</div >
	);
}
