import { useReadContract } from 'wagmi';
import { luckyPondsContractConfig } from '@/contracts/LuckyPonds';

export default function useAllPondTypes() {
	const { data: allPondTypes } = useReadContract({
		...luckyPondsContractConfig,
		functionName: 'getAllPondTypes',
		args: [],
	});
	return allPondTypes as string[];
}
