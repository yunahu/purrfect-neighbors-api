import "dotenv/config.js";
import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

export let db;

export const connectToMongo = async () => {
  try {
    await client.connect();
    console.log("Connected to the MongoDB database");
    db = client.db(process.env.MONGODB_NAME);
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    throw err;
  }
};
