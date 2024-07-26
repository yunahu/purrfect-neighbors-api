import "dotenv/config.js";

import { promisify } from "util";
import mysql from "mysql";

export let db;

export const connectToMySQL = async () => {
  db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  const connect = promisify(db.connect).bind(db);
  const query = promisify(db.query).bind(db);

  try {
    await connect();
    await query("SET time_zone = 'America/Vancouver';");
    console.log("Connected to MySQL");
  } catch (err) {
    console.error("Error connecting to MySQL:", err);
    db.end();
  }
};
