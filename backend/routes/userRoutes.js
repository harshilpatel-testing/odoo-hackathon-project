import express from 'express';
import { getUsers, deleteUser } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Both routes must be protected and ideally checked for Manager role
router.route('/').get(protect, getUsers);
router.route('/:id').delete(protect, deleteUser);

export default router;
