'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAddress, formatValue } from '@/lib/utils';
import { Crown, Medal, Search, Users, X } from 'lucide-react';
import type {
	LeaderboardEntry,
	LeaderboardData,
	SortField,
	SortOrder,
} from '@/types/leaderboard';
import type { UserData } from '@/types/user';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';

// Fetch leaderboard data
const fetchLeaderboard = async (
	sortBy: SortField = 'total_points',
	order: SortOrder = 'DESC',
	limit = 50,
	offset = 0,
): Promise<LeaderboardData> => {
	const url = `/api/leaderboard?sort_by=${sortBy}&order=${order}&limit=${limit}&offset=${offset}`;
	const response = await fetch(url);
	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || 'Failed to fetch leaderboard data');
	}
	return await response.json();
};

// Fetch user data
const fetchUserData = async (address: string): Promise<UserData | null> => {
	if (!address || address.trim() === '') return null;

	try {
		// Simple validation for Ethereum address
		if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
			throw new Error('Invalid address format');
		}

		const response = await fetch(`/api/user/${address}`);
		if (!response.ok) {
			if (response.status === 404) {
				return null; // User not found
			}
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.error || `Failed to fetch user data: ${response.status}`,
			);
		}

		return await response.json();
	} catch (error) {
		console.error('Error fetching user data:', error);
		throw error;
	}
};

