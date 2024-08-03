import express from "express";

import { db } from "../services/mysql.js";
import { isAuthenticated } from "../middleware/middleware.js";

import redisClient from "../services/redis.js";

const router = express.Router();

router.get("/posts", isAuthenticated, async (req, res) => {
  try {
    const cacheKey = `user:${req.user.id}:posts`;
    const cachedPosts = await redisClient.get(cacheKey);

    if (cachedPosts) {
      return res.status(200).json(JSON.parse(cachedPosts));
    }

    const postResult = await db.query("SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC", [req.user.id]);
    await redisClient.set(cacheKey, JSON.stringify(postResult), 'EX', 3600);
  
    res.status(200).json(postResult);
  } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
  }
});

router.get("/comments", isAuthenticated, async (req, res) => {
    try {
      const cacheKey = `user:${req.user.id}:comments`;
      const cachedComments = await redisClient.get(cacheKey);

      if (cachedComments) {
        return res.status(200).json(JSON.parse(cachedComments));
      }

      const commentsResult = await db.query("SELECT * FROM comments WHERE user_id = ? ORDER BY created_at DESC", [req.user.id]);
      await redisClient.set(cacheKey, JSON.stringify(commentsResult), 'EX', 3600);
    
      res.status(200).json(commentsResult);
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
  });

  router.get("/notifications", isAuthenticated, async (req, res) => {
    try {
      const notificationsResult = await db.query(`
        SELECT c.*, p.title AS post_title
        FROM comments c
        JOIN posts p ON c.post_id = p.id
        WHERE p.user_id = ? AND c.user_id != ? AND c.read_status = false
        ORDER BY c.created_at DESC
      `, [req.user.id, req.user.id]);
  
      res.status(200).json(notificationsResult);
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  });

  router.patch("/notifications/read", isAuthenticated, async (req, res) => {
    const { commentId } = req.body;

    if (!commentId) {
        return res.status(400).json({ message: "commentId is required" });
    }

    try {
      await db.query("UPDATE comments SET read_status = true WHERE id = ? AND post_id IN (SELECT id FROM posts WHERE user_id = ?)", [commentId, req.user.id]);
  
      res.status(200).json({ message: "Notification marked as read" });
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  });

export default router;
