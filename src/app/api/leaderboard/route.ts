import { type NextRequest, NextResponse } from 'next/server';
import type {
	LeaderboardData,
	SortField,
	SortOrder,
} from '@/types/leaderboard';

// Simple in-memory cache
type CacheEntry = {
	data: LeaderboardData;
	timestamp: number;
};

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds
const cache: Record<string, CacheEntry> = {};

// Create a simple rate limiter with a sliding window
const RATE_LIMIT = 10; // Maximum requests per IP per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const rateLimit: Record<string, number[]> = {};

/**
 * Server-side API route that proxies requests to the leaderboard API
 * This keeps the API key secure on the server
 */
export async function GET(request: NextRequest) {
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

		// Get query parameters for sorting and pagination
		const { searchParams } = new URL(request.url);
		const limit = searchParams.get('limit') || '10';
		const offset = searchParams.get('offset') || '0';
		const order = (searchParams.get('order') || 'DESC') as SortOrder;
		const sortBy = (searchParams.get('sort_by') || 'total_points') as SortField;

		// Build the URL with parameters
		const url = new URL('https://api.luckyponds.xyz/leaderboard');
		url.searchParams.append('limit', limit);
		url.searchParams.append('offset', offset);
		url.searchParams.append('order', order);
		url.searchParams.append('sort_by', sortBy);

		// Create a cache key based on the URL
		const cacheKey = url.toString();

		// Check if we have a valid cached response
		const cachedResponse = getCachedResponse(cacheKey);
		if (cachedResponse) {
			return NextResponse.json(cachedResponse);
		}

		// Make the request to the external API with the API key
		const response = await fetch(url, {
			headers: {
				'X-API-Key': process.env.API_KEY || '', // Server-side environment variable
				'Content-Type': 'application/json',
			},
			cache: 'no-store', // Don't use Next.js cache for this request
		});

		// Check if the request was successful
		if (!response.ok) {
			console.error(`API request failed with status ${response.status}`);

			// Try to get error details from the response
			let errorMessage = 'Error fetching leaderboard data';
			try {
				const errorData = await response.json();
				errorMessage = errorData.message || errorData.error || errorMessage;
				console.error('API error details:', errorData);
			} catch {
				// If we can't parse the error JSON, just use the status text
				errorMessage = `API error: ${response.statusText}`;
			}

			return NextResponse.json(
				{ error: errorMessage },
				{ status: response.status },
			);
		}

		// Parse the data
		const data: LeaderboardData = await response.json();

		// Validate the response structure
		if (!data || !data.leaderboard) {
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
		console.error('Error in leaderboard API route:', error);
		return NextResponse.json(
			{
				error: 'Failed to fetch leaderboard data',
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
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
function getCachedResponse(key: string): LeaderboardData | null {
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
function cacheResponse(key: string, data: LeaderboardData): void {
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
