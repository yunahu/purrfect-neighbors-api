import { promisify } from "util";

import { db } from "../services/mysql.js";

const searchPets = async (term) => {
  const query = promisify(db.query).bind(db);
  try {
    const pets = await query(
      "SELECT id, pet_name AS name, pet_type AS type, breed, pet_address AS address, latitude, longitude FROM pets WHERE pet_name LIKE ? OR pet_type LIKE ? OR breed LIKE ? OR pet_address LIKE ?",
      [`%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`]
    );
    return pets;
  } catch (error) {
    console.error("Error fetching pets:", error);
    throw error;
  }
};

const searchProducts = async (term) => {
  const query = promisify(db.query).bind(db);
  try {
    const products = await query(
      "SELECT id, title, content, latitude, longitude FROM posts WHERE title LIKE ?",
      [`%${term}%`]
    );
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

export { searchPets, searchProducts };
