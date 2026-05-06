import { MongoClient, MongoClientOptions } from "mongodb";

/**
 * Singleton MongoClient for Auth.js / NextAuth adapter.
 *
 * Important: don't connect at import-time. Next.js may evaluate modules during
 * build, and an eager `connect()` causes network/DNS failures to break builds.
 *
 * The official MongoDB adapter supports receiving a non-connected MongoClient
 * (or a function returning one). The client will connect lazily when used.
 */

const options: MongoClientOptions = {};

const globalWithMongo = global as typeof globalThis & {
  _mongoClient?: MongoClient;
};

export function getMongoClient(): MongoClient {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  if (process.env.NODE_ENV === "development") {
    if (!globalWithMongo._mongoClient) {
      globalWithMongo._mongoClient = new MongoClient(uri, options);
    }
    return globalWithMongo._mongoClient;
  }

  return new MongoClient(uri, options);
}
