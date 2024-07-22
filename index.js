import "dotenv/config.js";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import RedisStore from "connect-redis";
import cors from "cors";
import express from "express";
import session from "express-session";
import logger from "morgan";
import passport from "passport";

import authRouter from "./routes/auth.js";
import donationsRouter from "./routes/donations.js";
import indexRouter from "./routes/index.js";
import petsRouter from "./routes/pets.js";
import { resolvers, typeDefs } from "./services/graphql.js";
import { connectToMySQL } from "./services/mysql.js";
import redisClient from "./services/redis.js";

const port = process.env.PORT || 3000;
const app = express();

const server = new ApolloServer({ typeDefs, resolvers });
await server.start();

app.use(logger("dev"));
app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URI
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SECRET,
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    store: new RedisStore({ client: redisClient })
  })
);

app.use(passport.authenticate("session"));

app.use("/", indexRouter);
app.use("/", authRouter);
app.use("/pets", petsRouter);
app.use("/donations", donationsRouter);

app.use("/", expressMiddleware(server, {}));

connectToMySQL().then(async () => {
  await redisClient.connect();

  app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
  });
});
