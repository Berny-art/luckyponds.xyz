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
import { formatAddress, formatValue, getDecimalsByAddress, getTokenSymbolByAddress } from '@/lib/utils';
import { BarChart3, TrendingUp, Trophy, Coins, User, ExternalLink } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAccount } from 'wagmi';
import { Badge } from '@/components/ui/badge';
import type { TossEvent, WinEvent } from '@/types/events';
import { BLOCKSCAN_BASE_URL } from '@/lib/constants';
import { DEFAULT_TOKENS } from '@/stores/appStore';
import { useEventsData } from '@/hooks/useEventsData';

export default function Statistics() {
  const [showPersonalStats, setShowPersonalStats] = useState(false);
  const [selectedTokenFilter, setSelectedTokenFilter] = useState<string>('all');
  const { address } = useAccount();

  // Use the new events data hook
  const {
    tosses,
    wins,
    isFetchingTosses,
    isFetchingWins,
    tossesError,
    winsError,
    hasError,
  } = useEventsData({
    userAddress: showPersonalStats ? address : undefined,
    tokenAddress: selectedTokenFilter,
  });

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!tosses && !wins) return null;

    // When filtering by specific token, show simple totals
    if (selectedTokenFilter !== 'all') {
      const tokenInfo = DEFAULT_TOKENS.find(t => t.address === selectedTokenFilter);
      if (!tokenInfo) return null;

      const totalTossed = tosses.reduce((sum, toss) =>
        sum + Number(toss.amount) / Math.pow(10, tokenInfo.decimals), 0);
      const totalWon = wins.reduce((sum, win) =>
        sum + Number(win.prize) / Math.pow(10, tokenInfo.decimals), 0);

      return {
        totalTosses: tosses.length,
        totalWins: wins.length,
        totalTossed,
        totalWon,
        winRate: tosses.length > 0 ? (wins.length / tosses.length) * 100 : 0,
        avgToss: tosses.length > 0 ? totalTossed / tosses.length : 0,
        avgWin: wins.length > 0 ? totalWon / wins.length : 0,
        tokenSymbol: tokenInfo.symbol,
        singleToken: true,
      };
    }

    // When showing all tokens, show breakdown by token
    const tokenStats: Record<string, {
      symbol: string;
      decimals: number;
      totalTosses: number;
      totalWins: number;
      totalTossed: number;
      totalWon: number;
      winRate: number;
      avgToss: number;
      avgWin: number;
    }> = {};

    // Initialize stats for all available tokens
    DEFAULT_TOKENS.forEach(token => {
      tokenStats[token.address] = {
        symbol: token.symbol,
        decimals: token.decimals,
        totalTosses: 0,
        totalWins: 0,
        totalTossed: 0,
        totalWon: 0,
        winRate: 0,
        avgToss: 0,
        avgWin: 0,
      };
    });

    // Process tosses
    tosses.forEach(toss => {
      const tokenAddress = toss.token_address;
      // Find token stats using case-insensitive comparison
      const tokenStatsEntry = Object.entries(tokenStats).find(([address]) =>
        address.toLowerCase() === tokenAddress.toLowerCase()
      );

      if (tokenStatsEntry) {
        const [, stats] = tokenStatsEntry;
        const decimals = stats.decimals;
        stats.totalTosses += 1;
        stats.totalTossed += Number(toss.amount) / Math.pow(10, decimals);
      }
    });

    // Process wins
    wins.forEach(win => {
      const tokenAddress = win.token_address;
      // Find token stats using case-insensitive comparison
      const tokenStatsEntry = Object.entries(tokenStats).find(([address]) =>
        address.toLowerCase() === tokenAddress.toLowerCase()
      );

      if (tokenStatsEntry) {
        const [, stats] = tokenStatsEntry;
        const decimals = stats.decimals;
        stats.totalWins += 1;
        stats.totalWon += Number(win.prize) / Math.pow(10, decimals);
      }
    });

    // Calculate derived stats
    Object.values(tokenStats).forEach(stats => {
      stats.winRate = stats.totalTosses > 0 ? (stats.totalWins / stats.totalTosses) * 100 : 0;
      stats.avgToss = stats.totalTosses > 0 ? stats.totalTossed / stats.totalTosses : 0;
      stats.avgWin = stats.totalWins > 0 ? stats.totalWon / stats.totalWins : 0;
    });

    // Overall statistics
    const overall = {
      totalTosses: tosses.length,
      totalWins: wins.length,
      totalTossed: Object.values(tokenStats).reduce((sum, stats) => sum + stats.totalTossed, 0),
      totalWon: Object.values(tokenStats).reduce((sum, stats) => sum + stats.totalWon, 0),
      winRate: tosses.length > 0 ? (wins.length / tosses.length) * 100 : 0,
      avgToss: tosses.length > 0 ? Object.values(tokenStats).reduce((sum, stats) => sum + stats.totalTossed, 0) / tosses.length : 0,
      avgWin: wins.length > 0 ? Object.values(tokenStats).reduce((sum, stats) => sum + stats.totalWon, 0) / wins.length : 0,
    };

    return {
      tokenStats,
      overall,
      singleToken: false,
    };
  }, [tosses, wins, selectedTokenFilter]);

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

  return (
    <div className="flex w-full flex-col items-center justify-start pt-4 lg:p-4">
      <div className="flex w-full flex-col gap-6 px-4">
        {/* Header */}
        <div className="flex w-full flex-col items-start gap-4 md:flex-row md:items-center">
          <h1 className="flex flex-col gap-1 font-bold font-mono text-4xl text-primary-200">
            Statistics
          </h1>
          <div className="flex w-full justify-end items-center gap-6 flex-wrap">
            {/* Token Filter */}
            <div className="flex items-center gap-2">
              <label className="font-bold font-mono text-primary-200 text-sm">
                FILTER BY TOKEN:
              </label>
              <select
                value={selectedTokenFilter}
                onChange={(e) => setSelectedTokenFilter(e.target.value)}
                className="bg-primary-200/10 border border-primary-200/20 rounded py-1 text-primary-200 font-mono text-sm"
              >
                <option value="all">All Tokens</option>
                {DEFAULT_TOKENS.map(token => (
                  <option key={token.address} value={token.address}>
                    {token.symbol}
                  </option>
                ))}
              </select>
            </div>

            {address && (
              <div className="flex items-center gap-2">
                <label
                  htmlFor="stats-toggle"
                  className="font-bold font-mono text-primary-200 text-sm cursor-pointer flex items-center gap-2"
                >
                  MY STATS                </label>
                <Switch
                  id="stats-toggle"
                  checked={showPersonalStats}
                  onCheckedChange={setShowPersonalStats}
                  className="data-[state=checked]:bg-drip-300 data-[state=unchecked]:bg-primary-200/20"
                />
                <User className="size-4" />
              </div>
            )}
          </div>
        </div>

        {/* Statistics Summary Cards */}
        {statistics && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Show single token stats or multi-token breakdown */}
            {statistics.singleToken ? (
              <>
                {/* Single Token Cards */}
                <div className="flex flex-col gap-3 rounded-lg bg-primary-200/5 backdrop-blur-lg p-6">
                  <div className="flex items-center gap-2">
                    <Coins className="size-5 text-blue-400" />
                    <span className="font-mono text-primary-200/70 text-sm">Total Tosses</span>
                  </div>
                  <div className="font-bold font-mono text-2xl text-primary-200">
                    {(statistics.totalTosses || 0).toLocaleString()}
                  </div>

                </div>

                <div className="flex flex-col gap-3 rounded-lg bg-primary-200/5 backdrop-blur-lg p-6">
                  <div className="flex items-center gap-2">
                    <Trophy className="size-5 text-yellow-400" />
                    <span className="font-mono text-primary-200/70 text-sm">Total Wins</span>
                  </div>
                  <div className="font-bold font-mono text-2xl text-primary-200">
                    {(statistics.totalWins || 0).toLocaleString()}
                  </div>

                </div>

                <div className="flex flex-col gap-3 rounded-lg bg-primary-200/5 backdrop-blur-lg p-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="size-5 text-green-400" />
                    <span className="font-mono text-primary-200/70 text-sm">Win Rate</span>
                  </div>
                  <div className="font-bold font-mono text-2xl text-green-400">
                    {(statistics.winRate || 0).toFixed(1)}%
                  </div>

                </div>

                <div className="flex flex-col gap-3 rounded-lg bg-primary-200/5 backdrop-blur-lg p-6">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="size-5 text-purple-400" />
                    <span className="font-mono text-primary-200/70 text-sm">Total Tossed</span>
                  </div>
                  <div className="font-bold font-mono text-xl text-primary-200">
                    {(statistics.totalTossed || 0).toFixed(2)} {statistics.tokenSymbol}
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-lg bg-primary-200/5 backdrop-blur-lg p-6">
                  <div className="flex items-center gap-2">
                    <Trophy className="size-5 text-drip-300" />
                    <span className="font-mono text-primary-200/70 text-sm">Total Won</span>
                  </div>
                  <div className="font-bold font-mono text-xl text-drip-300">
                    {(statistics.totalWon || 0).toFixed(2)} {statistics.tokenSymbol}
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-lg bg-primary-200/5 backdrop-blur-lg p-6">
                  <div className="flex items-center gap-2">
                    <Coins className="size-5 text-blue-300" />
                    <span className="font-mono text-primary-200/70 text-sm">Avg Toss</span>
                  </div>
                  <div className="font-bold font-mono text-xl text-primary-200">
                    {(statistics.avgToss || 0).toFixed(2)} {statistics.tokenSymbol}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Multi Token Cards with Breakdown */}
                <div className="flex flex-col gap-3 rounded-lg bg-primary-200/5 backdrop-blur-lg p-6">
                  <div className="flex items-center gap-2">
                    <Coins className="size-5 text-blue-400" />
                    <span className="font-mono text-primary-200/70 text-sm">Total Tosses</span>
                  </div>
                  <div className="font-bold font-mono text-2xl text-primary-200 mb-2">
                    {(statistics.overall?.totalTosses || 0).toLocaleString()}
                  </div>

                </div>

                <div className="flex flex-col gap-3 rounded-lg bg-primary-200/5 backdrop-blur-lg p-6">
                  <div className="flex items-center gap-2">
                    <Trophy className="size-5 text-yellow-400" />
                    <span className="font-mono text-primary-200/70 text-sm">Total Wins</span>
                  </div>
                  <div className="font-bold font-mono text-2xl text-primary-200 mb-2">
                    {(statistics.overall?.totalWins || 0).toLocaleString()}
                  </div>

                </div>

                <div className="flex flex-col gap-3 rounded-lg bg-primary-200/5 backdrop-blur-lg p-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="size-5 text-green-400" />
                    <span className="font-mono text-primary-200/70 text-sm">Win Rate</span>
                  </div>
                  <div className="font-bold font-mono text-2xl text-green-400 mb-2">
                    {(statistics.overall?.winRate || 0).toFixed(1)}%
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-lg bg-primary-200/5 backdrop-blur-lg p-6">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="size-5 text-purple-400" />
                    <span className="font-mono text-primary-200/70 text-sm">Total Tossed</span>
                  </div>

                  <div className="space-y-1">
                    {statistics.tokenStats && Object.entries(statistics.tokenStats).map(([address, stats]) => (
                      stats.totalTossed > 0 && (
                        <div key={address} className="flex justify-between text-sm">
                          <span className="text-primary-200/70">{stats.symbol}:</span>
                          <span className="text-primary-200 font-mono">{stats.totalTossed.toFixed(2)}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-lg bg-primary-200/5 backdrop-blur-lg p-6">
                  <div className="flex items-center gap-2">
                    <Trophy className="size-5 text-drip-300" />
                    <span className="font-mono text-primary-200/70 text-sm">Total Won</span>
                  </div>

                  <div className="space-y-1">
                    {statistics.tokenStats && Object.entries(statistics.tokenStats).map(([address, stats]) => (
                      stats.totalWon > 0 && (
                        <div key={address} className="flex justify-between text-sm">
                          <span className="text-primary-200/70">{stats.symbol}:</span>
                          <span className="text-drip-300 font-mono">{stats.totalWon.toFixed(2)}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-lg bg-primary-200/5 backdrop-blur-lg p-6">
                  <div className="flex items-center gap-2">
                    <Coins className="size-5 text-blue-300" />
                    <span className="font-mono text-primary-200/70 text-sm">Avg Toss</span>
                  </div>

                  <div className="space-y-1">
                    {statistics.tokenStats && Object.entries(statistics.tokenStats).map(([address, stats]) => (
                      stats.totalTosses > 0 && (
                        <div key={address} className="flex justify-between text-sm">
                          <span className="text-primary-200/70">{stats.symbol}:</span>
                          <span className="text-primary-200 font-mono">{stats.avgToss.toFixed(2)}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </>
            )}
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
                  {tosses?.map((toss: TossEvent, index: number) => {
                    const tokenDecimal = getDecimalsByAddress(toss.token_address) || 18;
                    const tokenSymbol = getTokenSymbolByAddress(toss.token_address) || 'HYPE';
                    return (<TableRow
                      key={`${toss.tx_hash}-${index}`}
                      className="border-primary-200/10 border-b text-primary-200 hover:bg-primary-200/5 text-nowrap custom-scrollbar"
                    >
                      <TableCell className="font-mono">
                        {toss.frog_address ? formatAddress(toss.frog_address) : 'You'}
                      </TableCell>
                      <TableCell className="font-bold">
                        <Badge className="border border-blue-400 bg-blue-400/10 text-blue-400">
                          {formatValue(BigInt(toss.amount), tokenDecimal)} {tokenSymbol}
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
                    </TableRow>)
                  })}

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
                  {!isFetchingTosses && (!tosses?.length) && (
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
                  {wins.map((win: WinEvent, index: number) => {
                    const tokenDecimal = getDecimalsByAddress(win.token_address) || 18;
                    const tokenSymbol = getTokenSymbolByAddress(win.token_address) || 'HYPE';
                    return (
                      <TableRow
                        key={`${win.tx_hash}-${index}`}
                        className="border-primary-200/10 border-b text-primary-200 hover:bg-primary-200/5 text-nowrap custom-scrollbar"
                      >
                        <TableCell className="font-mono">
                          {win.winner_address ? formatAddress(win.winner_address) : showPersonalStats ? 'You' : 'N/A'}
                        </TableCell>
                        <TableCell className="font-bold">
                          <Badge className="border border-drip-300 bg-drip-300/10 text-drip-300">
                            {formatValue(BigInt(win.prize), tokenDecimal)} {tokenSymbol}
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
                    )
                  })}

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
                  {!isFetchingWins && (!wins?.length) && (
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