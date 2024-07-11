import "dotenv/config.js";

import express from "express";
import cors from "cors";
import logger from "morgan";
import petsRouter from "./routes/pets.js";

const app = express();

app.use(logger("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/ping", async (req, res) => {
  res.send("pong");
});

app.use("/pets", petsRouter);

app.listen(process.env.PORT, () =>
  console.log(`Listening on http://localhost:${process.env.PORT || 3000}`)
);
