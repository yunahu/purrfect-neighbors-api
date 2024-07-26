import { promisify } from "util";
import express from "express";
import passport from "passport";
import GoogleStrategy from "passport-google-oidc";

import { db } from "../services/mysql.js";

const router = express.Router();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env["GOOGLE_CLIENT_ID"],
      clientSecret: process.env["GOOGLE_CLIENT_SECRET"],
      callbackURL: "/oauth2/redirect/google",
      scope: ["profile"]
    },
    function verify(issuer, profile, callback) {
      const query = promisify(db.query).bind(db);
      const run = async () => {
        try {
          const credential = await query(
            "SELECT * FROM federated_credentials WHERE provider = ? AND subject = ?",
            [issuer, profile.id]
          );

          if (credential && credential.length > 0) {
            const user = await query("SELECT * FROM users WHERE id = ?", [
              credential[0].user_id
            ]);

            if (user && user.length > 0) {
              return callback(null, {
                id: user[0].id.toString(),
                name: user[0].name
              });
            } else {
              return callback(null, false);
            }
          } else {
            const newUser = await query("INSERT INTO users (name) VALUES (?)", [
              profile.displayName
            ]);

            const id = newUser.insertId;

            await query(
              "INSERT INTO federated_credentials (user_id, provider, subject) VALUES (?, ?, ?)",
              [id, issuer, profile.id]
            );

            const user = {
              id: id.toString(),
              name: profile.displayName
            };

            return callback(null, user);
          }
        } catch (err) {
          return callback(err);
        }
      };
      run();
    }
  )
);

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, user.id);
  });
});

passport.deserializeUser(function (userId, cb) {
  process.nextTick(async function () {
    try {
      const query = promisify(db.query).bind(db);

      const userDetails = await query("SELECT * FROM users WHERE id = ?", [
        userId
      ]);

      if (userDetails && userDetails.length > 0) {
        return cb(null, {
          id: userDetails[0].id.toString(),
          name: userDetails[0].name
        });
      } else {
        return cb(new Error("User not found"));
      }
    } catch (err) {
      return cb(err);
    }
  });
});

router.get("/login/federated/google", passport.authenticate("google"));

router.get(
  "/oauth2/redirect/google",
  passport.authenticate("google", {
    successReturnToOrRedirect: `${process.env.FRONTEND_URI}`,
    failureRedirect: `${process.env.FRONTEND_URI}/error`
  })
);

router.get("/user", (req, res) => {
  console.log(req.user);
  if (req.user) {
    res.status(200).send(req.user);
  } else {
    res.sendStatus(404);
  }
});

router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
  });
  res.end();
});

router.post("/user/update", async (req, res) => {
  if (!req.user) return res.sendStatus(401);

  const { name } = req.body;
  if (!name) return res.status(400).send("Username is required");

  const query = promisify(db.query).bind(db);
  try {
    await query("UPDATE users SET name = ? WHERE id = ?", [name, req.user.id]);
    res.status(200).send("Username updated");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating username");
  }
});

export default router;
