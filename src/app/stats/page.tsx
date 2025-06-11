'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAddress } from '@/lib/utils';
import { BarChart3, TrendingUp, Trophy, Coins, User, ExternalLink } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAccount } from 'wagmi';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import type { TossesResponse, WinsResponse, TossEvent, WinEvent } from '@/types/events';
import { BLOCKSCAN_BASE_URL } from '@/lib/constants';

// Fetch tosses data
const fetchTosses = async (address?: string): Promise<TossesResponse> => {
  const url = address ? `/api/events/tosses/${address}` : '/api/events/tosses';
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch tosses data');
  }
  return await response.json();
};

// Fetch wins data
const fetchWins = async (address?: string): Promise<WinsResponse> => {
  const url = address ? `/api/events/wins/${address}` : '/api/events/wins';
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch wins data');
  }
  return await response.json();
};

export default function Statistics() {
  const [showPersonalStats, setShowPersonalStats] = useState(false);
  const { address } = useAccount();

  // Query keys
  const queryKeys = {
    tosses: (address?: string) => ['tosses', address] as const,
    wins: (address?: string) => ['wins', address] as const,
  };

  // Fetch tosses data
  const {
    data: tossesData,
    isFetching: isFetchingTosses,
    error: tossesError,
  } = useQuery<TossesResponse, Error>({
    queryKey: queryKeys.tosses(showPersonalStats ? address : undefined),
    queryFn: () => fetchTosses(showPersonalStats ? address : undefined),
    enabled: !showPersonalStats || !!address,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch wins data
  const {
    data: winsData,
    isFetching: isFetchingWins,
    error: winsError,
  } = useQuery<WinsResponse, Error>({
    queryKey: queryKeys.wins(showPersonalStats ? address : undefined),
    queryFn: () => fetchWins(showPersonalStats ? address : undefined),
    enabled: !showPersonalStats || !!address,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!tossesData && !winsData) return null;

    const tosses = tossesData?.tosses || [];
    // Handle both response formats for wins
    const wins = winsData?.winners || winsData?.wins || [];

    const totalTosses = tosses.length;
    const totalWins = wins.length;
    const totalTossed = tosses.reduce((sum, toss) => sum + Number(toss.amount) / 1e18, 0);
    const totalWon = wins.reduce((sum, win) => sum + Number(win.prize) / 1e18, 0);
    const winRate = totalTosses > 0 ? (totalWins / totalTosses) * 100 : 0;
    const avgToss = totalTosses > 0 ? totalTossed / totalTosses : 0;
    const avgWin = totalWins > 0 ? totalWon / totalWins : 0;

    return {
      totalTosses,
      totalWins,
      totalTossed,
      totalWon,
      winRate,
      avgToss,
      avgWin,
    };
  }, [tossesData, winsData]);

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1_000).toFixed(2)}K`;
    return value.toFixed(4);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatHash = (hash: string | null | undefined) => {
    if (!hash) return 'N/A';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const hasError = tossesError || winsError;

  return (
    <div className="flex w-full flex-col items-center justify-start pt-4 lg:p-4">
      <div className="flex w-full flex-col gap-6 px-4">
        {/* Header */}
        <div className="flex w-full flex-col items-start gap-4 md:flex-row md:items-center">
          <h1 className="font-bold font-mono text-4xl text-primary-200">
            Statistics
          </h1>
          <div className="flex items-center gap-2">
            {address && (
              <div className="flex items-center gap-3 ml-4">

                <Switch
                  id="stats-toggle"
                  checked={showPersonalStats}
                  onCheckedChange={setShowPersonalStats}
                  className="data-[state=checked]:bg-drip-300 data-[state=unchecked]:bg-primary-200/20"
                />
                <label
                  htmlFor="stats-toggle"
                  className="font-bold font-mono text-primary-200 text-sm cursor-pointer flex items-center gap-2"
                >

                  SHOW MY STATS
                  <User className="size-4" />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Summary Cards */}
        {statistics && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
            <div className="flex flex-col gap-2 rounded-lg bg-primary-200/5 backdrop-blur-lg p-4">
              <div className="flex items-center gap-2">
                <Coins className="size-5 text-blue-400" />
                <span className="font-mono text-primary-200/70 text-sm">Total Tosses</span>
              </div>
              <div className="font-bold font-mono md:text-2xl text-primary-200">
                {statistics.totalTosses.toLocaleString()}
              </div>
            </div>
            <div className="flex flex-col rounded-lg bg-primary-200/5 backdrop-blur-lg p-4 gap-2">
              <div className="flex items-center gap-2">
                <Trophy className="size-5 text-yellow-400" />
                <span className="font-mono text-primary-200/70 text-sm">Total Wins</span>
              </div>
              <div className="font-bold font-mono md:text-2xl text-primary-200">
                {statistics.totalWins.toLocaleString()}
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-lg bg-primary-200/5 backdrop-blur-lg p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-5 text-green-400" />
                <span className="font-mono text-primary-200/70 text-sm">Win Rate</span>
              </div>
              <div className="font-bold font-mono md:text-2xl text-green-400">
                {statistics.winRate.toFixed(1)}%
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-lg bg-primary-200/5 backdrop-blur-lg p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-5 text-purple-400" />
                <span className="font-mono text-primary-200/70 text-sm">Tossed</span>
              </div>
              <div className="font-bold font-mono md:text-xl text-primary-200">
                {formatValue(statistics.totalTossed)} HYPE
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-lg bg-primary-200/5 backdrop-blur-lg p-4">
              <div className="flex items-center gap-2">
                <Trophy className="size-5 text-drip-300" />
                <span className="font-mono text-primary-200/70 text-sm">Won</span>
              </div>
              <div className="font-bold font-mono md:text-xl text-drip-300">
                {formatValue(statistics.totalWon)} HYPE
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-lg bg-primary-200/5 backdrop-blur-lg p-4">
              <div className="flex items-center gap-2">
                <Coins className="size-5 text-blue-300" />
                <span className="font-mono text-primary-200/70 text-sm">Avg Toss</span>
              </div>
              <div className="font-bold font-mono md:text-xl text-primary-200">
                {formatValue(statistics.avgToss)} HYPE
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-lg bg-primary-200/5 backdrop-blur-lg p-4">
              <div className="flex items-center gap-2">
                <Trophy className="size-5 text-yellow-300" />
                <span className="font-mono text-primary-200/70 text-sm">Avg Win</span>
              </div>
              <div className="font-bold font-mono md:text-xl text-primary-200">
                {formatValue(statistics.avgWin)} HYPE
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {hasError && (
          <div className="rounded-lg border-2 border-red-500 bg-red-500/10 p-4 text-red-400">
            {tossesError?.message || winsError?.message || 'Failed to load statistics'}
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Tosses Table */}
          <div className="flex flex-col gap-4">
            <h2 className="flex items-center gap-2 font-bold font-mono text-2xl text-primary-200">
              <Coins className="size-6 text-blue-400" />
              Recent Tosses
            </h2>
            <div className="scrollbar-custom max-h-[60vh] overflow-y-auto overflow-x-auto rounded-lg bg-primary-200/5 backdrop-blur-lg p-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-primary-200/20 border-b font-mono hover:bg-primary-200/5">
                    <TableHead className="font-bold text-primary-200">Address</TableHead>
                    <TableHead className="font-bold text-primary-200">Amount</TableHead>
                    <TableHead className="font-bold text-primary-200">Date</TableHead>
                    <TableHead className="font-bold text-primary-200">TX</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tossesData?.tosses?.map((toss: TossEvent, index: number) => (
                    <TableRow
                      key={`${toss.tx_hash}-${index}`}
                      className="border-primary-200/10 border-b text-primary-200 hover:bg-primary-200/5 text-nowrap custom-scrollbar"
                    >
                      <TableCell className="font-mono">
                        {toss.frog_address ? formatAddress(toss.frog_address) : 'You'}
                      </TableCell>
                      <TableCell className="font-bold">
                        <Badge className="border border-blue-400 bg-blue-400/10 text-blue-400">
                          {formatValue(Number(toss.amount || 0) / 1e18)} HYPE
                        </Badge>
                      </TableCell>
                      <TableCell className="text-primary-200/70 text-sm">
                        {toss.timestamp ? formatDate(toss.timestamp) : 'N/A'}
                      </TableCell>
                      <TableCell className="font-mono text-primary-200/70 text-sm">
                        {toss.tx_hash ? (
                          <a
                            href={`${BLOCKSCAN_BASE_URL}tx/${toss.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-primary-200 transition-colors"
                          >
                            {formatHash(toss.tx_hash)}
                            <ExternalLink className="size-3" />
                          </a>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Loading skeletons */}
                  {isFetchingTosses &&
                    Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <TableRow key={`toss-skeleton-${i}`}>
                          {Array(4)
                            .fill(0)
                            .map((_, j) => (
                              <TableCell key={`toss-cell-${i}-${j}`}>
                                <Skeleton className="h-6 w-full bg-primary-200/10" />
                              </TableCell>
                            ))}
                        </TableRow>
                      ))}

                  {/* Empty state */}
                  {!isFetchingTosses && (!tossesData?.tosses?.length) && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-8 text-center text-primary-200/50"
                      >
                        No tosses found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Wins Table */}
          <div className="flex flex-col gap-4">
            <h2 className="flex items-center gap-2 font-bold font-mono text-2xl text-primary-200">
              <Trophy className="size-6 text-yellow-400" />
              Recent Wins
            </h2>
            <div className="scrollbar-custom max-h-[60vh] overflow-y-auto overflow-x-auto rounded-lg bg-primary-200/5 backdrop-blur-lg p-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-primary-200/20 border-b font-mono hover:bg-primary-200/5">
                    <TableHead className="font-bold text-primary-200">Address</TableHead>
                    <TableHead className="font-bold text-primary-200">Amount</TableHead>
                    <TableHead className="font-bold text-primary-200">Date</TableHead>
                    <TableHead className="font-bold text-primary-200">TX</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(winsData?.winners || winsData?.wins || []).map((win: WinEvent, index: number) => (
                    <TableRow
                      key={`${win.tx_hash}-${index}`}
                      className="border-primary-200/10 border-b text-primary-200 hover:bg-primary-200/5 text-nowrap custom-scrollbar"
                    >
                      <TableCell className="font-mono">
                        {win.winner_address ? formatAddress(win.winner_address) : showPersonalStats ? 'You' : 'N/A'}
                      </TableCell>
                      <TableCell className="font-bold">
                        <Badge className="border border-drip-300 bg-drip-300/10 text-drip-300">
                          {formatValue(Number(win.prize || 0) / 1e18)} HYPE
                        </Badge>
                      </TableCell>
                      <TableCell className="text-primary-200/70 text-sm">
                        {win.timestamp ? formatDate(win.timestamp) : 'N/A'}
                      </TableCell>
                      <TableCell className="font-mono text-primary-200/70 text-sm">
                        {win.tx_hash ? (
                          <a
                            href={`${BLOCKSCAN_BASE_URL}tx/${win.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-primary-200 transition-colors"
                          >
                            {formatHash(win.tx_hash)}
                            <ExternalLink className="size-3" />
                          </a>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Loading skeletons */}
                  {isFetchingWins &&
                    Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <TableRow key={`win-skeleton-${i}`}>
                          {Array(4)
                            .fill(0)
                            .map((_, j) => (
                              <TableCell key={`win-cell-${i}-${j}`}>
                                <Skeleton className="h-6 w-full bg-primary-200/10" />
                              </TableCell>
                            ))}
                        </TableRow>
                      ))}

                  {/* Empty state */}
                  {!isFetchingWins && (!(winsData?.winners || winsData?.wins)?.length) && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-8 text-center text-primary-200/50"
                      >
                        No wins found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-4 text-center text-primary-200/70 text-sm">
          {showPersonalStats && address
            ? `Showing statistics for ${formatAddress(address)}`
            : `Showing overall platform statistics • Data updates every 5m.`}
        </div>
      </div>
    </div>
  );
}