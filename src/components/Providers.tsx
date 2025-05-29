'use client';

import merge from 'lodash.merge';
import '@rainbow-me/rainbowkit/styles.css';
import {
	RainbowKitSiweNextAuthProvider,
	type GetSiweMessageOptions,
} from '@rainbow-me/rainbowkit-siwe-next-auth';
import { SessionProvider } from 'next-auth/react';
import {
	RainbowKitProvider,
	darkTheme,
	type Theme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { config } from '@/lib/wagmiConfig';

// import FloatingAnimationRenderer from './FloatingAnimationRenderer';
// import EventWatcher from './EventWatcher';

const frogTheme = merge(darkTheme(), {
	colors: {
		accentColor: '#E6FF55',
		accentColorForeground: '#12221F',
		connectButtonBackground: '#E6FF55',
		connectButtonText: '#12221F',
	},
	radii: {
		actionButton: '6px',
		connectButton: '6px',
		menuButton: '6px',
		modal: '6px',
		modalMobile: '6px',
	},
} as Theme);

// add terms and conditions url: https://lucky-ponds.gitbook.io/lucky-ponds/legal/terms-and-conditions
const getSiweMessageOptions: GetSiweMessageOptions = () => ({
	statement: 'Sign in to Lucky Ponds',
});

// Optimized QueryClient configuration for better performance
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Enable background refetching for real-time data
			refetchOnWindowFocus: true,
			refetchOnReconnect: true,
			refetchIntervalInBackground: true,

			// Reduce stale time for more responsive updates
			staleTime: 5000, // 5 seconds default

			// Keep data fresh but don't over-fetch
			gcTime: 1000 * 60 * 5, // 5 minutes garbage collection

			// Retry configuration for failed requests
			retry: (failureCount, error) => {
				// Don't retry for 4xx errors, but retry for network issues
				if (error instanceof Error && error.message.includes('4')) {
					return false;
				}
				return failureCount < 3;
			},
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
		},
		mutations: {
			// Keep mutations in cache briefly for optimistic updates
			gcTime: 1000 * 30, // 30 seconds
		},
	},
});

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<WagmiProvider config={config}>
			<SessionProvider refetchInterval={0}>
				<QueryClientProvider client={queryClient}>
					<RainbowKitSiweNextAuthProvider
						getSiweMessageOptions={getSiweMessageOptions}
					>
						<RainbowKitProvider modalSize="compact" theme={frogTheme}>
							{/* <EventWatcher /> */}
							{children}
							{/* <FloatingAnimationRenderer /> */}
						</RainbowKitProvider>
					</RainbowKitSiweNextAuthProvider>
				</QueryClientProvider>
			</SessionProvider>
		</WagmiProvider>
	);
}
