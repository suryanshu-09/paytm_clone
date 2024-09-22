const { SECRET } = require("./.env");
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({
      msg: "Authentication error."
    })
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.headers.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(403).json({
      msg: "Invalid credentials."
    })
  }
}

module.exports = {
  authMiddleware
};
