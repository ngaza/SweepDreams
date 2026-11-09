import { MongoClient } from "mongodb";

export async function connectDatabase(uri, options = {}) {
  const client = new MongoClient(uri, options);
  try {
    await client.connect();
    return client;
  } catch (error) {
    await client.close();
    throw error;
  }
}