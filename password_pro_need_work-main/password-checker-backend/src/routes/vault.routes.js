import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/auth.middleware.js';
import { SavedPassword } from '../models/SavedPassword.model.js';

export const vaultRouter = Router();

// All vault routes require authentication
vaultRouter.use(requireAuth);

function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return false;
  }
  return true;
}

/* ── GET /api/vault ─────────────────────────────────────────────────────── */
// Returns all saved passwords for the logged-in user
vaultRouter.get('/', async (req, res, next) => {
  try {
    const items = await SavedPassword.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ vault: items });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/vault ─────────────────────────────────────────────────────── */
// Add a new password entry
vaultRouter.post('/', [
  body('siteName').trim().notEmpty().withMessage('Site/service name is required').isLength({ max: 100 }),
  body('password').notEmpty().withMessage('Password is required').isLength({ max: 500 }),
  body('notes').optional().isLength({ max: 300 }),
], async (req, res, next) => {
  try {
    if (!validate(req, res)) return;
    const { siteName, password, notes } = req.body;
    const entry = await SavedPassword.create({
      userId: req.user._id,
      siteName,
      password,
      notes: notes || '',
    });
    res.status(201).json({ entry });
  } catch (err) {
    next(err);
  }
});

/* ── DELETE /api/vault/:id ──────────────────────────────────────────────── */
// Delete a saved password entry (only if it belongs to the logged-in user)
vaultRouter.delete('/:id', async (req, res, next) => {
  try {
    const entry = await SavedPassword.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!entry) return res.status(404).json({ message: 'Entry not found.' });
    res.json({ message: 'Deleted.' });
  } catch (err) {
    next(err);
  }
});

/* ── PATCH /api/vault/:id ───────────────────────────────────────────────── */
// Update a saved password entry
vaultRouter.patch('/:id', [
  body('siteName').optional().trim().notEmpty().isLength({ max: 100 }),
  body('password').optional().notEmpty().isLength({ max: 500 }),
  body('notes').optional().isLength({ max: 300 }),
], async (req, res, next) => {
  try {
    if (!validate(req, res)) return;
    const { siteName, password, notes } = req.body;
    const update = {};
    if (siteName !== undefined) update.siteName = siteName;
    if (password !== undefined) update.password = password;
    if (notes    !== undefined) update.notes    = notes;

    const entry = await SavedPassword.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: update },
      { new: true }
    );
    if (!entry) return res.status(404).json({ message: 'Entry not found.' });
    res.json({ entry });
  } catch (err) {
    next(err);
  }
});
