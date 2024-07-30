import express from "express";

import { promisify } from "util";

import AWS from "aws-sdk";
import multer from "multer";

import { db } from "../services/mysql.js";
import { isAuthenticated } from "../middleware/middleware.js";

import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding.js";

const router = express.Router();

const geocodingClient = mbxGeocoding({ accessToken: process.env.MAPBOX_ACCESS_TOKEN });

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/create", isAuthenticated, async (req, res) => {
  const { name, description, latitude, longitude, imageUrl, type, breed, age } = req.body;

  if (!name || !description || !latitude || !longitude || !imageUrl) {
      return res.status(400).send("Missing required fields.");
  }

  const query = promisify(db.query).bind(db);
  try {
      const result = await query("INSERT INTO pets (user_id, pet_name, pet_description, latitude, longitude, pet_type, breed, age) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
          req.user.id,
          name,
          description,
          latitude,
          longitude,
          type || null,
          breed || null,
          age || null
      ]);

      await query("INSERT INTO pet_photos (pet_id, photo_url) VALUES (?, ?)", [
        result.insertId,
        imageUrl
    ]);

      res.status(201).send({ postId: result.insertId });
  } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
  }
});

router.post("/upload", isAuthenticated, upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send("No file uploaded.");
  }

  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${Date.now()}_${file.originalname}`,
      Body: file.buffer
    };
    
    const data = await s3.upload(params).promise();
    res.status(200).send(data.Location);
  } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
  }
});

router.get("/:id", async (req, res) => {
  console.log("GET pets/:id");
  const { id } = req.params;
  
  const query = promisify(db.query).bind(db);
  try {
    const petResult = await query("SELECT * FROM pets WHERE id = ?", [id]);

    if (petResult.length === 0) {
        return res.status(404).send("Pet not found.");
    }

    const pet = petResult[0];
    const userResult = await query("SELECT name FROM users WHERE id = ?", [pet.user_id]);
    
    if (userResult.length === 0) {
      return res.status(500).send("User not found.");
    }
    
    const user = userResult[0];

    const imageUrlResult = await query("SELECT * FROM pet_photos WHERE pet_id = ?", [id]);
    const imageUrl = imageUrlResult[0];

    const response = await geocodingClient.reverseGeocode({
      query: [pet.longitude, pet.latitude],
      types: ['place'],
    }).send();
  
  const city = response.body.features.length > 0 ? response.body.features[0].place_name : "Unknown Location";

    const formattedPet = {
        id: pet.id,
        title: pet.pet_name,
        description: pet.pet_description,
        imageUrl: imageUrl.photo_url,
        postBy: user.name,
        postDate: pet.created_at,
        location: city,
        latitude: pet.latitude,
        longitude: pet.longitude,
        type: pet.pet_type,
        breed: pet.breed,
        age: pet.age
    };

    console.log(formattedPet);

    res.status(200).json(formattedPet);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/", async (req, res) => {
  const { latitude, longitude, radius } = req.query;

  if (!latitude || !longitude || !radius) {
      return res.status(400).send("Missing required query parameters.");
  }

  const query = promisify(db.query).bind(db);
  try {
      // Haversine Formula to calculate distance
      const pets = await query(`
          SELECT p.*, 
          (SELECT photo_url FROM pet_photos WHERE pet_id = p.id LIMIT 1) AS photo_url,
          (
            6371 * acos(
              cos(radians(?)) * cos(radians(p.latitude)) *
              cos(radians(p.longitude) - radians(?)) +
              sin(radians(?)) * sin(radians(p.latitude))
            )
          ) AS distance
        FROM pets p
        HAVING distance <= ?
        ORDER BY distance;
      `, [latitude, longitude, latitude, radius]);

      const formattedPets = pets.map(pet => ({
        id: pet.id,
        title: pet.pet_name,
        content: pet.pet_description,
        image: pet.photo_url,
        longitude: pet.longitude,
        latitude: pet.latitude
      }));

      console.log(formattedPets);
  
      res.status(200).json(formattedPets);
  } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
  }
});

export default router;
