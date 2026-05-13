import { Router }   from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit    from 'express-rate-limit';
import { User }     from '../models/User.model.js';
import { signToken } from '../utils/jwt.js';
import { analyzePassword } from '../utils/passwordStrength.js';
import { requireAuth }     from '../middleware/auth.middleware.js';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import { checkPasswordBreach } from '../utils/hibp.js';
import { generateOTP, sendOtpEmail, sendWelcomeEmail, sendLoginAlertEmail, sendPasswordResetEmail } from '../services/mfa.service.js';

export const authRouter = Router();

/* ── Rate limiters ──────────────────────────────────────────────────────── */

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

/* ── Validation chains ──────────────────────────────────────────────────── */

const registerValidation = [
  body('username').trim().isLength({ min: 2, max: 30 }).withMessage('Username must be 2–30 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

/* ── Helper ─────────────────────────────────────────────────────────────── */
function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return false;
  }
  return true;
}

/* ── POST /api/auth/register ────────────────────────────────────────────── */
authRouter.post('/register', authLimiter, registerValidation, async (req, res, next) => {
  try {
    if (!validate(req, res)) return;

    const { username, email, password } = req.body;

    // Server-side strength gate
    const strength = analyzePassword(password);
    if (!strength.acceptable) {
      return res.status(400).json({
        message: `Password too weak (${strength.label}). Please choose a stronger one.`,
      });
    }

    // HIBP Check
    const breachCount = await checkPasswordBreach(password);
    if (breachCount > 0) {
      logger.warn(`Registration blocked: Password for ${email} found in ${breachCount} breaches.`);
      return res.status(400).json({
        message: 'This password has appeared in a data breach. Please choose a different one.',
      });
    }

    // Check for existing user
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    // Create user and hash password
    const user = new User({ username, email });
    // Defaulting mfaEnabled to true for this assignment test flow, 
    // or you can configure this later in user settings.
    user.mfaEnabled = true; 

    await user.setPassword(password);
    await user.save();

    logger.info(`User registered successfully: ${email}`);
    sendWelcomeEmail(user.email, user.username).catch(err => logger.error('Email error:', err));
    const token = signToken(user._id);

    res.status(201).json({ token, user: user.toPublic() });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/auth/login ───────────────────────────────────────────────── */
authRouter.post('/login', authLimiter, loginValidation, async (req, res, next) => {
  try {
    if (!validate(req, res)) return;

    const { email, password } = req.body;

    // Fetch user WITH password hash
    const user = await User.findOne({ email }).select('+passwordHash +mfaOtp +mfaOtpExpiry');
    if (!user) {
      logger.warn(`Failed login attempt: User not found for email ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isLocked()) {
      logger.warn(`Blocked login attempt for locked account: ${email}`);
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(403).json({ 
        message: `Account is locked due to too many failed attempts. Try again in ${minutesLeft} minutes.` 
      });
    }


    const valid = await user.comparePassword(password);
    if (!valid) {
      await user.incrementLoginAttempts();
      await user.save();
      logger.warn(`Failed login attempt for ${email}. Attempts: ${user.loginAttempts}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Success! Reset attempts
    await user.resetLoginAttempts();
    await user.save();

    // Check MFA
    if (user.mfaEnabled) {
      const otp = generateOTP();
      user.mfaOtp = otp;
      user.mfaOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 mins
      await user.save();

      // Send email async
      sendOtpEmail(user.email, otp).catch(err => logger.error('Failed to send OTP logger error:', err));

      logger.info(`OTP generated for user ${email}`);
      return res.json({ message: 'OTP sent to email', requireOtp: true, email: user.email });
    }

    logger.info(`Successful login for user: ${email}`);
    sendLoginAlertEmail(user.email, {
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')
    }).catch(err => logger.error('Email error:', err));
    const token = signToken(user._id);
    res.json({ token, user: user.toPublic() });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/auth/login/otp ───────────────────────────────────────────── */
authRouter.post('/login/otp', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('otp').isString().isLength({ min: 6, max: 6 })
], async (req, res, next) => {
  try {
    if (!validate(req, res)) return;
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select('+mfaOtp +mfaOtpExpiry');
    if (!user) return res.status(401).json({ message: 'Invalid request' });

    if (!user.mfaOtp || !user.mfaOtpExpiry || user.mfaOtpExpiry < Date.now()) {
      return res.status(400).json({ message: 'OTP expired or invalid. Please login again.' });
    }

    if (user.mfaOtp !== otp) {
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    // Clear OTP logic
    user.mfaOtp = undefined;
    user.mfaOtpExpiry = undefined;
    await user.save();

    logger.info(`Successful MFA login for user: ${email}`);
    sendLoginAlertEmail(user.email, {
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')
    }).catch(err => logger.error('Email error:', err));
    const token = signToken(user._id);
    res.json({ token, user: user.toPublic() });
  } catch (err) {
    next(err);
  }
});

/* ── GET /api/auth/me ───────────────────────────────────────────────────── */
authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user.toPublic() });
});

/* ── POST /api/auth/change-password ────────────────────────────────────── */
authRouter.post('/change-password', requireAuth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
], async (req, res, next) => {
  try {
    if (!validate(req, res)) return;

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+passwordHash +passwordHistory');

    const valid = await user.comparePassword(currentPassword);
    if (!valid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    await user.save();

    // Strength check
    const strength = analyzePassword(newPassword);
    if (!strength.acceptable) {
      return res.status(400).json({
        message: `New password too weak (${strength.label}). Please choose a stronger one.`,
      });
    }

    // HIBP Check
    const breachCount = await checkPasswordBreach(newPassword);
    if (breachCount > 0) {
      logger.warn(`Password change blocked: new password for ${req.user.email} found in breaches.`);
      return res.status(400).json({
        message: 'This password has appeared in a data breach. Please choose a different one.',
      });
    }

    // History check
    const reused = await user.isPreviousPassword(newPassword);
    if (reused) {
      return res.status(400).json({
        message: 'You cannot reuse a recent password. Please choose a new one.',
      });
    }

    await user.setPassword(newPassword);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/auth/forgot-password ────────────────────────────────────── */
authRouter.post('/forgot-password', authLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
], async (req, res, next) => {
  try {
    if (!validate(req, res)) return;

    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't leak if email exists
      return res.json({ message: 'If that email exists in our system, a password reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hr

    await user.save();

    const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    const resetUrl = `${clientOrigin}/reset-password/${resetToken}`;

    await sendPasswordResetEmail(user.email, resetUrl);
    
    logger.info(`Password reset requested for ${email}`);
    res.json({ message: 'If that email exists in our system, a password reset link has been sent.' });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/auth/reset-password/:token ──────────────────────────────── */
authRouter.post('/reset-password/:token', authLimiter, [
  body('password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
], async (req, res, next) => {
  try {
    if (!validate(req, res)) return;

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+passwordHash +passwordHistory +resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    const { password } = req.body;

    const strength = analyzePassword(password);
    if (!strength.acceptable) {
      return res.status(400).json({ message: `Password too weak (${strength.label}). Please choose a stronger one.` });
    }

    const breachCount = await checkPasswordBreach(password);
    if (breachCount > 0) {
      return res.status(400).json({ message: 'This password has appeared in a data breach. Please choose a different one.' });
    }

    const reused = await user.isPreviousPassword(password);
    if (reused) {
      return res.status(400).json({ message: 'You cannot reuse a recent password. Please choose a new one.' });
    }

    await user.setPassword(password);
    
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    logger.info(`Password successfully reset for ${user.email}`);
    res.json({ message: 'Your password has been successfully reset. You may now log in.' });
  } catch (err) {
    next(err);
  }
});
