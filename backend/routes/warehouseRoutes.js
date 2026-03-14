import express from 'express';
import { getWarehouses, getWarehouseById, createWarehouse, updateWarehouse, deleteWarehouse } from '../controllers/warehouseController.js';
import { protect, manager } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getWarehouses).post(protect, manager, createWarehouse);
router.route('/:id')
    .get(protect, getWarehouseById)
    .put(protect, manager, updateWarehouse)
    .delete(protect, manager, deleteWarehouse);

export default router;
