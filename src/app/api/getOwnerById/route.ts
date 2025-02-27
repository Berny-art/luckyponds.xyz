import { NextResponse } from "next/server";
import { ethers } from "ethers";

// ABI for ownerOf function
const ABI = [
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];

// ✅ Next.js App Router uses `export async function GET()`
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const nftId = url.searchParams.get("nftId");

    if (!nftId || Number.isNaN(Number(nftId))) {
      return NextResponse.json({ error: "A valid Token ID is required" }, { status: 400 });
    }

    const tokenId = Number(nftId);

    const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;
    const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
    const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

    if (!RPC_URL || !CHAIN_ID || !CONTRACT_ADDRESS) {
      return NextResponse.json({ error: "Missing required environment variables" }, { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    const owner: string = await contract.ownerOf(tokenId);

    return NextResponse.json({ tokenId, owner }, { status: 200 });

  } catch (error: unknown) {
    console.error("Error fetching NFT tokens:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
