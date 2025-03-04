"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { takeSnapshot } from "@/functions/snapshot";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";

export default function Page() {
	const [nftAddress, setNftAddress] = useState("");
	const [selectedAddress, setSelectedAddress] = useState("");
	const [returnIds, setReturnIds] = useState(true);
	const [processing, setProcessing] = useState(false);
	const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
	const [downloadFilename, setDownloadFilename] = useState<string>("");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [snapshotResults, setSnapshotResults] = useState<
	{ tokenId: number | null; owner: string }[]
>([]);

	const predefinedAddresses: { [key: string]: string } = {
		"Hyper Frogs": "0xd9a3CFC4c5C9Bdf0b9500B8dB03321463f81Ef55",
		"Tiny Hyper Cats": "0xCC3D60fF11a268606C6a57bD6Db74b4208f1D30c",
		"Wealthy Hypio Babies": "0x63eb9d77D083cA10C304E28d5191321977fd0Bfb",
		Hypers: "0x9Be117D27f8037F6f549903C899e96E5755e96db",
	};

	const contractAddress =
		selectedAddress === "custom"
			? nftAddress
			: predefinedAddresses[selectedAddress];

	const isFormValid = contractAddress;

	const handleSnapshot = async () => {
		setProcessing(true);
		try {
			const { tokenIds, owners } = await takeSnapshot({
				nftAddress: contractAddress as `0x${string}`,
			});

			const formattedResults = owners.map((owner: string, index: number) => ({
				tokenId:
					returnIds && tokenIds[index] !== undefined
						? Number(tokenIds[index])
						: null,
				owner,
			}));

			setSnapshotResults(formattedResults);

			const textContent = formattedResults
				.map(({ tokenId, owner }) =>
					returnIds && tokenId !== null ? `${tokenId},${owner}` : `${owner}`,
				)
				.join("\n");

			const blob = new Blob([textContent], { type: "text/plain" });
			const url = URL.createObjectURL(blob);

			setDownloadUrl(url);
			setDownloadFilename(`snapshot_${contractAddress}_${Date.now()}.txt`);
		} catch (error) {
			console.error("Snapshot failed:", error);
		}
		setProcessing(false);
	};

	const resetForm = () => {
		setNftAddress("");
		setSelectedAddress("");
		setSnapshotResults([]);
		if (downloadUrl) {
			URL.revokeObjectURL(downloadUrl);
			setDownloadUrl(null);
		}
		setDownloadFilename("");
	};

	return (
		<div className="flex flex-col md:flex-row w-full px-6 gap-8">
			<div className="flex flex-col items-center justify-start w-full bg-primary-200/10 p-4 rounded gap-6">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="290"
					height="45"
					fill="none"
					viewBox="0 0 290 45"
				>
					<title>Snapshot</title>
					<path
						fill="#E6FF55"
						d="M10 1.452v.936H4v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm12 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm12 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm12 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm12 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm12 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm12 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm12 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6ZM1.48 4.532v11.496H.52V4.532h.96ZM28 15.452v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm3.48-10.92v11.496h-.96V4.532h.96Zm24 0v11.496h-.96V4.532h.96Zm12 0v11.496h-.96V4.532h.96ZM94 15.452v.936h-6v-.936h6Zm15.48-10.92v11.496h-.96V4.532h.96ZM130 15.452v.936h-6v-.936h6Zm15.48-10.92v11.496h-.96V4.532h.96ZM172 15.452v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm3.48-10.92v11.496h-.96V4.532h.96Zm18 0v11.496h-.96V4.532h.96Zm18 0v11.496h-.96V4.532h.96Zm36 0v11.496h-.96V4.532h.96Zm8.52 10.92v.936h-6v-.936h6Zm24 0v.936h-6v-.936h6Zm3.48-10.92v11.496h-.96V4.532h.96Zm-288 14v11.496H.52V18.532h.96ZM10 29.452v.936H4v-.936h6Zm6 0v.936h-6v-.936h6Zm21.48-10.92v11.496h-.96V18.532h.96Zm12 0v11.496h-.96V18.532h.96Zm12 0v11.496h-.96V18.532h.96Zm12 0v11.496h-.96V18.532h.96Zm36 0v11.496h-.96V18.532h.96ZM136 29.452v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm3.48-10.92v11.496h-.96V18.532h.96Zm8.52 10.92v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm21.48-10.92v11.496h-.96V18.532h.96Zm36 0v11.496h-.96V18.532h.96Zm18 0v11.496h-.96V18.532h.96Zm18 0v11.496h-.96V18.532h.96Zm12 0v11.496h-.96V18.532h.96Zm12 0v11.496h-.96V18.532h.96Zm-276 14v11.496H.52V32.532h.96ZM10 43.452v.936H4v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm3.48-10.92v11.496h-.96V32.532h.96ZM46 43.452v.936h-6v-.936h6Zm3.48-10.92v11.496h-.96V32.532h.96ZM58 43.452v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm3.48-10.92v11.496h-.96V32.532h.96ZM82 43.452v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm3.48-10.92v11.496h-.96V32.532h.96Zm8.52 10.92v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm3.48-10.92v11.496h-.96V32.532h.96Zm8.52 10.92v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm3.48-10.92v11.496h-.96V32.532h.96Zm18 0v11.496h-.96V32.532h.96Zm8.52 10.92v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm3.48-10.92v11.496h-.96V32.532h.96Zm8.52 10.92v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm3.48-10.92v11.496h-.96V32.532h.96Zm8.52 10.92v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm3.48-10.92v11.496h-.96V32.532h.96Zm8.52 10.92v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm6 0v.936h-6v-.936h6Zm3.48-10.92v11.496h-.96V32.532h.96Zm12 0v11.496h-.96V32.532h.96Zm8.52 10.92v.936h-6v-.936h6Zm3.48-10.92v11.496h-.96V32.532h.96Z"
					/>
					<path
						fill="#E6FF55"
						fillRule="evenodd"
						d="M4 2.388v-.936h30v.936H4Zm36 0v-.936h30v.936H40Zm36 0v-.936h30v.936H76Zm36 0v-.936h30v.936h-30Zm36 0v-.936h30v.936h-30Zm36 0v-.936h30v.936h-30Zm36 0v-.936h30v.936h-30Zm36 0v-.936h30v.936h-30Zm-234 14v-.936h12v.936H22Zm144 0v-.936h12v.936h-12Zm-162 14v-.936h12v.936H4Zm126 0v-.936h12v.936h-12Zm18 0v-.936h12v.936h-12Zm-144 14v-.936h30v.936H4Zm48 0v-.936h18v.936H52Zm24 0v-.936h12v.936H76Zm18 0v-.936h12v.936H94Zm18 0v-.936h12v.936h-12Zm36 0v-.936h30v.936h-30Zm36 0v-.936h12v.936h-12Zm18 0v-.936h12v.936h-12Zm18 0v-.936h30v.936h-30ZM3.5 2.888V.952h31v1.936h-31Zm36 0V.952h31v1.936h-31Zm36 0V.952h31v1.936h-31Zm36 0V.952h31v1.936h-31Zm36 0V.952h31v1.936h-31Zm36 0V.952h31v1.936h-31Zm36 0V.952h31v1.936h-31Zm36 0V.952h31v1.936h-31ZM1.98 4.032v12.496H.02V4.032h1.96ZM21.5 16.888v-1.936h13v1.936h-13ZM37.98 4.032v12.496h-1.96V4.032h1.96Zm24 0v12.496h-1.96V4.032h1.96Zm12 0v12.496h-1.96V4.032h1.96Zm20.52 10.92v1.936h-7v-1.936h7Zm15.48-10.92v12.496h-1.96V4.032h1.96Zm20.52 10.92v1.936h-7v-1.936h7Zm15.48-10.92v12.496h-1.96V4.032h1.96Zm19.52 12.856v-1.936h13v1.936h-13Zm16.48-12.856v12.496h-1.96V4.032h1.96Zm18 0v12.496h-1.96V4.032h1.96Zm18 0v12.496h-1.96V4.032h1.96Zm36 0v12.496h-1.96V4.032h1.96Zm8.52 10.92v1.936h-7v-1.936h7Zm24 0v1.936h-7v-1.936h7Zm3.48-10.92v12.496h-1.96V4.032h1.96Zm-288 14v12.496H.02V18.032h1.96ZM3.5 30.888v-1.936h13v1.936h-13Zm34.48-12.856v12.496h-1.96V18.032h1.96Zm12 0v12.496h-1.96V18.032h1.96Zm12 0v12.496h-1.96V18.032h1.96Zm12 0v12.496h-1.96V18.032h1.96Zm36 0v12.496h-1.96V18.032h1.96Zm19.52 12.856v-1.936h13v1.936h-13Zm16.48-12.856v12.496h-1.96V18.032h1.96Zm1.52 12.856v-1.936h13v1.936h-13Zm34.48-12.856v12.496h-1.96V18.032h1.96Zm36 0v12.496h-1.96V18.032h1.96Zm18 0v12.496h-1.96V18.032h1.96Zm18 0v12.496h-1.96V18.032h1.96Zm12 0v12.496h-1.96V18.032h1.96Zm12 0v12.496h-1.96V18.032h1.96Zm-276 14v12.496H.02V32.032h1.96ZM3.5 44.888v-1.936h31v1.936h-31Zm34.48-12.856v12.496h-1.96V32.032h1.96Zm8.52 10.92v1.936h-7v-1.936h7Zm3.48-10.92v12.496h-1.96V32.032h1.96Zm1.52 12.856v-1.936h19v1.936h-19Zm22.48-12.856v12.496h-1.96V32.032h1.96Zm1.52 12.856v-1.936h13v1.936h-13Zm16.48-12.856v12.496h-1.96V32.032h1.96Zm1.52 12.856v-1.936h13v1.936h-13Zm16.48-12.856v12.496h-1.96V32.032h1.96Zm1.52 12.856v-1.936h13v1.936h-13Zm16.48-12.856v12.496h-1.96V32.032h1.96Zm18 0v12.496h-1.96V32.032h1.96Zm1.52 12.856v-1.936h31v1.936h-31Zm34.48-12.856v12.496h-1.96V32.032h1.96Zm1.52 12.856v-1.936h13v1.936h-13Zm16.48-12.856v12.496h-1.96V32.032h1.96Zm1.52 12.856v-1.936h13v1.936h-13Zm16.48-12.856v12.496h-1.96V32.032h1.96Zm1.52 12.856v-1.936h31v1.936h-31Zm34.48-12.856v12.496h-1.96V32.032h1.96Zm12 0v12.496h-1.96V32.032h1.96Zm8.52 10.92v1.936h-7v-1.936h7Zm3.48-10.92v12.496h-1.96V32.032h1.96ZM1.48 16.028H.52V4.532h.96v11.496Zm36-11.496h-.96v11.496h.96V4.532Zm24 11.496h-.96V4.532h.96v11.496Zm12-11.496h-.96v11.496h.96V4.532ZM94 16.388h-6v-.936h6v.936Zm15.48-11.856h-.96v11.496h.96V4.532ZM130 16.388h-6v-.936h6v.936Zm15.48-11.856h-.96v11.496h.96V4.532Zm36 11.496h-.96V4.532h.96v11.496Zm18-11.496h-.96v11.496h.96V4.532Zm18 11.496h-.96V4.532h.96v11.496Zm36-11.496h-.96v11.496h.96V4.532ZM262 16.388h-6v-.936h6v.936Zm24-.936h-6v.936h6v-.936Zm3.48.576h-.96V4.532h.96v11.496Zm-288 2.504H.52v11.496h.96V18.532Zm36 11.496h-.96V18.532h.96v11.496Zm12-11.496h-.96v11.496h.96V18.532Zm12 11.496h-.96V18.532h.96v11.496Zm12-11.496h-.96v11.496h.96V18.532Zm36 11.496h-.96V18.532h.96v11.496Zm36-11.496h-.96v11.496h.96V18.532Zm36 11.496h-.96V18.532h.96v11.496Zm36-11.496h-.96v11.496h.96V18.532Zm18 11.496h-.96V18.532h.96v11.496Zm18-11.496h-.96v11.496h.96V18.532Zm12 11.496h-.96V18.532h.96v11.496Zm12-11.496h-.96v11.496h.96V18.532Zm-276 25.496H.52V32.532h.96v11.496Zm36 0h-.96V32.532h.96v11.496Zm8.52-.576h-6v.936h6v-.936Zm3.48.576h-.96V32.532h.96v11.496Zm24 0h-.96V32.532h.96v11.496Zm18-11.496h-.96v11.496h.96V32.532Zm18 11.496h-.96V32.532h.96v11.496Zm18-11.496h-.96v11.496h.96V32.532Zm18 11.496h-.96V32.532h.96v11.496Zm36 0h-.96V32.532h.96v11.496Zm18-11.496h-.96v11.496h.96V32.532Zm18 11.496h-.96V32.532h.96v11.496Zm36 0h-.96V32.532h.96v11.496Zm12-11.496h-.96v11.496h.96V32.532ZM274 44.388h-6v-.936h6v.936Zm3.48-11.856h-.96v11.496h.96V32.532Z"
						clipRule="evenodd"
					/>
				</svg>

				<div className="flex justify-center items-center flex-col gap-0 text-primary-200 font-normal">
					<h1 className="text-xl text-drip-300 font-bold">
						Hyper Frogs Snapshot Tool
					</h1>
					<p>Take a snapshot of any NFT collection on Hyper EVM.</p>
					<p>Free for Frog Holders, Non-holders gets charged 0.25 HYPE.</p>
				</div>

				<div className="flex flex-col gap-4 w-full max-w-[450px]">
					<Select
						value={selectedAddress}
						onValueChange={(value) => setSelectedAddress(value)}
					>
						<SelectTrigger className="w-full border-primary-200 text-primary-200 py-6 rounded px-4 border-2 font-bold uppercase [&>span]:text-primary-200">
							<SelectValue placeholder="Select Collection">
								{selectedAddress ? selectedAddress : "Select Collection"}
							</SelectValue>
						</SelectTrigger>
						<SelectContent className="bg-primary-200 text-secondary-950 border-none">
							{Object.entries(predefinedAddresses).map(([key]) => (
								<SelectItem key={key} value={key}>
									{key}
								</SelectItem>
							))}
							<SelectItem key="custom" value="custom">
								Custom Address
							</SelectItem>
						</SelectContent>
					</Select>

					{selectedAddress === "custom" && (
						<Input
							placeholder="Enter custom contract address"
							value={nftAddress}
							onChange={(e) => setNftAddress(e.target.value)}
							className="w-full border-primary-200 text-primary-200 py-6 rounded px-4 border-2 placeholder:text-primary-200/50 placeholder:uppercase"
						/>
					)}

					<div className="flex w-full items-center gap-2">
						<Switch
							checked={returnIds}
							onCheckedChange={setReturnIds}
							className="data-[state=checked]:bg-drip-300 data-[state=unchecked]:bg-primary-200/50 [&>span]:bg-secondary-950"
						/>
						<span className="text-primary-200 font-bold uppercase">
							Return Token IDs
						</span>
					</div>

					<Button
						onClick={handleSnapshot}
						disabled={!isFormValid || processing}
						className="bg-primary-200 hover:bg-primary-200/70 text-secondary-950 w-full font-bold uppercase text-md py-6"
					>
						{processing ? "Processing..." : "Take Snapshot"}
					</Button>

					{downloadUrl && (
						<>
							<Button
								asChild
								className="bg-primary-200 hover:bg-primary-200/70 text-secondary-950 w-full font-bold uppercase text-md py-6 mt-4"
							>
								<a href={downloadUrl} download={downloadFilename}>
									Download Snapshot
								</a>
							</Button>

							<Button
								onClick={resetForm}
								className="flex flex-col gap-0 bg-red-300 hover:bg-red-500 text-secondary-950 w-full font-bold uppercase text-md py-6"
							>
								Clear{" "}
								<span className="text-xs">(will clear snapshot results)</span>
							</Button>
						</>
					)}
				</div>

				<a
					className="text-drip-300 underline font-normal uppercase"
					href="https://discord.gg/pXHSuqCvbm"
					target="_blank"
					rel="noreferrer"
				>
					Support
				</a>
			</div>
		</div>
	);
}
