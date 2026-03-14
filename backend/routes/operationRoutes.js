import express from 'express';
import {
    createReceipt, getReceipts,
    createDelivery, getDeliveries, updateDeliveryStatus,
    createTransfer, getTransfers,
    createAdjustment, getAdjustments,
    getStockLedger
} from '../controllers/operationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/receipts').get(protect, getReceipts).post(protect, createReceipt);
router.route('/deliveries').get(protect, getDeliveries).post(protect, createDelivery);
router.route('/deliveries/:id/status').patch(protect, updateDeliveryStatus);
router.route('/transfers').get(protect, getTransfers).post(protect, createTransfer);
router.route('/adjustments').get(protect, getAdjustments).post(protect, createAdjustment);
router.route('/ledger').get(protect, getStockLedger);

export default router;
