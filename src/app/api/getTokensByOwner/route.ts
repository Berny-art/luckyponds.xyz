import { NextResponse } from "next/server";
import { ethers } from "ethers";

// ABI for getOwnedTokensInRange function
const ABI = [
  {
    inputs: [
      { internalType: "address", name: "nftContract", type: "address" },
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "startTokenId", type: "uint256" },
      { internalType: "uint256", name: "endTokenId", type: "uint256" },
    ],
    name: "getOwnedTokensInRange",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
];

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const nftContract = url.searchParams.get("contract");
    const owner = url.searchParams.get("owner");
    const startTokenId = url.searchParams.get("start");
    const endTokenId = url.searchParams.get("end");

    if (!nftContract || !owner || !startTokenId || !endTokenId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const start = Number(startTokenId);
    const end = Number(endTokenId);

    if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
      return NextResponse.json({ error: "Invalid token ID range" }, { status: 400 });
    }

    // Load environment variables
    const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;
    const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
    const HELPER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_HELPER_CONTRACT_ADDRESS;

    if (!RPC_URL || !CHAIN_ID || !HELPER_CONTRACT_ADDRESS) {
      return NextResponse.json({ error: "Missing required environment variables" }, { status: 500 });
    }

    // Connect to blockchain using ethers.js
    const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
    const contract = new ethers.Contract(HELPER_CONTRACT_ADDRESS, ABI, provider);

    // Fetch owned tokens from contract
    const ownedTokens = await contract.getOwnedTokensInRange(nftContract, owner, start, end);

    // Convert BigInt array to string array
    const ownedTokenIds = ownedTokens.map((id: bigint) => id.toString());

    return NextResponse.json({ owner, ownedTokens: ownedTokenIds }, { status: 200 });

  } catch (error: unknown) {
    console.error("Error fetching owned tokens:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
