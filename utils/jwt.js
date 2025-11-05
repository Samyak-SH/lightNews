const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';


exports.signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });
exports.verifyToken = (token) => jwt.verify(token, JWT_SECRET);