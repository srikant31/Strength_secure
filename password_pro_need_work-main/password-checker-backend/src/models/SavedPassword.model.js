import mongoose from 'mongoose';

/**
 * SavedPassword — stores plain-text passwords for a user's vault.
 * These are NOT hashed because the user needs to READ them back.
 * The collection is per-user and protected by JWT auth on every route.
 */
const savedPasswordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    siteName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    password: {
      type: String,
      required: true,
      maxlength: 500,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
  },
  { timestamps: true }
);

export const SavedPassword = mongoose.model('SavedPassword', savedPasswordSchema);
