import type { Address } from 'viem';

// Token types from the contract
export enum TokenType {
	NATIVE = 0,
	ERC20 = 1,
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

// Pond structure from the contract
export interface PondData {
	startTime: bigint;
	endTime: bigint;
	totalTosses: bigint;
	paddingA: bigint;
	totalValue: bigint;
	totalFrogValue: bigint;
	minTossPrice: bigint;
	paddingB: bigint;
	maxTotalTossAmount: bigint;
	tokenAddress: Address;
	tokenType: TokenType;
	prizeDistributed: boolean;
	pondType: string; // bytes32 but we'll use string for easier handling
	pondName: string;
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
}

// Comprehensive pond info returned by getPondComprehensiveInfo
export interface PondComprehensiveInfo extends PondStatus {
	userTossAmount: bigint;
	remainingTossAmount: bigint;
	lastPondWinner: Address;
	lastPondPrize: bigint;
	recentParticipants: ParticipantInfo[];
}

// Standard pond types returned by getStandardPondTypes
export interface StandardPondTypes {
	daily: string; // bytes32
	weekly: string; // bytes32
	monthly: string; // bytes32
	unknown: string; // bytes32
}

// Removable ponds returned by getRemovablePonds
export interface RemovablePonds {
	removablePonds: string[]; // bytes32[]
	pondNames: string[];
}

// Date to timestamp function parameters
export interface DateToTimestampParams {
	year: bigint;
	month: bigint;
	day: bigint;
}

// Timestamp to date function result
export interface TimestampToDateResult {
	year: bigint;
	month: bigint;
	day: bigint;
}

// Contract roles
export interface ContractRoles {
	DEFAULT_ADMIN_ROLE: string; // bytes32
	ADMIN_ROLE: string; // bytes32
	OPERATOR_ROLE: string; // bytes32
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
}

// Event types
export interface CoinTossedEvent {
	pondType: string; // bytes32
	frog: Address;
	amount: bigint;
	timestamp: bigint;
	totalPondTosses: bigint;
	totalPondValue: bigint;
}

export interface ConfigUpdatedEvent {
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

export interface LuckyFrogSelectedEvent {
	pondType: string; // bytes32
	luckyFrog: Address;
	prize: bigint;
	selector: Address;
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

export type LuckyPondsEvents = {
	CoinTossed: CoinTossedEvent;
	ConfigUpdated: ConfigUpdatedEvent;
	EmergencyAction: EmergencyActionEvent;
	LuckyFrogSelected: LuckyFrogSelectedEvent;
	PondAction: PondActionEvent;
	RoleGranted: RoleEvent;
	RoleRevoked: RoleEvent;
	RoleAdminChanged: RoleAdminChangedEvent;
	Paused: { account: Address };
	Unpaused: { account: Address };
};

// Error types
export type LuckyPondsErrors =
	| 'AccessControlBadConfirmation'
	| 'AccessControlUnauthorizedAccount'
	| 'AmountTooLow'
	| 'CannotRemovePondWithActivity'
	| 'EnforcedPause'
	| 'ExpectedPause'
	| 'IncorrectTossAmount'
	| 'InsufficientAllowance'
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
export type TossCoinParams = {
	pondType: string; // bytes32
	value: bigint; // amount of native token to send
};

export type TossTokenParams = {
	pondType: string; // bytes32
	amount: bigint;
};

// Zustand store type if needed
export interface LuckyPondsStore {
	ponds: Record<string, PondStatus>;
	userParticipation: Record<string, bigint>;
	fetchPondStatus: (pondType: string) => Promise<void>;
	fetchUserParticipation: (
		pondType: string,
		userAddress: Address,
	) => Promise<void>;
}
