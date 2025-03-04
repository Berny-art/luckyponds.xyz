import { ConnectButton } from "@rainbow-me/rainbowkit";
import Logo from "./ui/logo";
import XIcon from "./ui/icons/xIcon";
import DiscordIcon from "./ui/icons/discordIcon";
import Link from "next/link";

export default function Header() {
	return (
		<header className="w-full px-6 py-4">
			<div className="flex w-full flex-col md:flex-row items-center justify-between gap-8">
				<div className="flex w-full flex-col md:flex-row items-center gap-4 md:gap-10">
					<div className="min-w-[275px]">
						<Logo />
					</div>
					<nav className="flex gap-4 md:gap-6 text-primary-200 hover:text-drip-300 font-mono">
						<Link href="/">Home</Link>
						<span className="text-drip-300">/</span>
						<Link href="/snapshot">Snapshot Tool</Link>
					</nav>
				</div>
				<div className="flex w-full items-center justify-between md:justify-end md:gap-8">
					<nav className="flex gap-6">
						<a
							href="https://discord.gg/pXHSuqCvbm"
							target="_blank"
							rel="noreferrer"
						>
							<DiscordIcon className="fill-drip-300 hover:fill-primary-200 size-5 md:size-6" />
						</a>
						<a
							href="https://x.com/HyperFrogsNFT"
							target="_blank"
							rel="noreferrer"
						>
							<XIcon className="fill-drip-300 hover:fill-primary-200 size-5 md:size-6" />
						</a>
					</nav>
					<ConnectButton
						showBalance={false}
						chainStatus="name"
						accountStatus="address"
					/>
				</div>
			</div>
		</header>
	);
}
