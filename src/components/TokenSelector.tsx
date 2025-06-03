// src/components/TokenSelector.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown } from 'lucide-react';
import { cn, formatValue } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { useAppStore, type Token } from '@/stores/appStore';
import { Skeleton } from './ui/skeleton';

interface TokenSelectorProps {
	totalValue?: bigint;
	isLoading?: boolean;
	className?: string;
}

export default function TokenSelector({
	totalValue,
	isLoading = false,
	className,
}: TokenSelectorProps) {
	const [open, setOpen] = useState(false);
	const router = useRouter();
	const {
		selectedToken,
		availableTokens,
		setSelectedToken,
		setSelectedPond,
		clearEvents,
		setPondTypes
	} = useAppStore();

	const handleTokenSelect = (token: Token) => {
		// Only proceed if it's a different token
		if (token.address === selectedToken.address) {
			setOpen(false);
			return;
		}

		// Clear existing data when switching tokens
		clearEvents(); // Clear events from previous token
		setSelectedPond(''); // Reset selected pond
		setPondTypes([]); // Clear pond types to trigger fresh fetch

		// Set the new token
		setSelectedToken(token);
		setOpen(false);

		// Navigate to token-specific route (only if not native)
		if (!token.isNative) {
			router.push(`/ponds/${token.address}`);
		} else {
			// For native token, go to home
			router.push('/');
		}
	};

	const displayAmount = totalValue ? formatValue(totalValue) : '0';

	return (
		<div className={cn('flex items-center gap-4', className)}>
			{/* Display total value */}
			<div className="flex items-center gap-1">
				<span className="font-bold font-mono text-3xl text-drip-300 md:text-5xl">
					{isLoading ? (
						<Skeleton className="h-8 w-12 animate-pulse bg-drip-300/30" />
					) : (
						displayAmount
					)}
				</span>
			</div>
			{/* Token Selector */}
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						// biome-ignore lint/a11y/useSemanticElements: <explanation>
						role="combobox"
						aria-expanded={open}
						className="!py-7 border-2 border-drip-300 bg-primary-200/10 font-mono text-primary-200 hover:bg-primary-200/20 hover:text-primary-200"
					>
						<span className="font-bold text-3xl md:text-5xl">
							{selectedToken.symbol}
						</span>
						<ChevronDown className="!size-6 ml-2" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[300px] border-primary-200 p-0">
					<Command className='bg-secondary-950 text-primary-200 border-2 border-drip-300'>
						<CommandInput
							placeholder="Search tokens..."
							className="text-primary-200"
						/>
						<CommandList >
							<CommandEmpty>No tokens found.</CommandEmpty>
							<CommandGroup>
								{availableTokens.map((token) => (
									<CommandItem
										key={token.address + token.symbol}
										value={token.symbol}
										onSelect={() => handleTokenSelect(token)}
										className="text-primary-200 bg-secondary-950 hover:bg-secondary-900 data-[selected=true]:bg-secondary-200"
									>
										<div className="flex w-full items-center justify-between">
											<div className="flex items-center gap-2">
												<Image
													src={token.logo ?? ''}
													alt={`${token.symbol} logo`}
													width={24}
													height={24}
													className="flex rounded-full"
												/>
												<div className="flex flex-col">
													<span className="font-bold">{token.symbol}</span>
													<span className="text-xs opacity-70">
														{token.name}
													</span>
												</div>
											</div>
											<Check
												className={cn(
													'ml-auto h-4 w-4',
													selectedToken.name === token.name
														? 'opacity-100'
														: 'opacity-0',
												)}
											/>
										</div>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}
