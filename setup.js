import "dotenv/config.js";

import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import { connectToMySQL, db } from "./services/mysql.js";
import { getPlaceName } from "./utils/geocoding.js";

import mockData from "./data/mock-data.json" assert { type: "json" };

// Convert __dirname to work in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const schemaPath = path.join(__dirname, "db", "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf-8");

const queries = schema
  .split(";")
  .map((query) => query.trim())
  .filter((query) => query.length);

const setup = async () => {
  await connectToMySQL();

  try {
    for (const query of queries) {
      await db.query(query);
    }

    const userIds = [];
    for (const user of mockData.users) {
      const result = await db.query("INSERT INTO users (name, email) VALUES (?, ?)", [user.name, user.email]);
      userIds.push(result.insertId);
    }

    const getRandomUserId = () => userIds[Math.floor(Math.random() * userIds.length)];

    for (const pet of mockData.pets) {
      const userId = getRandomUserId();
      const petAddress = await getPlaceName(pet.longitude, pet.latitude);
      const result = await db.query(
        "INSERT INTO pets (user_id, pet_name, pet_description, pet_address, latitude, longitude, pet_type, breed, age) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [userId, pet.name, pet.description, petAddress, pet.latitude, pet.longitude, pet.type, pet.breed, pet.age]
      );
      await db.query("INSERT INTO pet_photos (pet_id, photo_url) VALUES (?, ?)", [result.insertId, pet.imageUrl]);
    }

    for (const post of mockData.posts) {
      const userId = getRandomUserId();
      const postAddress = await getPlaceName(post.longitude, post.latitude);
      await db.query(
        "INSERT INTO posts (user_id, title, content, latitude, longitude, post_address) VALUES (?, ?, ?, ?, ?, ?)",
        [userId, post.title, post.content, post.latitude, post.longitude, postAddress]
      );
    }

    console.log("Database setup completed");
  } catch (err) {
    console.error("Database setup failed:", err);
  } finally {
    db.end((err) => {
      if (err) {
        console.error("Error closing the database connection:", err);
      } else {
        console.log("Database connection closed");
      }
    });
  }
};

setup();
