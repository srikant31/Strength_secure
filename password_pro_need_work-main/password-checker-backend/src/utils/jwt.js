import jwt from 'jsonwebtoken';

/**
 * Sign a JWT containing the user's id.
 * @param {string|Object} userId
 * @returns {string} signed token
 */
export function signToken(userId) {
  return jwt.sign(
    { sub: userId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Verify and decode a JWT.
 * Throws if the token is invalid or expired.
 * @param {string} token
 * @returns {object} decoded payload
 */
export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
