import express from "express";

const router = express.Router();

router.get("/:id", async (req, res, next) => {
  console.log(`${req.params.id}`);
  res.send(`id is: ${req.params.id}`);
});

export default router;
