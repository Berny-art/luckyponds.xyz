// lib/wagmiConfig.ts
import { getDefaultConfig, type Chain } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";

export const hyperliquid = {
	id: Number(process.env.NEXT_PUBLIC_CHAIN_ID) ?? 999,
	name: Number(process.env.NEXT_PUBLIC_CHAIN_ID) === 999 ? "HyperLiquid EVM" : "Hyperliquid Testnet",
	iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/32196.png",
	iconBackground: "#12221F",
	nativeCurrency: { name: "Hype", symbol: "HYPE", decimals: 18 },
	rpcUrls: {
		default: { http: [String(process.env.NEXT_PUBLIC_RPC_URL)] },
	},
	blockExplorers: {
		default: {
			name: "Blockscout",
			url: "https://hyperliquid.cloud.blockscout.com/",
		},
		purrsec: { name: "Purrsec", url: "https://purrsec.com/" },
	},
} as const satisfies Chain;

export const config = getDefaultConfig({
	appName: "Hyper Frogs",
	projectId: process.env.WC_PROJECT_ID ?? "ID",
	chains: [hyperliquid],
	ssr: true,
	transports: {
		[hyperliquid.id]: http(),
	},
});
