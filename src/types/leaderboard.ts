/**
 * Types for the leaderboard API and components
 */

/**
 * Possible fields to sort the leaderboard by
 */
export type SortField =
	| 'total_points'
	| 'toss_points'
	| 'winner_points'
	| 'referral_points';

/**
 * Sort order options (uppercase as required by the API)
 */
export type SortOrder = 'ASC' | 'DESC';

/**
 * Represents a single entry in the leaderboard
 */
export interface LeaderboardEntry {
	/**
	 * User's wallet address
	 */
	address: string;

	/**
	 * Total number of tosses made
	 */
	total_tosses: number;

	/**
	 * Total number of wins
	 */
	total_wins: number;

	/**
	 * Total value spent in HYPE
	 */
	total_value_spent: string;

	/**
	 * Total points accumulated (sum of all point types)
	 */
	total_points: number;

	/**
	 * Points earned from tossing coins
	 */
	toss_points: number;

	/**
	 * Points earned from winning ponds
	 */
	winner_points: number;

	/**
	 * Points earned from referrals
	 */
	referral_points: number;

	/**
	 * User's rank in the leaderboard
	 */
	rank: number;
}

/**
 * Top-level structure of the API response
 */
export interface LeaderboardData {
	/**
	 * Array of leaderboard entries
	 */
	leaderboard: LeaderboardEntry[];

	/**
	 * Maximum number of entries per page
	 */
	limit: number;

	/**
	 * Starting position in the overall leaderboard
	 */
	offset: number;

	/**
	 * Current sort order
	 */
	order: SortOrder;

	/**
	 * Current sort field
	 */
	sort_by: SortField;

	/**
	 * Total number of users in the leaderboard
	 */
	total_users: number;
}

/**
 * API query parameters
 */
export interface LeaderboardQueryParams {
	limit?: number;
	offset?: number;
	order?: SortOrder;
	sort_by?: SortField;
}
