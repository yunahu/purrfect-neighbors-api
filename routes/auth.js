import express from "express";
import passport from "passport";
import GoogleStrategy from "passport-google-oidc";
import { db } from "../services/mongo.js";
import { ObjectId } from "mongodb";

const router = express.Router();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env["GOOGLE_CLIENT_ID"],
      clientSecret: process.env["GOOGLE_CLIENT_SECRET"],
      callbackURL: "/oauth2/redirect/google",
      scope: ["profile"],
    },
    function verify(issuer, profile, callback) {
      const run = async () => {
        try {
          const credential = await db
            .collection("federated_credentials")
            .findOne({ provider: issuer, subject: profile.id });

          if (credential) {
            const user = await db
              .collection("users")
              .findOne(ObjectId.createFromHexString(credential.user_id));

            if (user) {
              return callback(null, {
                id: user._id.toString(),
                name: user.name,
              });
            } else {
              return callback(null, false);
            }
          } else {
            const newUser = await db
              .collection("users")
              .insertOne({ name: profile.displayName });

            const id = newUser.insertedId.toString();

            await db.collection("federated_credentials").insertOne({
              user_id: id,
              provider: issuer,
              subject: profile.id,
            });

            const user = {
              id: id,
              name: profile.displayName,
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
    const userDetails = await db
      .collection("users")
      .findOne(ObjectId.createFromHexString(userId));

    return cb(null, {
      id: userDetails._id.toString(),
      name: userDetails.name,
    });
  });
});

router.get("/login/federated/google", passport.authenticate("google"));

router.get(
  "/oauth2/redirect/google",
  passport.authenticate("google", {
    successReturnToOrRedirect: "process.env.FRONTEND_URI",
    failureRedirect: `${process.env.FRONTEND_URI}/error`,
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

export default router;
