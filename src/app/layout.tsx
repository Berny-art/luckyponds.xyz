import type { Metadata } from 'next';
import { Roboto_Mono } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import HeaderWrapper from '@/components/HeaderWrapper';
import { Toaster } from '@/components/ui/sonner';
import Image from 'next/image';
import { Analytics } from "@vercel/analytics/next"

const RobotoMono = Roboto_Mono({
	variable: '--font-roboto-mono',
	subsets: ['latin'],
	weight: ['700'],
});

export const metadata: Metadata = {
	title: 'Lucky Ponds',
	description: 'A lottery on Hyper Liquid. - Toss. Win. Retire.',
	openGraph: {
		title: 'Lucky Ponds',
		description: 'A lottery on Hyper Liquid. - Toss. Win. Retire.',
		url: 'https://luckyponds.xyz', // Replace with your actual URL
		type: 'website',
		images: [
			{
				url: '/ogimage-min.jpg', // Image in public folder
				width: 1200,
				height: 630,
				alt: 'Lucky Ponds Lottery',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Lucky Ponds',
		description: 'A lottery on Hyper Liquid. - Toss. Win. Retire.',
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
			<head>
				<meta name="apple-mobile-web-app-title" content="Lucky Ponds" />
			</head>
			<body
				className={`${RobotoMono.variable} relative h-screen w-full overflow-x-hidden bg-secondary-950 bg-top font-bold text-roboto-mono text-secondary-950 antialiased lg:overflow-y-hidden `}
			>
				<Providers>
					<HeaderWrapper />
					{children}
					<div className="hidden lg:block -bottom-[0] -z-10 pointer-events-none absolute w-full overflow-y-hidden xl:translate-y-32">
						<Image
							src="/decor.svg"
							alt="decoration"
							width={1920}
							height={400}
							className="w-full object-cover"
							priority={false}
						/>
					</div>
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
				<Analytics />
			</body>
		</html>
	);
}
