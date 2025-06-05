/**
 * Types for events API endpoints (tosses and wins)
 * Based on actual API response structure
 */

/**
 * Represents a single toss event
 */
export interface TossEvent {
	/**
	 * Amount tossed (in wei/smallest unit)
	 */
	amount: string;

	/**
	 * Block number where the toss occurred
	 */
	block_number: number;

	/**
	 * Frog address (user's address who made the toss)
	 */
	frog_address: string;

	/**
	 * Toss ID (only in user-specific responses)
	 */
	id?: number;

	/**
	 * Pond type identifier
	 */
	pond_type: string;

	/**
	 * Timestamp of the toss (ISO string)
	 */
	timestamp: string;

	/**
	 * Token address being tossed
	 */
	token_address: string;

	/**
	 * Total tosses in this pond
	 */
	total_pond_tosses: number;

	/**
	 * Total value in this pond
	 */
	total_pond_value: string;

	/**
	 * Transaction hash
	 */
	tx_hash: string;
}

/**
 * Represents a single win event
 */
export interface WinEvent {
	/**
	 * Block number where the win occurred
	 */
	block_number: number;

	/**
	 * Win ID (only in user-specific responses)
	 */
	id?: number;

	/**
	 * Pond type identifier
	 */
	pond_type: string;

	/**
	 * Prize amount won (in wei/smallest unit)
	 */
	prize: string;

	/**
	 * Selector address
	 */
	selector: string;

	/**
	 * Timestamp of the win (ISO string)
	 */
	timestamp: string;

	/**
	 * Token address that was won
	 */
	token_address: string;

	/**
	 * Transaction hash
	 */
	tx_hash: string;

	/**
	 * Winner's wallet address (only in general responses)
	 */
	winner_address?: string;
}

/**
 * Response structure for tosses API
 */
export interface TossesResponse {
	/**
	 * Current limit used
	 */
	limit: number;

	/**
	 * Current offset used
	 */
	offset: number;

	/**
	 * Array of toss events
	 */
	tosses: TossEvent[];

	/**
	 * Total number of tosses (for pagination)
	 */
	total_tosses: number;

	/**
	 * User address (only in user-specific responses)
	 */
	address?: string;
}

/**
 * Response structure for wins API
 */
export interface WinsResponse {
	/**
	 * Current limit used
	 */
	limit: number;

	/**
	 * Current offset used
	 */
	offset: number;

	/**
	 * Total number of winners (for pagination) - general endpoint
	 */
	total_winners?: number;

	/**
	 * Array of win events - general endpoint
	 */
	winners?: WinEvent[];

	/**
	 * User address (only in user-specific responses)
	 */
	address?: string;

	/**
	 * Total number of wins for user (only in user-specific responses)
	 */
	total_wins?: number;

	/**
	 * Array of win events - user-specific endpoint
	 */
	wins?: WinEvent[];
}

/**
 * Statistics summary for a user or overall
 */
export interface EventStatistics {
	/**
	 * Total number of tosses
	 */
	total_tosses: number;

	/**
	 * Total number of wins
	 */
	total_wins: number;

	/**
	 * Total amount tossed (in HYPE)
	 */
	total_tossed: number;

	/**
	 * Total amount won (in HYPE)
	 */
	total_won: number;

	/**
	 * Win rate percentage
	 */
	win_rate: number;

	/**
	 * Average toss amount
	 */
	avg_toss: number;

	/**
	 * Average win amount
	 */
	avg_win: number;
}
