import { type NextRequest, NextResponse } from 'next/server';
import type { UserData, ApiErrorResponse } from '@/types/user';

// Simple in-memory cache
type CacheEntry = {
	data: UserData;
	timestamp: number;
};

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds
const cache: Record<string, CacheEntry> = {};

// Create a simple rate limiter with a sliding window
const RATE_LIMIT = 20; // Maximum requests per IP per minute for user data
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const rateLimit: Record<string, number[]> = {};

/**
 * Server-side API route that proxies requests to the user API
 * This keeps the API key secure on the server
 *
 * @param request The incoming request
 * @param params Object containing route parameters, including the address
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: { address: string } },
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

		// Validate the address parameter
		const { address } = params;
		if (!address || !isValidAddress(address)) {
			return NextResponse.json(
				{ error: 'Invalid Ethereum address' },
				{ status: 400 },
			);
		}

		// Create a cache key based on the address
		const cacheKey = `user-${address.toLowerCase()}`;

		// Check if we have a valid cached response
		const cachedResponse = getCachedResponse(cacheKey);
		if (cachedResponse) {
			return NextResponse.json(cachedResponse);
		}

		// Build the URL for the external API
		const apiUrl = `https://api.luckyponds.xyz/user/${address}`;

		// Make the request to the external API with the API key
		const response = await fetch(apiUrl, {
			headers: {
				'X-API-Key': process.env.API_KEY || '', // Server-side environment variable
				'Content-Type': 'application/json',
			},
			cache: 'no-store', // Don't use Next.js cache for this request
		});

		// Check if the request was successful
		if (!response.ok) {
			console.error(
				`API request failed with status ${response.status} for address ${address}`,
			);

			// Try to get error details from the response
			let errorMessage = 'Error fetching user data';
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			let errorDetails: any = {}; //eslint-disable-line @typescript-eslint/no-explicit-any

			try {
				errorDetails = await response.json();
				errorMessage =
					errorDetails.message || errorDetails.error || errorMessage;
			} catch {
				// If we can't parse the error JSON, just use the status text
				errorMessage = `API error: ${response.statusText}`;
			}

			// Handle specific error cases
			if (response.status === 404) {
				return NextResponse.json(
					{
						error: 'User not found',
						details: 'The specified address was not found in the database',
					},
					{ status: 404 },
				);
			}

			return NextResponse.json(
				{ error: errorMessage, details: errorDetails },
				{ status: response.status },
			);
		}

		// Parse the data
		const data: UserData = await response.json();

		// Validate the response structure
		if (!data || !data.address) {
			console.error('Unexpected API response format:', data);
			return NextResponse.json(
				{ error: 'Unexpected API response format' },
				{ status: 500 },
			);
		}

		// Store in cache
		cacheResponse(cacheKey, data);

		// Add a cache-control header to the response
		const headers = new Headers();
		headers.set(
			'Cache-Control',
			'public, s-maxage=900, stale-while-revalidate=60',
		);

		return NextResponse.json(data, { headers });
	} catch (error) {
		console.error('Error in user API route:', error);

		// Prepare error response
		const errorResponse: ApiErrorResponse = {
			error: 'Failed to fetch user data',
			details: error instanceof Error ? error.message : String(error),
		};

		return NextResponse.json(errorResponse, { status: 500 });
	}
}

/**
 * Basic validation for Ethereum addresses
 * @param address The address to validate
 * @returns Boolean indicating if the address is valid
 */
function isValidAddress(address: string): boolean {
	// Basic validation: Check for 0x prefix and proper length (42 characters for standard addresses)
	return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Checks and updates rate limit for an IP
 * @param ip Client IP address
 * @returns Boolean indicating if request should proceed
 */
function checkRateLimit(ip: string): boolean {
	const now = Date.now();

	// Initialize if this is the first request from this IP
	if (!rateLimit[ip]) {
		rateLimit[ip] = [];
	}

	// Filter out requests outside the current window
	rateLimit[ip] = rateLimit[ip].filter(
		(timestamp) => now - timestamp < RATE_LIMIT_WINDOW,
	);

	// Check if rate limit exceeded
	if (rateLimit[ip].length >= RATE_LIMIT) {
		return false;
	}

	// Add current request to the list
	rateLimit[ip].push(now);
	return true;
}

/**
 * Gets cached response if valid
 * @param key Cache key
 * @returns Cached data or null
 */
function getCachedResponse(key: string): UserData | null {
	const entry = cache[key];
	if (!entry) return null;

	// Check if cache entry is still valid
	if (Date.now() - entry.timestamp < CACHE_TTL) {
		return entry.data;
	}

	// Clear expired cache
	delete cache[key];
	return null;
}

/**
 * Stores response in cache
 * @param key Cache key
 * @param data Response data
 */
function cacheResponse(key: string, data: UserData): void {
	cache[key] = {
		data,
		timestamp: Date.now(),
	};

	// Implement cache cleanup to prevent memory leaks
	setTimeout(() => {
		if (cache[key] && Date.now() - cache[key].timestamp >= CACHE_TTL) {
			delete cache[key];
		}
	}, CACHE_TTL + 1000);
}
