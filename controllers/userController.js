const createHttpError = require("http-errors");
const User = require("../models/userModel");
const { verifyPassword, hashPassword } = require("../util/passwordEnrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

const register = async (req, res, next) => {
  try {
    const { name, phone, email, password, role } = req.body;

    if (!name || !phone || !email || !password || !role) {
      const error = createHttpError(400, "All fields are required!");
      return next(error);
    }

    const isUserPresent = await User.findOne({ email });
    if (isUserPresent) {
      const error = createHttpError(400, "User already exist!");
      return next(error);
    }

    const user = { name, phone, email, password, role };
    const newUser = User(user);
    await newUser.save();

    res
      .status(201)
      .json({ success: true, message: "New user created!", data: newUser });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body; // destructure user input from req.body

    // check if email and password are provided
    if (!email || !password) {
      const err = new createHttpError(401, "Email and password are required");
    }

    // check if user is present with the email
    const user = await User.findOne({ email });
    if (!user) {
      const err = new createHttpError(401, "Invalid email or password");
      return next(err); // Pass error to global error handler
    }
    // verify password
    const isMatch = await verifyPassword(user.password, password);
    if (!isMatch) {
      const err = new createHttpError(401, "Invalid email or password");
      return next(err); // Pass error to global error handler
    }

    const accessToken = jwt.sign({ _id: user._id }, config.assessTokenSecret, {
      expiresIn: "1d",
    });

    res.cookie("accessToken", accessToken, {
      maxAge: 24 * 60 * 60 * 1000 * 30, // 30d
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    // login successful
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: user,
    });
  } catch (error) {
    console.error("LOGIN ERROR", error);
    return next(error); // Pass error to global error handler
  }
};

const getUserData = async (req, res, next) => {
  try {
    const user = await User.findById(res.user._id);

    res.status(200).json({
      success: true,
      message: "User data fetched successfully",
      data: user,
    });
  } catch (error) {
    const err = new createHttpError(500, "Internal Server Error");
    return next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    res.clearCookie("accessToken");
    res.status(200).json({
      success: true,
      message: "User has been successfully logout",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { register, login, logout, getUserData };

//          Register
// {
//   "name": "arj2",
//   "email": "test@example6.com",
//   "phone": "01700000021",
//   "password": "Test@0246810",
//   "role": "admin"
// }

//Login
// {
//   "email": "test@example6.com",
//   "password": "Test@0246810"
// }

0;
