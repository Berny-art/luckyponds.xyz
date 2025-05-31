'use client';

import { Suspense } from 'react';
import Header from './Header';

// Fallback component for when suspense is loading
function HeaderFallback() {
  return (
    <header className="w-full px-2 py-2 lg:px-6">
      <div className="flex w-full items-center justify-between">
        {/* Simplified header during loading */}
        <div className="flex w-full items-center gap-2">
          <div className="mt-1 flex items-center gap-2">
            <div className="h-[52px] w-[52px] bg-drip-300/20 rounded" />
          </div>
          <div className="flex flex-col items-start justify-center">
            <p className="text-nowrap font-bold text-2xl text-drip-300">
              Lucky Ponds
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function HeaderWrapper() {
  return (
    <Suspense fallback={<HeaderFallback />}>
      <Header />
    </Suspense>
  );
}
