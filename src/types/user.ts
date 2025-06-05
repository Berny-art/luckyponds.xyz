/**
 * Types for the user API and components
 */

/**
 * Represents a user's data in the leaderboard
 */
export interface UserData {
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
	 * referrals made by the user
	 */
	referrals_count: number;

	/**
	 * referrals activated by the user
	 */
	referrals_activated: number;

	/**
	 * User's rank in the leaderboard
	 */
	rank: number;
}

/**
 * Error response from the API
 */
export interface ApiErrorResponse {
	error: string;
	message?: string;
	details?: string;
	status?: number;
}
