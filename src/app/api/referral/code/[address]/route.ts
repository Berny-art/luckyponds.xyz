import { type NextRequest, NextResponse } from 'next/server';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ address: string }> },
) {
	try {
		const { address } = await params;

		// Validate the address
		if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
			return NextResponse.json(
				{ error: 'Invalid Ethereum address' },
				{ status: 400 },
			);
		}

		// Call the Lucky Ponds API to get or create a referral code
		const apiUrl = `https://api.luckyponds.xyz/referral/code/${address}`;

		const response = await fetch(apiUrl, {
			headers: {
				'X-API-Key': process.env.API_KEY || '', // Server-side environment variable
				'Content-Type': 'application/json',
			},
			cache: 'no-store', // Don't use Next.js cache for this request
		});

		if (!response.ok) {
			console.error(`API request failed with status ${response.status}`);
			let errorMessage = 'Error fetching referral code';

			try {
				const errorData = await response.json();
				errorMessage = errorData.message || errorData.error || errorMessage;
			} catch {
				errorMessage = `API error: ${response.statusText}`;
			}

			return NextResponse.json(
				{ error: errorMessage },
				{ status: response.status },
			);
		}

		// Parse the data and return it
		const data = await response.json();

		return NextResponse.json(data);
	} catch (error) {
		console.error('Error in referral code API route:', error);
		return NextResponse.json(
			{
				error: 'Failed to fetch referral code',
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
