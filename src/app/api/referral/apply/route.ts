import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		// Parse the request body
		const body = await request.json();
		const { address, referral_code } = body;

		// Validate the address and referral code
		if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
			return NextResponse.json(
				{ error: 'Invalid Ethereum address' },
				{ status: 400 },
			);
		}

		if (!referral_code) {
			return NextResponse.json(
				{ error: 'Referral code is required' },
				{ status: 400 },
			);
		}

		// Call the Lucky Ponds API to apply the referral code
		const apiUrl = 'https://api.luckyponds.xyz/referral/apply';

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				'X-API-Key': process.env.API_KEY || '', // Server-side environment variable
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				address,
				referral_code,
			}),
		});

		if (!response.ok) {
			console.error(`API request failed with status ${response.status}`);
			let errorMessage = 'Error applying referral code';

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

		return NextResponse.json({
			success: true,
			...data,
		});
	} catch (error) {
		console.error('Error in apply referral API route:', error);
		return NextResponse.json(
			{
				error: 'Failed to apply referral code',
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
