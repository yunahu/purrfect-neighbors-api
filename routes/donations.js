import express from "express";

import { promisify } from "util";

import { db } from "../services/mysql.js";
import { isAuthenticated } from "../middleware/middleware.js";

const router = express.Router();

router.post("/create", isAuthenticated, async (req, res) => {
    const { title, description, latitude, longitude } = req.body;

    if (!title || !description || !latitude || !longitude) {
        return res.status(400).send("Missing required fields.");
    }
  
    const query = promisify(db.query).bind(db);
    try {
        const result = await query("INSERT INTO posts (user_id, title, content, latitude, longitude) VALUES (?, ?, ?, ?, ?)", [
            req.user.id,
            title,
            description,
            latitude,
            longitude
        ]);
  
        res.status(201).send({ postId: result.insertId });
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
        const posts = await query(`
            SELECT *,
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
        `, [latitude, longitude, latitude, radius]);
        console.log(posts);
    
        res.status(200).json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
  });

export default router;