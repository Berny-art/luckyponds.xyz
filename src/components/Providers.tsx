'use client';

import merge from 'lodash.merge';
import '@rainbow-me/rainbowkit/styles.css';
import {
	RainbowKitProvider,
	darkTheme,
	type Theme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { config } from '@/lib/wagmiConfig';
import FloatingAnimationRenderer from './FloatingAnimationRenderer';
import EventWatcher from './EventWatcher';

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

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<RainbowKitProvider modalSize="compact" theme={frogTheme} coolMode>
					<EventWatcher />
					{children}
					<FloatingAnimationRenderer />
				</RainbowKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}
