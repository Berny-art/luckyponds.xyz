import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGO_URI as string;

if (!MONGO_URI) {
  throw new Error("MONGO_URI is missing in environment variables");
}

// Cache the MongoDB connection (Prevents reinitialization in every request)
let cachedClient: MongoClient | null = null;

export async function connectToDatabase() {
  if (cachedClient) return cachedClient; // Return cached client if available

  const client = new MongoClient(MONGO_URI, {
    serverApi: { version: "1", strict: true, deprecationErrors: true },
  });

  await client.connect();
  cachedClient = client;
  return client;
}
