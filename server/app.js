const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { sequelize } = require("./db/models");
const authenticateJWT = require("./middleware/authentication");

dotenv.config();
const app = express();
const port = process.env.PORT;

app.use(
  cors({
    origin: process.env.APP_URL,
    credentials: true,
  })
);

// ✅ Passport setup
app.use(passport.initialize());
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      const user = {
        id: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        picture: profile.photos[0].value,
      };
      return done(null, user);
    }
  )
);

// ✅ Google login route
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// ✅ Google callback -> issue JWT
app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "http://localhost:3000/login",
  }),
  (req, res) => {
    const user = req.user;

    // Generate JWT
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Redirect back to frontend with token in query string
    res.redirect(`http://localhost:3000/login?token=${token}`);
  }
);

// ✅ Protected API
app.get("/api/me", authenticateJWT, (req, res) => {
  res.json(req.user);
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, async () => {
  console.log(`Server is listening on port: ${port}`);

  try {
    await sequelize.authenticate();
    console.log("Database Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
});
