"use client"; // ✅ This makes it a Client Component
import merge from 'lodash.merge';
import "@rainbow-me/rainbowkit/styles.css";
import {
	getDefaultConfig,
	RainbowKitProvider,
  darkTheme,
	type Chain,
  type Theme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const hyperliquid = {
	id: 999,
	name: "Hyperliquid",
	iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/32196.png",
	iconBackground: "#12221F",
	nativeCurrency: { name: "Hype", symbol: "HYPE", decimals: 18 },
	rpcUrls: {
		default: { http: ["https://rpc.hyperliquid.xyz/evm"] },
	},
	blockExplorers: {
		default: {
			name: "Blockscout",
			url: "https://hyperliquid.cloud.blockscout.com/",
		},
		purrsec: { name: "Purrsec", url: "https://purrsec.com/" },
	},
} as const satisfies Chain;

const config = getDefaultConfig({
	appName: "Hyper Frogs",
	projectId: process.env.WC_PROJECT_ID ?? 'ID',
	chains: [hyperliquid],
	ssr: true,
});

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
				<RainbowKitProvider
					modalSize="compact"
					theme={frogTheme}
					coolMode
				>
					{children}
				</RainbowKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}
