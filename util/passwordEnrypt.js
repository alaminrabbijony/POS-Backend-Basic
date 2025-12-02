const argon2 = require("argon2");

const ARGON2_OPTIONS = {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
};

const hashPassword = async (password) => {
    return await argon2.hash(password, ARGON2_OPTIONS);
};

const verifyPassword = async (hashed, plain) => {
    return await argon2.verify(hashed, plain);
};

module.exports = { hashPassword, verifyPassword };
