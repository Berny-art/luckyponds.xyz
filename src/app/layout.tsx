import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/sonner"

const RobotoMono = Roboto_Mono({
	variable: "--font-roboto-mono",
	subsets: ["latin"],
	weight: ["700"],
});

export const metadata: Metadata = {
	title: "Hyper Frogs Rarity",
	description: "Check your Hyper Frogs Rarity with the official checker.",
	openGraph: {
		title: "Hyper Frogs Rarity",
		description: "Check your Hyper Frogs Rarity with the official checker.",
		url: "https://rarity.hyperfrogs.xyz", // Replace with your actual URL
		type: "website",
		images: [
			{
				url: "/ogimage-min.jpg", // Image in public folder
				width: 1200,
				height: 630,
				alt: "Hyper Frogs Rarity Checker",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Hyper Frogs Rarity",
		description: "Check your Hyper Frogs Rarity with the official checker.",
		creator: "@HyperFrogsNFT",
		site: "@HyperFrogsNFT",
		images: "/ogimage-min.jpg",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${RobotoMono.variable} antialiased bg-secondary-950 text-roboto-mono font-bold`}
			>
				<div className="flex items-center justify-center w-full h-8 bg-drip-300 text-secondary-950 text-xs underline">
					<a
						href="https://www.netprotocol.app/app/bazaar/hyperliquid/0x4Adb7665C72ccdad25eD5B0BD87c34e4Ee9Da3c4?tab=listings"
						target="_blank"
						rel="noreferrer"
					>
						Buy a Hyper Frog on Hyper Liquid (community marketplace)
					</a>
				</div>
				<Providers>
					<Header />
					{children}
				</Providers>
				<Toaster  
					expand={true} 
					toastOptions={{classNames: {
						toast: '!bg-primary-100 !text-secondary-950 !border-none !shadow-lg',
						title: '!font-bold !font-roboto-mono text-sm',
						description: '!font-mono !text-sm !text-secondary-950'
					} }}
				/>
			</body>
		</html>
	);
}
