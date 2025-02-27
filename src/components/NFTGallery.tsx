'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSortStore } from '@/store/sortStore';
import Image from "next/image";
import {
	Dialog,
	DialogContent,
	DialogTrigger,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import NFTDialogContent from './NFTDialogContent';
import { Gem } from 'lucide-react';

export const revalidate = 604800;

export type NFTMetadata = {
  nft_id: number;
  name: string;
  description: string;
  attributes: {
    trait_type: string;
    value: string;
    rarity_percent?: number;
    rarity_score?: number;
  }[];
  image: string;
  total_rarity_score: number;
  rank: number;
};

const NFTGallery = () => {
  const [nfts, setNfts] = useState<NFTMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [initialFetch, setInitialFetch] = useState(true); // ✅ Track if it's the first fetch
  const { sortBy, sortOrder, searchTokenId, traitFilters, page, setPage } = useSortStore();
  const observer = useRef<IntersectionObserver | null>(null);
  const prevFilters = useRef({ sortBy, sortOrder, searchTokenId, traitFilters });

  // ✅ Detect changes in filters and reset NFTs & Page correctly
  useEffect(() => {
    const filtersChanged =
      sortBy !== prevFilters.current.sortBy ||
      sortOrder !== prevFilters.current.sortOrder ||
      searchTokenId !== prevFilters.current.searchTokenId ||
      JSON.stringify(traitFilters) !== JSON.stringify(prevFilters.current.traitFilters);

    if (filtersChanged) {
      setNfts([]);  // ✅ Clear NFT list
      setPage(1);   // ✅ Reset to first page
      setHasMore(true); // ✅ Reset infinite scroll
      setInitialFetch(true); // ✅ Ensure initial fetch
      prevFilters.current = { sortBy, sortOrder, searchTokenId, traitFilters }; // ✅ Save new filters
    }
  }, [sortBy, sortOrder, searchTokenId, traitFilters, setPage]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: loading triggers rerender infinitely
  useEffect(() => {
    const fetchNFTs = async () => {
      if (!hasMore || loading) return;
      setLoading(true);

      try {
        const query = new URLSearchParams({
          sortBy: sortBy === "id" ? "nft_id" : "rank",
          sortOrder,
          page: page.toString(),
          searchTokenId: searchTokenId || "",
          traitFilters: JSON.stringify(traitFilters),
        }).toString();

        const res = await fetch(`/api/nfts?${query}`);
        if (!res.ok) throw new Error('Failed to fetch NFT data');

        const data = await res.json();

        if (page === 1) {
          setNfts(data.data); // ✅ Replace list on first page
          setInitialFetch(false); // ✅ Stop treating subsequent loads as "first" fetch
        } else {
          setNfts((prevNfts) => [...prevNfts, ...data.data]); // ✅ Append NFTs for infinite scroll
        }

        setHasMore(data.data.length > 0);
      } catch (error) {
        console.error(error);
      }
      
      setLoading(false);
    };

    fetchNFTs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, page, searchTokenId, sortBy, sortOrder, traitFilters]);

  // ✅ Intersection Observer to trigger next page load
  const lastNFTRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(page + 1); // ✅ Load next page
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore, setPage, page]);

  return (
    <div className="p-4 text-primary-200">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {nfts.map((nft, index) => (
          <div key={nft.nft_id} ref={index === nfts.length - 1 ? lastNFTRef : null} className="flex flex-col">
            <Dialog>
              <DialogTrigger>
                <div className="flex w-full items-center justify-between font-bold mb-1 px-2">
                  <span>#{nft.nft_id}</span>
                  <div className="flex items-center justify-start gap-2 text-drip-300 text-sm">
                    <Gem size={14} />
                    {nft.rank}
                  </div>
                </div>
                <Image
                  src={nft.image}
                  alt={nft.name}
                  width={400}
                  height={400}
                  className="rounded-lg"
                />
              </DialogTrigger>
              <DialogContent className="bg-primary-200 text-secondary-950 m-0 p-0 mt-8 max-w-full md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-lg border-none rounded overflow-auto overflow-y-scroll max-h-screen scrollbar-custom [&>button]:text-primary-200 md:[&>button]:text-secondary-950">
                <DialogHeader className="hidden">
                  <DialogTitle>{nft.name}</DialogTitle>
                </DialogHeader>
                <NFTDialogContent nft={nft} />
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </div>

      {loading && <div className="text-primary-200 mt-6 text-center">Loading more NFTs...</div>}
      {!hasMore && !loading && <div className="text-primary-200 mt-6 text-center">No more NFTs to load.</div>}
    </div>
  );
};

export default NFTGallery;
