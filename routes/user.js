import express from "express";

import { promisify } from "util";

import { db } from "../services/mysql.js";
import { isAuthenticated } from "../middleware/middleware.js";

const router = express.Router();

router.get("/posts", isAuthenticated, async (req, res) => {
  const query = promisify(db.query).bind(db);
  try {
    const postResult = await query("SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC", [req.user.id]);
  
    res.status(200).json(postResult);
  } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
  }
});

router.get("/comments", isAuthenticated, async (req, res) => {
    const query = promisify(db.query).bind(db);
    try {
      const commentsResult = await query("SELECT * FROM comments WHERE user_id = ? ORDER BY created_at DESC", [req.user.id]);
  
      console.log(commentsResult);
    
      res.status(200).json(commentsResult);
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
  });

  router.get("/notifications", isAuthenticated, async (req, res) => {
    const query = promisify(db.query).bind(db);
    try {
      const notificationsResult = await query(`
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

    console.log(commentId);

    const query = promisify(db.query).bind(db);
    try {
        const result = await query("UPDATE comments SET read_status = true WHERE id = ? AND post_id IN (SELECT id FROM posts WHERE user_id = ?)", [commentId, req.user.id]);

        console.log("Update result:", result);
  
      res.status(200).json({ message: "Notification marked as read" });
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  });

export default router;
