import express from "express";

const router = express.Router();

router.get("/ping", async (req, res) => {
  res.send("pong");
});

router.get("/health", async (req, res) => {
  res.status(200).send('OK');
});

export default router;
