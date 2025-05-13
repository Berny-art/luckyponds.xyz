'use client';

import { useState, useEffect } from 'react';
import { useReadContracts } from 'wagmi';
import { luckyPondsContractConfig } from '@/contracts/LuckyPonds';
import { formatAddress } from '@/lib/utils';
import { formatEther } from 'viem';

interface ParticipantInfo {
	address: string;
	value: string;
}

export default function InfiniteScrollTopbar() {
	const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Get standard pond types
	const { data: pondTypesResult } = useReadContracts({
		contracts: [
			{
				...luckyPondsContractConfig,
				functionName: 'getStandardPondTypes',
			},
		],
	});

	// Get all pond participants once we have pond types
	const standardPondTypes = pondTypesResult?.[0].result;

	const { data: pondParticipantsResults, isSuccess } = useReadContracts({
		contracts: standardPondTypes
			? [
					{
						...luckyPondsContractConfig,
						functionName: 'getPondParticipants',
						args: [standardPondTypes[0]], // daily
					},
					{
						...luckyPondsContractConfig,
						functionName: 'getPondParticipants',
						args: [standardPondTypes[1]], // weekly
					},
					{
						...luckyPondsContractConfig,
						functionName: 'getPondParticipants',
						args: [standardPondTypes[2]], // monthly
					},
				]
			: [],
		query: {
			enabled: !!standardPondTypes,
		},
	});

	// Process participants when data is available
	useEffect(() => {
		if (isSuccess && pondParticipantsResults) {
			setIsLoading(false);
			const allParticipants: ParticipantInfo[] = [];

			// Process each pond's participants
			// biome-ignore lint/complexity/noForEach: <explanation>
			pondParticipantsResults.forEach((result) => {
				if (result.status === 'success' && result.result) {
					const pondParticipants = result.result as {
						participant: string;
						tossAmount: string;
					}[];

					// Format participant data
					for (const participant of pondParticipants) {
						allParticipants.push({
							address: participant.participant,
							value: formatEther(BigInt(participant.tossAmount)),
						});
					}
				}
			});

			// If we have some participants
			if (allParticipants.length > 0) {
				// Shuffle the participants
				const shuffled = [...allParticipants].sort(() => 0.5 - Math.random());

				// If we have fewer than 15 participants, duplicate them to ensure enough content for scrolling
				while (shuffled.length < 15) {
					shuffled.push(...shuffled);
				}

				setParticipants(shuffled);
			}
		}
	}, [pondParticipantsResults, isSuccess]);

	// If no participants, show loading
	if (isLoading) {
		return (
			<div className="flex h-8 w-full items-center justify-center bg-drip-300 text-secondary-950 text-xs">
				Loading participants...
			</div>
		);
	}

	// If no participants after loading, show message
	if (participants.length === 0) {
		return (
			<div className="flex h-8 w-full items-center justify-center bg-drip-300 text-secondary-950 text-xs">
				No participants found
			</div>
		);
	}

	// Calculate animation duration based on number of items
	const animationDuration = Math.max(20, participants.length * 2);

	return (
		<div className="h-8 w-full overflow-hidden bg-drip-300 text-secondary-950 text-xs">
			<div className="marquee-container inline-flex">
				{/* First copy for seamless loop */}
				<div
					className="marquee-content flex"
					style={{
						animation: `scrollLeft ${animationDuration}s linear infinite`,
					}}
				>
					{participants.map((participant, index) => (
						<div
							key={`${participant.address}-${index}`}
							className="inline-flex items-center px-4 font-mono"
						>
							<span>{formatAddress(participant.address)}</span>
							<span className="mx-1">/</span>
							{/* biome-ignore lint/style/useNumberNamespace: <explanation> */}
							<span>{parseFloat(participant.value).toFixed(4)} ETH</span>
						</div>
					))}
				</div>

				{/* Second copy for seamless loop */}
				<div
					className="marquee-content flex"
					style={{
						animation: `scrollLeft ${animationDuration}s linear infinite`,
						animationDelay: `-${animationDuration / 2}s`,
					}}
				>
					{participants.map((participant, index) => (
						<div
							key={`${participant.address}-${index}-duplicate`}
							className="inline-flex items-center px-4 font-mono"
						>
							<span>{formatAddress(participant.address)}</span>
							<span className="mx-1">/</span>
							<span>{Number.parseFloat(participant.value).toFixed(4)} ETH</span>
						</div>
					))}
				</div>
			</div>

			{/* CSS for animation */}
			<style jsx>{`
        .marquee-container {
          display: inline-flex;
          width: auto;
          white-space: nowrap;
          overflow: hidden;
        }
        
        .marquee-content {
          display: flex;
          white-space: nowrap;
        }
        
        @keyframes scrollLeft {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
		</div>
	);
}
