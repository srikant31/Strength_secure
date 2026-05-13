import mongoose from 'mongoose';
import argon2   from 'argon2';
import bcrypt   from 'bcryptjs'; // kept ONLY for migrating legacy bcrypt hashes

const PASSWORD_HISTORY_LIMIT = 5;

/* ── Argon2id options (OWASP recommended minimums) ──────────────────────────
 *  memoryCost : 64 MB  (2^16 KiB)
 *  timeCost   : 3 iterations
 *  parallelism: 1 thread
 * ────────────────────────────────────────────────────────────────────────── */
const ARGON2_OPTIONS = {
  type:        argon2.argon2id,
  memoryCost:  2 ** 16, // 64 MB
  timeCost:    3,
  parallelism: 1,
};

/** Returns true if the hash is a legacy bcrypt hash ($2b$ or $2a$). */
function isBcryptHash(hash) {
  return typeof hash === 'string' && (hash.startsWith('$2b$') || hash.startsWith('$2a$'));
}

/* ── Sub-schema for password history entries ────────────────────────────── */
const passwordEntrySchema = new mongoose.Schema({
  hash:      { type: String, required: true },
  createdAt: { type: Date,   default: Date.now },
}, { _id: false });

/* ── Main user schema ────────────────────────────────────────────────────── */
const userSchema = new mongoose.Schema({
  username: {
    type:      String,
    required:  [true, 'Username is required'],
    trim:      true,
    minlength: [2,  'Username must be at least 2 characters'],
    maxlength: [30, 'Username must be at most 30 characters'],
  },
  email: {
    type:      String,
    required:  [true, 'Email is required'],
    unique:    true,
    lowercase: true,
    trim:      true,
    match:     [/^\S+@\S+\.\S+$/, 'Invalid email address'],
  },
  passwordHash: {
    type:     String,
    required: true,
    select:   false, // never returned by default
  },
  passwordHistory: {
    type:    [passwordEntrySchema],
    default: [],
    select:  false,
  },
  loginAttempts: {
    type:    Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
  },
  mfaEnabled: {
    type:    Boolean,
    default: false,
  },
  mfaOtp: {
    type:   String,
    select: false,
  },
  mfaOtpExpiry: {
    type:   Date,
    select: false,
  },
  resetPasswordToken: {
    type:   String,
    select: false,
  },
  resetPasswordExpires: {
    type:   Date,
    select: false,
  },
}, {
  timestamps: true,
});

/* ── Instance methods ────────────────────────────────────────────────────── */

/**
 * Check if the user is locked out due to too many failed login attempts.
 */
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

/**
 * Increment failed login attempts. Lock account for 5 mins if >= 3 attempts.
 */
userSchema.methods.incrementLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    // Lock has expired, start over
    this.loginAttempts = 1;
    this.lockUntil = undefined;
  } else {
    this.loginAttempts += 1;
    if (this.loginAttempts >= 3) {
      this.lockUntil = Date.now() + 5 * 60 * 1000; // 5 minutes
    }
  }
};

/**
 * Reset failed login attempts upon successful login.
 */
userSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
};

/**

 * Compare a plain-text password against the stored hash.
 *
 * Supports BOTH legacy bcrypt hashes and new Argon2id hashes.
 * When a bcrypt hash is detected and the password is correct, the hash is
 * automatically upgraded to Argon2id in-memory (caller must call .save()).
 *
 * @param {string} plain - The plain-text password to verify.
 * @returns {Promise<boolean>} True if the password matches.
 */
userSchema.methods.comparePassword = async function (plain) {
  if (isBcryptHash(this.passwordHash)) {
    // ── Legacy path: verify with bcrypt ──────────────────────────────────
    const valid = await bcrypt.compare(plain, this.passwordHash);

    if (valid) {
      // Auto-upgrade: silently re-hash with Argon2id on next save
      console.log(`[Auth] Upgrading password hash for user ${this._id} → Argon2id`);
      this.passwordHash = await argon2.hash(plain, ARGON2_OPTIONS);
      // Note: caller (auth route) must await user.save() after this returns true
    }
    return valid;
  }

  // ── Modern path: verify with Argon2id ──────────────────────────────────
  return argon2.verify(this.passwordHash, plain);
};

/**
 * Check whether a plain-text password matches any entry in the password history.
 * Handles both bcrypt (legacy) and Argon2id history entries.
 *
 * @param {string} plain - The plain-text password to check.
 * @returns {Promise<object|null>} The matched history entry, or null.
 */
userSchema.methods.isPreviousPassword = async function (plain) {
  for (const entry of this.passwordHistory) {
    let matched = false;
    if (isBcryptHash(entry.hash)) {
      matched = await bcrypt.compare(plain, entry.hash);
    } else {
      matched = await argon2.verify(entry.hash, plain);
    }
    if (matched) return entry;
  }
  return null;
};

/**
 * Hash a new password with Argon2id, update passwordHash, and prepend to history.
 *
 * @param {string} plain - The plain-text password to hash and store.
 */
userSchema.methods.setPassword = async function (plain) {
  const hash = await argon2.hash(plain, ARGON2_OPTIONS);

  // Rotate history: newest first, capped at PASSWORD_HISTORY_LIMIT
  this.passwordHistory = [
    { hash, createdAt: new Date() },
    ...this.passwordHistory,
  ].slice(0, PASSWORD_HISTORY_LIMIT);

  this.passwordHash = hash;
};

/* ── Safe public projection ──────────────────────────────────────────────── */
userSchema.methods.toPublic = function () {
  return {
    id:        this._id,
    username:  this.username,
    email:     this.email,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema, 'securevault_pro');
