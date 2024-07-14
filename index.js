import "dotenv/config.js";

import express from "express";
import cors from "cors";
import logger from "morgan";
import session from "express-session";
import RedisStore from "connect-redis";
import passport from "passport";
import indexRouter from "./routes/index.js";
import authRouter from "./routes/auth.js";
import petsRouter from "./routes/pets.js";
import { connectToMySQL } from "./services/mysql.js";
import redisClient from "./services/redis.js";

const port = process.env.PORT || 3000;
const app = express();

app.use(logger("dev"));
app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URI,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SECRET,
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    store: new RedisStore({ client: redisClient }),
  })
);

app.use(passport.authenticate("session"));

app.use("/", indexRouter);
app.use("/", authRouter);
app.use("/pets", petsRouter);

connectToMySQL().then(async () => {
  await redisClient.connect();

  app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
  });
});
