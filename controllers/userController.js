const createHttpError = require("http-errors");
const User = require("../models/userModel");
const { verifyPassword } = require("../util/passwordEnrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

const register = async (req, res, next) => {
    try {
        // destructure user input from req.body
        const {name, email, phone, password, role} = req.body;

        // weither they are filled or not if not throow an error
        if(!name || !email || !phone || !password || !role) {
            const err = new createHttpError(400, "All fields are required");
           return next(err) // Pass error to global error handler 
        }

        // find if user already exists with the email
        const isUserPresent = await User.findOne({email})
        if(isUserPresent) {
            const err = new createHttpError(400, "User already registered with this email");
           return next(err); // Pass error to global error handler
        }
        const user =  {name, email, phone, password, role}
        const newUser = new User(user)
        await newUser.save()

        res.status(201).json({
            success: true,
            message: 'new user created successfully',
            data: newUser
        })
        
    } catch (error) {
       return next(error); // Pass error to global error handler
    }

}

const login = async (req, res, next) => {
    try {
        const {email, password} = req.body; // destructure user input from req.body
        
        // check if email and password are provided
        if(!email || !password) {
            const err =  new createHttpError(401, "Email and password are required");
        }

        // check if user is present with the email
        const user =  await User.findOne({email})
        if(!user){
            const err = new createHttpError(401, "Invalid email or password");
            return next(err); // Pass error to global error handler
        }
        // verify password
        const isMatch = await verifyPassword(user.password, password);
        if(!isMatch) {
            const err = new createHttpError(401, "Invalid email or password");
            return next(err); // Pass error to global error handler
        }

        const accessToken = jwt.sign({_id: user._id}, config.assessTokenSecret, 
            {
                expiresIn: '1d'
            })

        res.cookie('accessToken', accessToken, {
            maxAge: 24 * 60 * 60 * 1000*30, // 30d
            httpOnly: true,
            sameSite: 'none',
            secure: true
        })

        // login successful
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: user,

        })
        
    } catch (error) {
        console.error('LOGIN ERROR',error);
        return next(error); // Pass error to global error handler
    }

}

const getUserData =  async (req, res, next) => {
    try {
        const user =  await User.findById(res.user._id)

        res.status(200).json({
            success: true,
            message: "User data fetched successfully",
            data: user
        })
        
    } catch (error) {
        const err = new createHttpError(500, "Internal Server Error");
        return next(err);
    }
}

module.exports = {register, login, getUserData};


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



0