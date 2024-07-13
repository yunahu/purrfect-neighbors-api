import "dotenv/config.js";

import express from "express";
import cors from "cors";
import logger from "morgan";
import petsRouter from "./routes/pets.js";
import mysql from 'mysql';

const app = express();

app.use(logger("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MySQL connection setup
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
      console.error('Error connecting to MySQL:', err);
      return;
  }
  console.log('Connected to MySQL');
});

app.get("/ping", async (req, res) => {
  res.send("pong");
});

app.use("/pets", petsRouter);

app.listen(process.env.PORT, () =>
  console.log(`Listening on http://localhost:${process.env.PORT || 3000}`)
);
