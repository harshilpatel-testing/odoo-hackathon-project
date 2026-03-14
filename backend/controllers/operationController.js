import Receipt from '../models/Receipt.js';
import DeliveryOrder from '../models/DeliveryOrder.js';
import Transfer from '../models/Transfer.js';
import StockAdjustment from '../models/StockAdjustment.js';
import StockLedger from '../models/StockLedger.js';
import Product from '../models/Product.js';

const generateRef = (prefix) => `${prefix}-${Date.now().toString().slice(-6)}`;

const updateProductStock = async (productId, warehouseId, quantityChange) => {
    const product = await Product.findById(productId);
    if (!product) return;

    const locIndex = product.locations.findIndex(l => l.warehouse && l.warehouse.toString() === warehouseId.toString());
    if (locIndex >= 0) {
        product.locations[locIndex].quantity += quantityChange;
    } else {
        product.locations.push({ warehouse: warehouseId, quantity: quantityChange });
    }
    await product.save();
};

export const createReceipt = async (req, res) => {
    try {
        const { supplier, products } = req.body;
        const receipt = new Receipt({
            referenceId: generateRef('REC'),
            supplier,
            products,
            createdBy: req.user._id,
            status: 'Done' // auto validate for MVP
        });

        const saved = await receipt.save();

        for (let p of products) {
            await updateProductStock(p.product, p.location, p.quantity);
            await StockLedger.create({
                product: p.product,
                operationType: 'Receipt',
                referenceDocument: saved.referenceId,
                quantity: p.quantity,
                destinationLocation: p.location,
                user: req.user._id
            });
        }

        res.status(201).json(saved);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getReceipts = async (req, res) => {
    try {
        const receipts = await Receipt.find()
            .populate('products.product', 'name sku')
            .populate('products.location', 'name')
            .populate('createdBy', 'name');
        res.json(receipts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createDelivery = async (req, res) => {
    try {
        const { customer, products } = req.body;
        const delivery = new DeliveryOrder({
            referenceId: generateRef('DEL'),
            customer,
            products,
            createdBy: req.user._id,
            status: 'Draft'
        });

        const saved = await delivery.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateDeliveryStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const delivery = await DeliveryOrder.findById(req.params.id);

        if (!delivery) return res.status(404).json({ message: 'Delivery not found' });

        // If validating for the first time
        if (status === 'Done' && delivery.status !== 'Done') {
            for (let p of delivery.products) {
                await updateProductStock(p.product, p.location, -p.quantity);
                await StockLedger.create({
                    product: p.product,
                    operationType: 'Delivery',
                    referenceDocument: delivery.referenceId,
                    quantity: -p.quantity,
                    sourceLocation: p.location,
                    user: req.user._id
                });
            }
        }

        delivery.status = status;
        const updated = await delivery.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getDeliveries = async (req, res) => {
    try {
        const deliveries = await DeliveryOrder.find()
            .populate('products.product', 'name sku')
            .populate('products.location', 'name')
            .populate('createdBy', 'name');
        res.json(deliveries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createTransfer = async (req, res) => {
    try {
        const { sourceLocation, destinationLocation, products } = req.body;
        const transfer = new Transfer({
            referenceId: generateRef('TRF'),
            sourceLocation,
            destinationLocation,
            products,
            createdBy: req.user._id,
            status: 'Done'
        });

        const saved = await transfer.save();

        for (let p of products) {
            await updateProductStock(p.product, sourceLocation, -p.quantity);
            await updateProductStock(p.product, destinationLocation, p.quantity);

            await StockLedger.create({
                product: p.product,
                operationType: 'Transfer Out',
                referenceDocument: saved.referenceId,
                quantity: -p.quantity,
                sourceLocation: sourceLocation,
                user: req.user._id
            });
            await StockLedger.create({
                product: p.product,
                operationType: 'Transfer In',
                referenceDocument: saved.referenceId,
                quantity: p.quantity,
                destinationLocation: destinationLocation,
                user: req.user._id
            });
        }

        res.status(201).json(saved);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTransfers = async (req, res) => {
    try {
        const transfers = await Transfer.find()
            .populate('sourceLocation destinationLocation', 'name')
            .populate('products.product', 'name sku')
            .populate('createdBy', 'name');
        res.json(transfers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createAdjustment = async (req, res) => {
    try {
        const { warehouse, reason, products } = req.body;
        const adjustment = new StockAdjustment({
            referenceId: generateRef('ADJ'),
            warehouse,
            reason,
            products,
            createdBy: req.user._id,
            status: 'Done'
        });

        const saved = await adjustment.save();

        for (let p of products) {
            await updateProductStock(p.product, warehouse, p.difference);
            await StockLedger.create({
                product: p.product,
                operationType: 'Adjustment',
                referenceDocument: saved.referenceId,
                quantity: p.difference,
                sourceLocation: warehouse,
                user: req.user._id
            });
        }

        res.status(201).json(saved);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAdjustments = async (req, res) => {
    try {
        const adjustments = await StockAdjustment.find()
            .populate('warehouse', 'name')
            .populate('products.product', 'name sku')
            .populate('createdBy', 'name');
        res.json(adjustments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getStockLedger = async (req, res) => {
    try {
        const ledger = await StockLedger.find()
            .populate({
                path: 'product',
                select: 'name sku category',
                populate: { path: 'category', select: 'name' }
            })
            .populate('sourceLocation destinationLocation', 'name')
            .populate('user', 'name')
            .sort({ date: -1 });
        res.json(ledger);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
