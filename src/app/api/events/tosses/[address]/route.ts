import { type NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache
type CacheEntry = {
	data: any; //eslint-disable-line @typescript-eslint/no-explicit-any
	timestamp: number;
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const cache: Record<string, CacheEntry> = {};

// Rate limiting
const RATE_LIMIT = 20; // Maximum requests per IP per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const rateLimit: Record<string, number[]> = {};

function checkRateLimit(ip: string): boolean {
	const now = Date.now();
	if (!rateLimit[ip]) {
		rateLimit[ip] = [];
	}
	
	// Remove expired entries
	rateLimit[ip] = rateLimit[ip].filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
	
	if (rateLimit[ip].length >= RATE_LIMIT) {
		return false;
	}
	
	rateLimit[ip].push(now);
	return true;
}

/**
 * API route to fetch user-specific tosses events
 * GET /api/events/tosses/[address] - Get tosses for specific user
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ address: string }> }
) {
	try {
		// Get client IP for rate limiting
		const ip =
			request.headers.get('x-forwarded-for') ||
			request.headers.get('x-real-ip') ||
			'unknown';

		// Implement basic rate limiting
		if (!checkRateLimit(ip)) {
			return NextResponse.json(
				{ error: 'Rate limit exceeded. Please try again later.' },
				{ status: 429 },
			);
		}

		const { address } = await params;

		// Validate address format
		if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
			return NextResponse.json(
				{ error: 'Invalid address format' },
				{ status: 400 },
			);
		}

		// Get query parameters for pagination and filtering
		const { searchParams } = new URL(request.url);
		const limit = searchParams.get('limit') || '50';
		const offset = searchParams.get('offset') || '0';
		const tokenAddress = searchParams.get('token_address');

		// Create cache key including token address
		const cacheKey = `tosses-${address}-${limit}-${offset}-${tokenAddress || 'all'}`;

		// Check cache first
		const cached = cache[cacheKey];
		if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
			return NextResponse.json(cached.data);
		}

		// Build the URL with parameters
		const url = new URL(`https://api.luckyponds.xyz/events/tosses/${address}`);
		url.searchParams.append('limit', limit);
		url.searchParams.append('offset', offset);
		if (tokenAddress) {
			url.searchParams.append('token_address', tokenAddress);
		}

		// Make request to external API
		const response = await fetch(url.toString(), {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-API-Key': process.env.API_KEY || '', // Server-side environment variable
			},
		});

		if (!response.ok) {
			if (response.status === 404) {
				return NextResponse.json(
					{ error: 'No tosses found for this address' },
					{ status: 404 },
				);
			}
			console.error('External API error:', response.status, response.statusText);
			return NextResponse.json(
				{ error: 'Failed to fetch tosses data' },
				{ status: response.status },
			);
		}

		const data = await response.json();

		// Cache the result
		cache[cacheKey] = {
			data,
			timestamp: Date.now(),
		};

		return NextResponse.json(data);
	} catch (error) {
		console.error('Error fetching user tosses:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 },
		);
	}
}
