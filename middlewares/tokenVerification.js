const createHttpError = require("http-errors");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const User = require("../models/userModel");

const isVerifiedUser = async (req, res, next) => {
  try {
    let accessToken;
                    // 1. Try cookie first (React frontend)

    if (req.cookies && req.cookies.accessToken) {
      accessToken = req.cookies.accessToken;
    }
                    // 2. If not in cookie, check Authorization header (Postman)
    if (!accessToken) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        accessToken = authHeader.split(" ")[1];
      }
    }
    // check if token is present
    if (!accessToken) {
      const err = createHttpError(401, "Access token is missing");
      return next(err);
    }
    // decode and verify token
    const decodedToken = jwt.verify(accessToken, config.assessTokenSecret);

    // find user with the id in the token
    const user = await User.findById(decodedToken._id);

    if (!user) return next(createHttpError(401, "User not found"));

    // attach user to req object
    res.user = user;
    next();
  } catch (error) {
    const err = createHttpError(400, "Invalid Token");
    return next(err);
  }
};

module.exports = { isVerifiedUser };
