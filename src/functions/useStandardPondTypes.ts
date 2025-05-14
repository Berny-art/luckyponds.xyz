import { useReadContract } from 'wagmi';
import { luckyPondsContractConfig } from '@/contracts/LuckyPonds';

export type EnrichedPond = {
	type: string; // the bytes32 pondType
	name: 'Daily' | 'Weekly' | 'Monthly' | 'Custom';
};

export default function useStandardPondTypes(): EnrichedPond[] {
	const { data } = useReadContract({
		...luckyPondsContractConfig,
		functionName: 'getStandardPondTypes',
		args: [],
	});

	if (!data) return [];

	// Since data returns as [0]:string [1]:string [2]:string
	const names: EnrichedPond['name'][] = ['Daily', 'Weekly', 'Monthly'];

	// Handle data as an object with numeric keys (like [0], [1], [2])
	return names.map((name, index) => ({
		type: data[index as keyof typeof data] as string,
		name,
	}));
}
