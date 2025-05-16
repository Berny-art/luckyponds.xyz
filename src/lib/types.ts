import type { Address } from 'viem';

// Token types from the contract
export enum TokenType {
	NATIVE = 0,
	ERC20 = 1,
}

// Pond period types from the contract
export enum PondPeriod {
	FIVE_MIN = 0,
	HOURLY = 1,
	DAILY = 2,
	WEEKLY = 3,
	MONTHLY = 4,
	CUSTOM = 5,
}

// Participant information
export interface ParticipantInfo {
	participant: Address;
	tossAmount: bigint;
}

// Participant data stored in the contract
export interface ParticipantData {
	amount: bigint;
	exists: boolean;
}

// Pond structure from the contract (ponds mapping)
export interface PondData {
	startTime: bigint; // uint64
	endTime: bigint; // uint64
	totalTosses: bigint; // uint64
	paddingA: bigint; // uint64
	totalValue: bigint; // uint128
	totalFrogValue: bigint; // uint128
	minTossPrice: bigint; // uint64
	paddingB: bigint; // uint64
	maxTotalTossAmount: bigint; // uint128
	tokenAddress: Address;
	tokenType: TokenType;
	period: PondPeriod;
	prizeDistributed: boolean;
	pondType: string; // bytes32 but we'll use string for easier handling
	pondName: string;
}

// Pond display info for UI (from getStandardPondsForUI)
export interface PondDisplayInfo {
	pondType: string; // bytes32
	pondName: string;
	period: PondPeriod;
	exists: boolean;
}

// Pond status returned by getPondStatus
export interface PondStatus {
	name: string;
	startTime: bigint;
	endTime: bigint;
	totalTosses: bigint;
	totalValue: bigint;
	totalParticipants: bigint;
	prizeDistributed: boolean;
	timeUntilEnd: bigint;
	minTossPrice: bigint;
	maxTotalTossAmount: bigint;
	tokenType: TokenType;
	tokenAddress: Address;
	period: PondPeriod; // New field in PondCore
}

// Standard pond types returned by getStandardPondTypes
export interface StandardPondTypes {
	fiveMin: string; // bytes32
	hourly: string; // bytes32
	daily: string; // bytes32
	weekly: string; // bytes32
	monthly: string; // bytes32
}

// Comprehensive pond info for our application (merged data from multiple calls)
export interface PondComprehensiveInfo extends PondStatus {
	userTossAmount: bigint;
	remainingTossAmount: bigint;
	lastPondWinner: Address;
	lastPondPrize: bigint;
	recentParticipants: ParticipantInfo[];
}

// Contract roles - consistent with PondCore
export interface ContractRoles {
	DEFAULT_ADMIN_ROLE: string; // bytes32
	ADMIN_ROLE: string; // bytes32
	FACTORY_ROLE: string; // bytes32 - Changed from OPERATOR_ROLE
	POND_MANAGER_ROLE: string; // bytes32
}

// Pond creation parameters
export interface CreatePondParams {
	pondType: string; // bytes32
	name: string;
	startTime: bigint;
	endTime: bigint;
	minTossPrice: bigint;
	maxTotalTossAmount: bigint;
	tokenType: TokenType;
	tokenAddress: Address;
	period: PondPeriod; // New parameter in PondCore
}

// Event types - updated to match PondCore events
export interface CoinTossedEvent {
	pondType: string; // bytes32
	participant: Address; // Changed from frog to participant
	amount: bigint;
	timestamp: bigint;
	totalPondTosses: bigint;
	totalPondValue: bigint;
}

export interface ConfigChangedEvent {
	// Changed from ConfigUpdatedEvent
	configType: string;
	pondType: string; // bytes32
	oldValue: bigint;
	newValue: bigint;
	oldAddress: Address;
	newAddress: Address;
}

export interface EmergencyActionEvent {
	actionType: string;
	recipient: Address;
	token: Address;
	amount: bigint;
	pondType: string; // bytes32
}

export interface LuckyWinnerSelectedEvent {
	// Changed from LuckyFrogSelectedEvent
	pondType: string; // bytes32
	winner: Address; // Changed from luckyFrog
	prize: bigint;
	selector: Address;
}

export interface PondTopUpEvent {
	// New event type in PondCore
	pondType: string; // bytes32
	contributor: Address;
	amount: bigint;
	timestamp: bigint;
	totalPondValue: bigint;
}

export interface PondActionEvent {
	pondType: string; // bytes32
	name: string;
	startTime: bigint;
	endTime: bigint;
	actionType: string;
}

export interface RoleEvent {
	role: string; // bytes32
	account: Address;
	sender: Address;
}

export interface RoleAdminChangedEvent {
	role: string; // bytes32
	previousAdminRole: string; // bytes32
	newAdminRole: string; // bytes32
}

export type PondCoreEvents = {
	CoinTossed: CoinTossedEvent;
	ConfigChanged: ConfigChangedEvent; // Changed from ConfigUpdated
	EmergencyAction: EmergencyActionEvent;
	LuckyWinnerSelected: LuckyWinnerSelectedEvent; // Changed from LuckyFrogSelected
	PondTopUp: PondTopUpEvent; // New event
	PondAction: PondActionEvent;
	RoleGranted: RoleEvent;
	RoleRevoked: RoleEvent;
	RoleAdminChanged: RoleAdminChangedEvent;
	Paused: { account: Address };
	Unpaused: { account: Address };
};

// Error types - updated based on PondCore error list
export type PondCoreErrors =
	| 'AccessControlBadConfirmation'
	| 'AccessControlUnauthorizedAccount'
	| 'AmountTooLow'
	| 'CannotRemovePondWithActivity'
	| 'EnforcedPause'
	| 'ExpectedPause'
	| 'FeeToHigh' // New error
	| 'InvalidParameters' // New error
	| 'InvalidPondType'
	| 'MaxTossAmountExceeded'
	| 'NoPondParticipants'
	| 'PondAlreadyExists'
	| 'PondNotEnded'
	| 'PondNotOpen'
	| 'PrizeAlreadyDistributed'
	| 'ReentrancyGuardReentrantCall'
	| 'SafeERC20FailedOperation'
	| 'StandardPondNotRemovable'
	| 'TimelockActive'
	| 'TokenNotSupported'
	| 'TransferFailed'
	| 'ZeroAddress';

// Define utility type for wagmi contract-write hooks
export type TossParams = {
	// Changed from TossCoinParams
	pondType: string; // bytes32
	amount: bigint; // amount to toss
};

// Zustand store type if needed
export interface PondCoreStore {
	// Changed from LuckyPondsStore
	ponds: Record<string, PondStatus>;
	userParticipation: Record<string, bigint>;
	lastWinners: Record<string, Address>;
	lastPrizes: Record<string, bigint>;
	fetchPondStatus: (pondType: string) => Promise<void>;
	fetchUserParticipation: (
		pondType: string,
		userAddress: Address,
	) => Promise<void>;
	fetchLastWinnerInfo: (pondType: string) => Promise<void>;
}