export default function Leaderboard() {
	const [sortBy, setSortBy] = useState<SortField>('total_points');
	const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
	const [items, setItems] = useState<LeaderboardEntry[]>([]);
	const [hasMore, setHasMore] = useState(true);
	const [isFetching, setIsFetching] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const [totalUsers, setTotalUsers] = useState(0);
	const [searchInput, setSearchInput] = useState('');
	const [searchAddress, setSearchAddress] = useState('');
	const [errorMessage, setErrorMessage] = useState('');

	const pageSize = 10;
	const observerRef = useRef<HTMLDivElement | null>(null);
	const { address } = useAccount();

	// Fetch next page of leaderboard data
	const fetchNextPage = useCallback(async () => {
		if (isFetching || !hasMore || searchAddress) return;
		setIsFetching(true);
		try {
			const newOffset = items.length;
			const newData = await fetchLeaderboard(
				sortBy,
				sortOrder,
				pageSize,
				newOffset,
			);
			setItems((prev) => [...prev, ...newData.leaderboard]);
			setTotalUsers(newData.total_users);
			setHasMore(newOffset + newData.leaderboard.length < newData.total_users);
		} catch (e) {
			console.error(e);
			setErrorMessage(
				e instanceof Error
					? e.message
					: 'An error occurred loading more results',
			);
		} finally {
			setIsFetching(false);
		}
	}, [items.length, sortBy, sortOrder, hasMore, isFetching, searchAddress]);

	// Set up infinite scroll
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !searchAddress) {
					fetchNextPage();
				}
			},
			{ threshold: 0.5 },
		);
		if (observerRef.current) observer.observe(observerRef.current);
		return () => observer.disconnect();
	}, [fetchNextPage, hasMore, searchAddress]);

	// Refetch on sort changes
	useEffect(() => {
		// Don't refetch if we're in search mode
		if (searchAddress) return;

		const loadInitial = async () => {
			setIsFetching(true);
			setErrorMessage('');
			try {
				const data = await fetchLeaderboard(sortBy, sortOrder, pageSize, 0);
				setItems(data.leaderboard);
				setTotalUsers(data.total_users);
				setHasMore(data.leaderboard.length < data.total_users);
			} catch (e) {
				console.error(e);
				setErrorMessage(
					e instanceof Error ? e.message : 'Failed to load leaderboard data',
				);
			} finally {
				setIsFetching(false);
			}
		};
		loadInitial();
	}, [sortBy, sortOrder, searchAddress]);

	// Handle searching for a specific user
	const handleSearch = async (addressToSearch: string) => {
		if (!addressToSearch) return;

		setIsSearching(true);
		setErrorMessage('');
		try {
			const data = await fetchUserData(addressToSearch);
			if (data) {
				setSearchAddress(addressToSearch);
				// Convert to LeaderboardEntry format to display in the table
				setItems([
					{
						address: data.address,
						total_points: data.total_points,
						toss_points: data.toss_points,
						winner_points: data.winner_points,
						referral_points: data.referral_points,
						rank: data.rank,
						total_tosses: data.total_tosses,
						total_wins: data.total_wins,
						total_value_spent: data.total_value_spent,
					},
				]);
				setHasMore(false);
			} else {
				setErrorMessage(
					`No data found for address ${formatAddress(addressToSearch)}`,
				);
				setSearchAddress('');
				// Reload general leaderboard
				const data = await fetchLeaderboard(sortBy, sortOrder, pageSize, 0);
				setItems(data.leaderboard);
				setTotalUsers(data.total_users);
				setHasMore(data.leaderboard.length < data.total_users);
			}
		} catch (e) {
			console.error(e);
			setErrorMessage(
				e instanceof Error ? e.message : 'Error searching for user',
			);
			setSearchAddress('');
		} finally {
			setIsSearching(false);
		}
	};

	// Handle clearing the search and restoring leaderboard
	const clearSearch = async () => {
		setSearchInput('');
		setSearchAddress('');
		setErrorMessage('');

		// Reload general leaderboard
		setIsFetching(true);
		try {
			const data = await fetchLeaderboard(sortBy, sortOrder, pageSize, 0);
			setItems(data.leaderboard);
			setTotalUsers(data.total_users);
			setHasMore(data.leaderboard.length < data.total_users);
		} catch (e) {
			console.error(e);
			setErrorMessage(
				e instanceof Error ? e.message : 'Failed to load leaderboard data',
			);
		} finally {
			setIsFetching(false);
		}
	};

	// Sorting functions
	const handleSort = (field: SortField) => {
		if (field === sortBy) {
			setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
		} else {
			setSortBy(field);
			setSortOrder('DESC');
		}
	};

	const getSortIndicator = (field: SortField) => {
		if (sortBy !== field) return null;
		return sortOrder === 'ASC' ? ' ↑' : ' ↓';
	};

	const getMedal = (rank: number) => {
		switch (rank) {
			case 1:
				return <Crown className="size-5 text-drip-300" />;
			case 2:
				return <Medal className="size-5 text-primary-200" />;
			case 3:
				return <Medal className="size-5 text-orange-400" />;
			default:
				return <span className="w-5 text-center text-primary-200">{rank}</span>;
		}
	};

	const formatPoints = (points: number) => {
		if (points >= 1000000) return `${(points / 1_000_000).toFixed(1)}M`;
		if (points >= 1000) return `${(points / 1_000).toFixed(1)}K`;
		return points.toString();
	};

	const valueSpend = (value: string) => {
		return Number(value) / 1_000_000_000_000_000_000;
	};

	return (
		<div className="flex w-full flex-col items-center justify-start pt-4 lg:p-4">
			<div className="flex w-full flex-col gap-6 px-4">
				<div className="flex w-full flex-col items-start gap-4 md:flex-row md:items-center">
					<h1 className="w-full font-bold font-mono text-4xl text-primary-200">
						Leaderboard
					</h1>
					<div className="flex items-center gap-2">
						<div className="relative">
							<Input
								placeholder={
									address ? `${formatAddress(address)}` : 'Search by address'
								}
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								onBlur={() => {
									if (searchInput && !isSearching) {
										handleSearch(searchInput);
									}
								}}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && !isSearching) {
										handleSearch(searchInput);
									}
								}}
								className="w-21 border-2 border-primary-200 bg-primary-200/10 text-primary-200 placeholder:text-primary-200/50 focus-visible:border-primary-200 focus-visible:ring-0"
							/>
						</div>
						{address && !searchAddress && (
							<Button
								variant="default"
								onClick={() => {
									setSearchInput(address);
									handleSearch(address);
								}}
								className="w-auto bg-drip-300 font-bold font-mono text-secondary-950 hover:bg-drip-300/80 hover:text-secondary-950"
							>
								<Search className="mr-2 size-4" /> FIND ME
							</Button>
						)}
						{searchAddress && (
							<Button
								variant="default"
								onClick={clearSearch}
								className="w-auto bg-red-500 font-bold font-mono text-white hover:bg-red-500/80 hover:text-white"
							>
								Clear
							</Button>
						)}
					</div>
				</div>

				{/* Error message display */}
				{errorMessage && (
					<div className="rounded-lg border-2 border-red-500 bg-red-500/10 p-4 text-red-400">
						{errorMessage}
					</div>
				)}

				<div className="scrollbar-custom w-full overflow-x-auto rounded-lg bg-primary-200/5 p-4">
					<Table>
						<TableHeader>
							<TableRow className="border-primary-200/20 border-b font-mono hover:bg-primary-200/5">
								<TableHead className="w-16 font-bold text-primary-200">
									Rank
								</TableHead>
								<TableHead className="w-full min-w-32 font-bold text-primary-200 lg:min-w-48">
									Address
								</TableHead>
								<TableHead className="min-w-32 font-bold text-primary-200 lg:min-w-48">
									# Tosses
								</TableHead>
								<TableHead className="min-w-32 font-bold text-primary-200 lg:min-w-48">
									# Value
								</TableHead>
								<TableHead className="min-w-32 font-bold text-primary-200 lg:min-w-48">
									# Wins
								</TableHead>
								{['total_points', 'referral_points'].map((field) => (
									<TableHead
										key={field}
										className="min-w-48 cursor-pointer font-bold text-primary-200 hover:text-drip-300"
										onClick={() => handleSort(field as SortField)}
									>
										<div className="flex items-center gap-1">
											<span>
												{field
													.replace('_', ' ')
													.replace('total ', '# ')
													.replace(/\b\w/g, (l) => l.toUpperCase())}
												{getSortIndicator(field as SortField)}
											</span>
											{field === 'referral_points' && (
												<Users className="size-4" />
											)}
										</div>
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((entry, index) => (
								<TableRow
									key={`${entry.address}-${index}`}
									className={`border-primary-200/10 border-b text-primary-200 hover:bg-primary-200/5 ${
										searchAddress &&
										entry.address.toLowerCase() === searchAddress.toLowerCase()
											? 'bg-drip-300/10'
											: ''
									}`}
								>
									<TableCell className="font-bold">
										{getMedal(entry.rank || index + 1)}
									</TableCell>
									<TableCell className="font-mono">
										{formatAddress(entry.address)}
									</TableCell>
									<TableCell className="font-bold">
										{entry.total_tosses}
									</TableCell>
									<TableCell className="font-bold">
										{valueSpend(entry.total_value_spent).toFixed(4)} HYPE
									</TableCell>
									<TableCell className="font-bold">
										{entry.total_wins}
									</TableCell>
									<TableCell className="font-bold text-drip-300">
										{formatPoints(entry.total_points || 0)}
									</TableCell>
									<TableCell>
										{formatPoints(entry.referral_points || 0)}
									</TableCell>
								</TableRow>
							))}

							{/* Skeletons during fetch */}
							{(isFetching || isSearching) &&
								Array(searchAddress ? 1 : 5)
									.fill(0)
									.map((_, i) => (
										<TableRow
											key={`skeleton-${
												// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
												i
											}`}
										>
											{Array(7)
												.fill(0)
												.map((_, j) => (
													<TableCell
														key={`cell-${i}-${
															// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
															j
														}`}
													>
														<Skeleton className="h-6 w-full bg-primary-200/10" />
													</TableCell>
												))}
										</TableRow>
									))}

							{/* Empty state if no results */}
							{!isFetching && !isSearching && items.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={7}
										className="py-8 text-center text-primary-200/50"
									>
										No results found
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>

					{/* Scroll loader trigger - only show if not in search mode */}
					{!searchAddress && <div ref={observerRef} className="h-8 w-full" />}
				</div>

				<div className="mt-4 text-center text-primary-200/70 text-sm">
					{searchAddress
						? `Showing user data for ${formatAddress(searchAddress)}`
						: `Showing ${items.length} of ${totalUsers} players • Leaderboard updates every hour.`}
				</div>
			</div>
		</div>
	);
}
