import { promisify } from "util";

import { db } from "../services/mysql.js";

const searchPets = async (term, latitude, longitude, radius, type, breed) => {
  const query = promisify(db.query).bind(db);
  try {
    let pets = [];
    if (term) {
      pets = await query(
        `SELECT pets.*, pet_photos.photo_url AS image
        FROM pets 
        LEFT JOIN pet_photos ON pets.id = pet_photos.pet_id
        WHERE pet_name LIKE ? OR pet_type LIKE ? OR breed LIKE ? OR pet_address LIKE ?`,
        [`%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`]
      );
    } else if (latitude && longitude && radius) {
      pets = await query(
        `SELECT pets.*, pet_photos.photo_url AS image,
          (
            6371 * acos(
            cos(radians(?)) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(latitude))
            )
          ) AS distance
          FROM pets
          LEFT JOIN pet_photos ON pets.id = pet_photos.pet_id
          HAVING distance <= ?
          ORDER BY distance;
        `,
        [latitude, longitude, latitude, radius]
      );
    }

    if (type && type !== "") {
      pets = pets.filter((pet) => pet.pet_type === type);
    }
    if (breed && breed !== "") {
      pets = pets.filter((pet) => pet.breed === breed);
    }
    return pets;
  } catch (error) {
    console.error("Error fetching pets:", error);
    throw error;
  }
};

const searchProducts = async (term, latitude, longitude, radius) => {
  const query = promisify(db.query).bind(db);
  try {
    let products = [];
    if (term) {
      products = await query("SELECT * FROM posts WHERE title LIKE ?", [
        `%${term}%`
      ]);
    } else if (latitude && longitude && radius) {
      products = await query(
        `SELECT *,
          (
            6371 * acos(
            cos(radians(?)) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(latitude))
            )
          ) AS distance
          FROM posts
          HAVING distance <= ?
          ORDER BY distance;
        `,
        [latitude, longitude, latitude, radius]
      );
    }

    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

export { searchPets, searchProducts };
