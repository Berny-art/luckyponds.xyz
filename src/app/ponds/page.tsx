// src/app/page.tsx
'use client';

import PondInterface from '@/components/PondInterface';

export default function Home() {
	// Home page always shows native token ponds
	return <PondInterface />;
}
