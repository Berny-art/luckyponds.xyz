import { useReadContract } from 'wagmi';
import { luckyPondsContractConfig } from '@/contracts/LuckyPonds';

export default function getAllPondTypes() {
	const { data: allPondTypes } = useReadContract({
		...luckyPondsContractConfig,
		functionName: 'getAllPondTypes',
		args: [],
	});
	return allPondTypes as string[];
}
