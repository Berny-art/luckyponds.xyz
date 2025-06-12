'use client';

import Image from "next/image";
import { useEventsData } from "@/hooks/useEventsData";
import { useMemo } from "react";
import type { TossEvent, WinEvent } from "@/types/events";
import { DEFAULT_TOKENS } from "@/stores/appStore";
import { formatAddress, formatValue } from "@/lib/utils";
import Marquee from "react-fast-marquee";

type CombinedEvent = {
  id: string;
  type: 'toss' | 'win';
  address: string;
  amount: number;
  tokenSymbol: string;
  tokenImage: string;
  timestamp: string;
};

function getTokenInfo(tokenAddress: string) {
  const token = DEFAULT_TOKENS.find(
    (token) => token.address.toLowerCase() === tokenAddress.toLowerCase()
  );

  return {
    symbol: token?.symbol || 'TOKEN',
    image: token?.logo || 'https://assets.coingecko.com/coins/images/54657/standard/alright_buddy_pfp.png?1740895394',
    decimals: token?.decimals || 18
  };
}

export default function BottomBar() {
  const { tosses, wins, isLoading } = useEventsData({ limit: 5 });

  const combinedEvents = useMemo((): CombinedEvent[] => {
    const events: CombinedEvent[] = [];

    // Process tosses
    tosses.forEach((toss: TossEvent, index) => {
      const tokenInfo = getTokenInfo(toss.token_address);
      events.push({
        id: `toss-${toss.tx_hash}-${index}`,
        type: 'toss',
        address: toss.frog_address,
        amount: formatValue(BigInt(toss.amount), tokenInfo.decimals),
        tokenSymbol: tokenInfo.symbol,
        tokenImage: tokenInfo.image,
        timestamp: toss.timestamp,
      });
    });

    // Process wins
    wins.forEach((win: WinEvent, index) => {
      const tokenInfo = getTokenInfo(win.token_address);
      events.push({
        id: `win-${win.tx_hash}-${index}`,
        type: 'win',
        address: win.winner_address || win.selector,
        amount: formatValue(BigInt(win.prize), tokenInfo.decimals),
        tokenSymbol: tokenInfo.symbol,
        tokenImage: tokenInfo.image,
        timestamp: win.timestamp,
      });
    });

    // Sort by timestamp (newest first) and take only the latest 10
    return events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, [tosses, wins]);

  return (
    <div className="fixed bottom-0 left-0 bg-[#344441] w-full flex gap-4 h-6 md:h-8 overflow-hidden">
      <div className="flex w-full items-center">
        <div className="flex h-full items-center justify-center font-mono font-bold text-sm md:text-base text-secondary-950 bg-drip-300 px-4 md:px-8 z-10">
          LIVE
        </div>

        {/* Scrolling events container */}
        <div className="flex overflow-hidden relative">
          {isLoading ? (
            // Loading state
            <div className="flex items-center gap-2 px-4 text-primary-200 font-mono text-sm uppercase h-full">
              <p>Loading recent events...</p>
            </div>
          ) : combinedEvents.length === 0 ? (
            // No events state
            <div className="flex items-center gap-2 px-4 text-primary-200 font-mono text-sm uppercase h-full">
              <p>No recent events</p>
            </div>
          ) : (
            // Marquee scrolling events
            <Marquee
              speed={50}
              gradient={false}
              className="h-full"
            >
              {combinedEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-2 px-4 text-primary-200 font-mono text-sm uppercase">
                  <p>
                    {formatAddress(event.address)} {event.type === 'toss' ? '🫳 TOSSED' : '🎉 WON'}{' '}
                    <span className="text-drip-300">{event.amount}</span> {event.tokenSymbol}
                  </p>
                  <Image
                    src={event.tokenImage}
                    alt={`${event.tokenSymbol} logo`}
                    width={18}
                    height={18}
                    className="flex rounded-full"
                  />
                </div>
              ))}
            </Marquee>
          )}
        </div>
      </div>
    </div>
  )
}