const jwt = require("jsonwebtoken");

// ✅ Middleware to protect routes
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token" });

  try {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: "Invalid token" });
      req.user = user;
      next();
    });
  } catch (err) {
    console.log(err);
    res.status(401).send({ error: "Authentication failed" });
  }
};

module.exports = authenticateJWT;
