import type { Metadata } from 'next';
import { Roboto_Mono } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import Header from '@/components/Header';
import { Toaster } from '@/components/ui/sonner';
import Image from 'next/image';

const RobotoMono = Roboto_Mono({
	variable: '--font-roboto-mono',
	subsets: ['latin'],
	weight: ['700'],
});

export const metadata: Metadata = {
	title: 'Hyper Frogs Rarity',
	description: 'Check your Hyper Frogs Rarity with the official checker.',
	openGraph: {
		title: 'Hyper Frogs Rarity',
		description: 'Check your Hyper Frogs Rarity with the official checker.',
		url: 'https://hyperfrogs.xyz', // Replace with your actual URL
		type: 'website',
		images: [
			{
				url: '/ogimage-min.jpg', // Image in public folder
				width: 1200,
				height: 630,
				alt: 'Hyper Frogs Rarity Checker',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Hyper Frogs Rarity',
		description: 'Check your Hyper Frogs Rarity with the official checker.',
		creator: '@HyperFrogsNFT',
		site: '@HyperFrogsNFT',
		images: '/ogimage-min.jpg',
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
				className={`${RobotoMono.variable} relative lg:overflow-y-hidden w-full overflow-x-hidden bg-secondary-950 bg-top font-bold text-roboto-mono text-secondary-950 antialiased `}
			>
				{/* <div className="flex h-8 w-full items-center justify-center bg-drip-300 text-secondary-950 text-xs underline">
					<a
						href="https://discord.gg/pXHSuqCvbm"
						target="_blank"
						rel="noreferrer"
					>
						Join the Discord, you are just one leap away.
					</a>
				</div> */}
				<Providers>
					<Header />
					{children}
				</Providers>
				<Toaster
					expand={true}
					toastOptions={{
						classNames: {
							toast:
								'!bg-primary-100 !text-secondary-950 !border-none !shadow-lg',
							title: '!font-bold !font-roboto-mono text-sm',
							description: '!font-mono !text-sm !text-secondary-950',
						},
					}}
				/>
				<div className="lg:-translate-y-16 pointer-events-none absolute z-0 w-full overflow-y-hidden">
					<Image
						src="/decor.svg"
						alt="decoration"
						width={1920}
						height={400}
						className="w-full object-cover"
						priority={false}
					/>
				</div>
			</body>
		</html>
	);
}
