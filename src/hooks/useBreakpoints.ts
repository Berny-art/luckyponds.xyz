import { useMediaQuery } from 'react-responsive';

/**
 * Custom hook that returns boolean values for Tailwind's responsive breakpoints
 *
 * Breakpoints based on Tailwind's default configuration:
 * - sm: 640px
 * - md: 768px
 * - lg: 1024px
 * - xl: 1280px
 * - 2xl: 1536px
 *
 * @returns Object with boolean values for each breakpoint
 */
export function useResponsiveBreakpoints() {
	const isSm = useMediaQuery({ minWidth: 640 });
	const isMd = useMediaQuery({ minWidth: 768 });
	const isLg = useMediaQuery({ minWidth: 1024 });
	const isXl = useMediaQuery({ minWidth: 1280 });
	const is2Xl = useMediaQuery({ minWidth: 1536 });

	return {
		isSm,
		isMd,
		isLg,
		isXl,
		is2Xl,
	};
}
