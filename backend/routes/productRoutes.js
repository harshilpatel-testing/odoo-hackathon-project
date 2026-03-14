import express from 'express';
import {
    getProducts, getProductById, createProduct, updateProduct, deleteProduct,
    getCategories, createCategory
} from '../controllers/productController.js';
import { protect, manager } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/categories').get(protect, getCategories).post(protect, manager, createCategory);
router.route('/').get(protect, getProducts).post(protect, manager, createProduct);
router.route('/:id').get(protect, getProductById).put(protect, manager, updateProduct).delete(protect, manager, deleteProduct);

export default router;
