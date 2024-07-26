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

router.get("/:id", async (req, res) => {
    const { id } = req.params;
  
    const query = promisify(db.query).bind(db);
    try {
        const postResult = await query("SELECT * FROM posts WHERE id = ?", [id]);
    
        if (postResult.length === 0) {
            return res.status(404).send("Post not found.");
        }
    
        const post = postResult[0];
        const userResult = await query("SELECT name FROM users WHERE id = ?", [post.user_id]);
        
        if (userResult.length === 0) {
        return res.status(500).send("User not found.");
        }
        
        const user = userResult[0];

        const commentsResult = await query("SELECT comments.*, users.name as commentBy FROM comments JOIN users ON comments.user_id = users.id WHERE post_id = ?", [id]);
        const formattedComments = commentsResult.map(comment => ({
            id: comment.id,
            commentBy: comment.commentBy,
            commentDate: comment.created_at,
            content: comment.content
          }));
        
        const formattedPost = {
        id: post.id,
        title: post.title,
        description: post.content,
        postBy: user.name,
        postDate: post.created_at,
        location: `${post.latitude}, ${post.longitude}`,
        comments: formattedComments
        };

        console.log(formattedPost);

        res.status(200).json(formattedPost);
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

  router.post("/:id/comments", isAuthenticated, async (req, res) => {
    const { id: post_id } = req.params;
    const { content, parent_id = null } = req.body;
  
    if (!content) {
      return res.status(400).send("Content is required.");
    }
  
    const query = promisify(db.query).bind(db);
    try {
      const result = await query("INSERT INTO comments (user_id, post_id, parent_id, content) VALUES (?, ?, ?, ?)", [
        req.user.id,
        post_id,
        parent_id,
        content
      ]);
  
      res.status(201).send({ commentId: result.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  });

export default router;