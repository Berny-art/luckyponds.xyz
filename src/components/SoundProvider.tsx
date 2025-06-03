'use client';

import { useSounds } from '@/hooks/useSounds';

export default function SoundProvider({ children }: { children: React.ReactNode }) {
	// Initialize sounds globally
	useSounds();

	return <>{children}</>;
}
