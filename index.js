import "dotenv/config.js";

import http from "http";
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
import userRouter from "./routes/user.js";
import { resolvers, typeDefs } from "./services/graphql.js";
import { connectToMySQL } from "./services/mysql.js";
import redisClient from "./services/redis.js";
import { initSocket } from "./services/socket.js";

const port = process.env.PORT || 80;
const app = express();
const httpServer = http.createServer(app);

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

const sessionMiddleware = session({
  secret: process.env.SECRET,
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  store: new RedisStore({ client: redisClient }),
  cookie: {
	  secure: false,
	  sameSite: "lax"
  }
});

app.use(sessionMiddleware);
app.use(passport.authenticate("session"));

initSocket(httpServer, sessionMiddleware);

app.use("/", indexRouter);
app.use("/", authRouter);
app.use("/user", userRouter);
app.use("/pets", petsRouter);
app.use("/donations", donationsRouter);

app.use(
  "/graphql",
  expressMiddleware(server, {
    context: async ({ req }) => ({ req })
  })
);

connectToMySQL().then(async () => {
  await redisClient.connect();

  httpServer.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
  });
});
