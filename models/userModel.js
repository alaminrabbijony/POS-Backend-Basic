
const mongoose = require("mongoose");
const { hashPassword } = require("../util/passwordEnrypt");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: { /// validate must be done with zod in input layer as well
            validator: function (v) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: email => `${email.value} is not a valid email address!`
        }
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(v);
            },
            message: props => `Password must be at least 8 characters 
            long and include at least one letter, one number,
             and one special character.`
        }
    },
    role: {
        type: String,
        default: 'user',
       // required: true,
                                    //Not present in tutorials right now but needed later
        // enum: ['admin', 'user'], 
        // default: 'user'
    }

}, {timestamps: true})

// Pre-save hook to hash password before saving
userSchema.pre('save', async function (next) {
    if(!this.isModified('password')) return next();

    try {
        this.password = await hashPassword(this.password)
    } catch (error) {
        console.error("Error hashing password:", error);
        return next(error);
    }
})

module.exports = mongoose.model('User', userSchema) 