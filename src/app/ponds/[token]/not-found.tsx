// src/app/ponds/[token]/not-found.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TokenNotFound() {
	return (
		<div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 p-4">
			<div className="text-center">
				<h1 className="font-bold font-mono text-6xl text-primary-200">404</h1>
				<h2 className="mt-4 font-bold font-mono text-2xl text-drip-300">
					Token Not Found / Not Supported
				</h2>
				<p className="mt-2 font-mono font-normal text-primary-200/80">
					The requested token is not supported by Lucky Ponds (yet).
				</p>
			</div>

			<div className="flex flex-col gap-4 font-mono sm:flex-row">
				<Link href="/">
					<Button className="bg-drip-300 text-secondary-950 hover:bg-drip-300/90">
						Return
					</Button>
				</Link>
				<Link href="https://discord.gg/pXHSuqCvbm" target="_blank">
					<Button
						variant={'outline'}
						className="border-2 border-drip-300 bg-drip-300/20 text-drip-300 hover:bg-drip-300/90"
					>
						Submit for approval
					</Button>
				</Link>
			</div>
		</div>
	);
}
