import { useState, useEffect } from "react";
import { useSortStore } from "@/store/sortStore";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// import { Switch } from "@/components/ui/switch";
import { useAccount } from "wagmi";
import { fetchTokensByOwner } from "@/functions/owners";
import MigrateFrogsButton from "./MigrateButton";

export default function Sort() {
	const {
		sortBy,
		sortOrder,
		searchTokenId,
		showMigratedFrogs,
		setSortBy,
		setSortOrder,
		setSearchTokenId,
		// setShowMigratedFrogs,
		reset,
	} = useSortStore();

	const [searchInput, setSearchInput] = useState(searchTokenId);
	const [processing, setProcessing] = useState(false);

	const { address, isConnected } = useAccount();

	const oldContractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
	const migrationContractAddress =
		process.env.NEXT_PUBLIC_MIGRATION_CONTRACT_ADDRESS;

	const contractAddress = showMigratedFrogs
		? migrationContractAddress
		: oldContractAddress;

	// Debounce search input
	useEffect(() => {
		const delayDebounce = setTimeout(() => {
			setSearchTokenId(searchInput);
		}, 500);
		return () => clearTimeout(delayDebounce);
	}, [searchInput, setSearchTokenId]);

	const handleViewMyFrogs = async () => {
		if (address && contractAddress) {
			setProcessing(true);
			try {
				const tokens = await fetchTokensByOwner(contractAddress, address, 1, 2222);
				if (tokens) {
					setSearchInput(tokens.toString());
					setSearchTokenId(tokens.toString());
				}
			} catch (error) {
				console.error("Error fetching tokens:", error);
			}
			setProcessing(false);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center w-full gap-4">

			{/* <div className="flex items-center gap-2">
				<Switch
					checked={showMigratedFrogs}
					onCheckedChange={setShowMigratedFrogs}
				/>
				<span className="text-primary-200 font-bold uppercase">
					Show Migrated Frogs
				</span>
			</div> */}

			<div className="flex items-center justify-center w-full gap-2">
				<Select
					value={sortBy}
					onValueChange={(value) => setSortBy(value as "rank" | "id")}
				>
					<SelectTrigger className="border-2 py-6 border-primary-200 rounded px-4 text-primary-200 font-bold w-1/2">
						<SelectValue>{sortBy.toUpperCase()}</SelectValue>
					</SelectTrigger>
					<SelectContent className="bg-primary-200 text-secondary-950 border-none">
						<SelectItem value="rank">RANK</SelectItem>
						<SelectItem value="id">ID</SelectItem>
					</SelectContent>
				</Select>

				<Select
					value={sortOrder}
					onValueChange={(value) => setSortOrder(value as "ASC" | "DESC")}
				>
					<SelectTrigger className="border-2 py-6 border-primary-200 rounded px-4 text-primary-200 font-bold w-1/2">
						<SelectValue>{sortOrder}</SelectValue>
					</SelectTrigger>
					<SelectContent className="bg-primary-200 text-secondary-950 border-none">
						<SelectItem value="ASC">ASC</SelectItem>
						<SelectItem value="DESC">DESC</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="flex items-center justify-center w-full">
				<Input
					placeholder="Search Token ID"
					value={searchInput}
					onChange={(e) => setSearchInput(e.target.value)}
					className="w-full border-primary-200 text-primary-200 py-6 rounded px-4 border-2 placeholder:text-primary-200/50 placeholder:uppercase"
				/>
			</div>

			{isConnected && address && contractAddress && (
				<Button
					onClick={handleViewMyFrogs}
					disabled={processing}
					className="bg-primary-200 hover:bg-primary-200/70 text-secondary-950 w-full font-bold uppercase text-md py-6"
				>
					{processing ? "Loading..." : "View my Frogs"}
				</Button>
			)}

			{isConnected && (
				<MigrateFrogsButton fetchUserTokens={!showMigratedFrogs} />
			)}

			<Button
				onClick={() => {
					reset();
					setSearchInput("");
				}}
				className="bg-drip-300 hover:bg-drip-300/70 text-secondary-950 w-full font-bold uppercase text-md py-6"
			>
				Reset
			</Button>
		</div>
	);
}
