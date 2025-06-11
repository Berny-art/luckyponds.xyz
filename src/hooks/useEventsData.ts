'use client';

import { useQuery } from '@tanstack/react-query';
import type { TossesResponse, WinsResponse } from '@/types/events';

interface UseEventsDataOptions {
  userAddress?: string;
  tokenAddress?: string;
  limit?: number;
  offset?: number;
}

// Fetch tosses data with optional filters
const fetchTosses = async ({
  userAddress,
  tokenAddress,
  limit = 50,
  offset = 0,
}: UseEventsDataOptions): Promise<TossesResponse> => {
  const params = new URLSearchParams();
  
  if (limit) params.append('limit', limit.toString());
  if (offset) params.append('offset', offset.toString());
  if (tokenAddress && tokenAddress !== 'all') params.append('token_address', tokenAddress);

  const url = userAddress 
    ? `/api/events/tosses/${userAddress}?${params.toString()}`
    : `/api/events/tosses?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch tosses data');
  }
  return await response.json();
};

// Fetch wins data with optional filters
const fetchWins = async ({
  userAddress,
  tokenAddress,
  limit = 50,
  offset = 0,
}: UseEventsDataOptions): Promise<WinsResponse> => {
  const params = new URLSearchParams();
  
  if (limit) params.append('limit', limit.toString());
  if (offset) params.append('offset', offset.toString());
  if (tokenAddress && tokenAddress !== 'all') params.append('token_address', tokenAddress);

  const url = userAddress 
    ? `/api/events/wins/${userAddress}?${params.toString()}`
    : `/api/events/wins?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch wins data');
  }
  const data = await response.json();
  console.log('Wins response:', data);
  return data;
};

export function useEventsData(options: UseEventsDataOptions = {}) {
  const { userAddress, tokenAddress, limit = 50, offset = 0 } = options;

  // Query keys that include all relevant parameters
  const tossesQueryKey = ['tosses', userAddress, tokenAddress, limit, offset] as const;
  const winsQueryKey = ['wins', userAddress, tokenAddress, limit, offset] as const;

  // Fetch tosses data
  const tossesQuery = useQuery<TossesResponse, Error>({
    queryKey: tossesQueryKey,
    queryFn: () => fetchTosses({ userAddress, tokenAddress, limit, offset }),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch wins data
  const winsQuery = useQuery<WinsResponse, Error>({
    queryKey: winsQueryKey,
    queryFn: () => fetchWins({ userAddress, tokenAddress, limit, offset }),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    // Tosses data
    tosses: tossesQuery.data?.tosses || [],
    tossesData: tossesQuery.data,
    isFetchingTosses: tossesQuery.isFetching,
    tossesError: tossesQuery.error,
    
    // Wins data  
    wins: winsQuery.data?.winners || winsQuery.data?.wins || [],
    winsData: winsQuery.data,
    isFetchingWins: winsQuery.isFetching,
    winsError: winsQuery.error,
    
    // Combined states
    isLoading: tossesQuery.isLoading || winsQuery.isLoading,
    isFetching: tossesQuery.isFetching || winsQuery.isFetching,
    hasError: !!tossesQuery.error || !!winsQuery.error,
    error: tossesQuery.error || winsQuery.error,
    
    // Refetch functions
    refetchTosses: tossesQuery.refetch,
    refetchWins: winsQuery.refetch,
    refetchAll: () => {
      tossesQuery.refetch();
      winsQuery.refetch();
    },
  };
}
