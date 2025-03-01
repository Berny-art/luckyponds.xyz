import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGO_URI as string;

if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined in environment variables");
}

// Ensure MongoDB connection caching in Next.js
declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
}

// biome-ignore lint/style/useConst: <explanation>
let client: MongoClient;
if (!global._mongoClient) {
  global._mongoClient = new MongoClient(MONGO_URI, {
    serverApi: { version: "1", strict: true, deprecationErrors: true },
  });
}
// eslint-disable-next-line prefer-const
client = global._mongoClient;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = Number.parseInt(url.searchParams.get("page") || "1", 10);
    const sortBy = url.searchParams.get("sortBy") === "rank" ? "rank" : "nft_id";
    const sortOrder = url.searchParams.get("sortOrder") === "DESC" ? -1 : 1;
    const searchTokenIds = url.searchParams.get("searchTokenId") || null; // ✅ Comma-separated Token IDs
    const rawTraitFilters = url.searchParams.get("traitFilters") || "{}";

    // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
    let traitFilters;
    try {
      traitFilters = JSON.parse(rawTraitFilters);
    } catch {
      traitFilters = {};
    }

    const db = client.db("nftdata");
    const nftsCollection = db.collection("metadata");
    const attributesCollection = db.collection("attributes");

    const pageSize = 100;
    const skip = (page - 1) * pageSize;

    const query: Record<string, string | number | { $in: number[] }> = {};

    if (searchTokenIds) {
      const decodedSearchTokenIds = decodeURIComponent(searchTokenIds);
    
      const tokenIdsArray = decodedSearchTokenIds
        .split(",")
        .map((id) => id.trim()) // Remove spaces
        .filter((id) => !Number.isNaN(Number(id))) // Ensure numeric values
        .map(Number); // Convert to numbers
        
      if (tokenIdsArray.length > 0) {
        query.nft_id = { $in: tokenIdsArray };
      }
    }
    
    // ✅ Trait Filtering: Only apply if there are selected traits
    if (Object.keys(traitFilters).length > 0) {
      const traitConditions = Object.entries(traitFilters)
        .filter(([, values]) => (values as string[]).length > 0) // Remove empty trait filters
        .map(([traitType, values]) => ({
          trait_type: traitType,
          value: { $in: values as string[] },
        }));

      if (traitConditions.length > 0) {
        const matchingNfts = await attributesCollection
          .aggregate([
            { $match: { $or: traitConditions } },
            { $group: { _id: "$nft_id" } }, // Get unique NFT IDs that match traits
          ])
          .toArray();

        const matchingNftIds = matchingNfts.map((doc) => doc._id);
        
        if (matchingNftIds.length === 0) {
          return NextResponse.json({ page, pageSize, total: 0, data: [] }); // No matching NFTs
        }

        query.nft_id = { $in: matchingNftIds }; // Filter NFTs by matched IDs
      }
    }

    // ✅ Fetch paginated NFTs with sorting
    const nfts = await nftsCollection
      .find(query) // ✅ Ensure this is applied
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(pageSize)
      .toArray();

    // ✅ Fetch attributes only for retrieved NFTs
    const nftIds = nfts.map((nft) => nft.nft_id);
    const attributes = await attributesCollection.find({ nft_id: { $in: nftIds } }).toArray();

    // ✅ Map attributes to NFTs
    interface Attribute {
      trait_type: string;
      value: string;
      rarity_percent: number;
      rarity_score: number;
    }

    const attributesMap: Record<string, Attribute[]> = {};
    for (const attr of attributes) {
      if (!attributesMap[attr.nft_id]) {
        attributesMap[attr.nft_id] = [];
      }
      attributesMap[attr.nft_id].push({
        trait_type: attr.trait_type,
        value: attr.value,
        rarity_percent: attr.rarity_percent,
        rarity_score: attr.rarity_score,
      });
    }

    // ✅ Merge NFT data with attributes
    const responseData = nfts.map((nft) => ({
      ...nft,
      nft_id: Number(nft.nft_id),
      attributes: attributesMap[nft.nft_id] || [],
    }));

    return NextResponse.json({
      page,
      pageSize,
      total: responseData.length,
      data: responseData,
    });
  } catch (error) {
    console.error("MongoDB fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch NFT data" },
      { status: 500 }
    );
  }
}
