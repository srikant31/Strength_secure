import { verifyToken } from '../utils/jwt.js';
import { User }        from '../models/User.model.js';

/**
 * Protect routes: verify Bearer JWT and attach req.user.
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token   = header.slice(7);
    const payload = verifyToken(token);

    const user = await User.findById(payload.sub).select('-passwordHash -passwordHistory');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
