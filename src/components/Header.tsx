'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import XIcon from './ui/icons/xIcon';
import DiscordIcon from './ui/icons/discordIcon';
import Link from 'next/link';
import { Badge } from './ui/badge';
import { MenuIcon } from 'lucide-react';
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
	SheetClose,
} from './ui/sheet';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';

export default function Header() {
	const [isMobile, setIsMobile] = useState(false);

	// Check if we're on mobile on client side
	useEffect(() => {
		const checkIsMobile = () => {
			setIsMobile(window.innerWidth < 768); // md breakpoint in Tailwind
		};

		// Initial check
		checkIsMobile();

		// Listen for resize events
		window.addEventListener('resize', checkIsMobile);

		// Cleanup
		return () => window.removeEventListener('resize', checkIsMobile);
	}, []);

	return (
		<header className="w-full px-6 py-2">
			<div className="flex w-full items-center justify-between">
				{/* Logo - always visible */}
				<div className="flex flex-col items-start justify-center">
					<p className="text-nowrap font-bold text-2xl text-drip-300">
						Lucky Ponds
					</p>
					<Link href="https://hyperfrogs.xyz" target="_blank">
						<Badge className="hover:bg-primary-200/80">By Hyper Frogs</Badge>
					</Link>
				</div>

				{/* Desktop Navigation */}
				<div className="hidden lg:flex lg:w-full lg:items-center lg:justify-between">
					<nav className="ml-10 flex justify-center gap-6 font-mono text-primary-200 hover:[&>a]:text-drip-300">
						<Link href="/">Home</Link>
						<span className="text-drip-300">/</span>
						<Link href="#" className="pointer-events-none opacity-50">
							Leaderboard <Badge>SOON</Badge>
						</Link>
						<span className="text-drip-300">/</span>
						<Link href="#" className="pointer-events-none opacity-50">
							Stats <Badge>SOON</Badge>
						</Link>
					</nav>

					<div className="flex items-center justify-end gap-8">
						<nav className="flex gap-6">
							<a
								href="https://discord.gg/pXHSuqCvbm"
								target="_blank"
								rel="noreferrer"
							>
								<DiscordIcon className="size-6 fill-drip-300 hover:fill-primary-200" />
							</a>
							<a
								href="https://x.com/HyperFrogsNFT"
								target="_blank"
								rel="noreferrer"
							>
								<XIcon className="size-6 fill-drip-300 hover:fill-primary-200" />
							</a>
						</nav>
						<ConnectButton
							showBalance={true}
							chainStatus="name"
							accountStatus="address"
						/>
					</div>
				</div>

				{/* Mobile Hamburger Menu */}
				<div className="flex lg:hidden">
					<Sheet>
						<SheetTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="text-drip-300 hover:bg-transparent"
							>
								<MenuIcon className="size-8" />
							</Button>
						</SheetTrigger>
						<SheetContent className="border-drip-300 border-l-2 bg-secondary-950 text-primary-200">
							<SheetHeader className="mb-6">
								<SheetTitle className="text-drip-300">Menu</SheetTitle>
							</SheetHeader>

							<div className="flex flex-col gap-8">
								{/* Mobile Navigation Links */}
								<nav className="flex flex-col gap-4 font-mono">
									<SheetClose asChild>
										<Link
											href="/"
											className="flex items-center py-2 transition-colors hover:text-drip-300"
										>
											Home
										</Link>
									</SheetClose>
									<SheetClose asChild>
										<Link
											href="#"
											className="flex items-center py-2 opacity-50 transition-colors hover:text-drip-300"
										>
											Leaderboard
										</Link>
									</SheetClose>
									<SheetClose asChild>
										<Link
											href="#"
											className="flex items-center py-2 opacity-50 transition-colors hover:text-drip-300"
										>
											Stats <Badge className="ml-2">SOON</Badge>
										</Link>
									</SheetClose>
								</nav>

								{/* Social Links */}
								<div className="flex gap-6">
									<a
										href="https://discord.gg/pXHSuqCvbm"
										target="_blank"
										rel="noreferrer"
									>
										<DiscordIcon className="size-6 fill-drip-300 hover:fill-primary-200" />
									</a>
									<a
										href="https://x.com/HyperFrogsNFT"
										target="_blank"
										rel="noreferrer"
									>
										<XIcon className="size-6 fill-drip-300 hover:fill-primary-200" />
									</a>
								</div>

								{/* Connect Wallet Button */}
								<div className="">
									{isMobile && (
										<ConnectButton
											showBalance={true}
											chainStatus="name"
											accountStatus="address"
										/>
									)}
								</div>
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	);
}
