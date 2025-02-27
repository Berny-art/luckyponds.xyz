import { ConnectButton } from "@rainbow-me/rainbowkit";
import Logo from "./ui/logo";
import XIcon from "./ui/icons/xIcon";
import DiscordIcon from "./ui/icons/discordIcon";

export default function Header() {
	return (
		<div className="flex items-center md:flex-row w-full px-6 py-4 gap-8">
			<div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 w-1/2 md:1/4 xl:w-1/5">
				<Logo />
				<div className="flex gap-4 items-center">
					<a
						href="https://x.com/HyperFrogsNFT"
						target="_blank"
						rel="noreferrer"
					>
						<XIcon className="fill-drip-300 hover:fill-primary-200 size-5 md:size-6" />
					</a>
					<a
						href="https://discord.gg/pXHSuqCvbm"
						target="_blank"
						rel="noreferrer"
					>
						<DiscordIcon className="fill-drip-300 hover:fill-primary-200 size-5 md:size-6" />
					</a>
				</div>
			</div>
			<div className="flex w-1/2 justify-end md:3/4 xl:w-4/5">
				<ConnectButton
					showBalance={false}
					chainStatus="name"
					accountStatus="address"
				/>
			</div>
		</div>
	);
}
