import mongoose from 'mongoose';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import User from './models/User.js';
import Category from './models/Category.js';
import Warehouse from './models/Warehouse.js';
import Product from './models/Product.js';
import Receipt from './models/Receipt.js';
import DeliveryOrder from './models/DeliveryOrder.js';
import Transfer from './models/Transfer.js';
import StockAdjustment from './models/StockAdjustment.js';
import StockLedger from './models/StockLedger.js';

dotenv.config();

const generateRef = (prefix) => `${prefix}-${Date.now().toString().slice(-6)}`;

const updateProductStock = async (productId, warehouseId, quantityChange) => {
    const product = await Product.findById(productId);
    if (!product) return;

    if (!product.locations) {
        product.locations = [];
    }

    const locIndex = product.locations.findIndex(l => l.warehouse && l.warehouse.toString() === warehouseId.toString());
    if (locIndex >= 0) {
        product.locations[locIndex].quantity += quantityChange;
    } else {
        product.locations.push({ warehouse: warehouseId, quantity: quantityChange });
    }
    await product.save();
};

const runSeed = async () => {
    try {
        await connectDB();

        console.log("Clearing existing sample data...");
        await Category.deleteMany({});
        await Warehouse.deleteMany({});
        await Product.deleteMany({});
        await Receipt.deleteMany({});
        await DeliveryOrder.deleteMany({});
        await Transfer.deleteMany({});
        await StockAdjustment.deleteMany({});
        await StockLedger.deleteMany({});

        // Use the existing admin user
        const adminUser = await User.findOne({ email: 'admin@coreinventory.com' });
        if (!adminUser) {
            console.error("Admin user not found. Please run 'npm run seed' first to create Admin.");
            process.exit(1);
        }

        console.log("Creating Warehouses...");
        const mainStore = await Warehouse.create({ name: 'Main Store', address: 'Block A' });
        const prodRack = await Warehouse.create({ name: 'Production Rack', address: 'Block B' });

        console.log("Creating Categories...");
        const rawMaterials = await Category.create({ name: 'Raw Materials', description: 'Metals, Woods, etc.' });
        const finishedGoods = await Category.create({ name: 'Finished Goods', description: 'Ready to ship' });

        console.log("Creating Products...");
        const steel = await Product.create({
            name: 'Steel',
            sku: 'STL-001',
            category: rawMaterials._id,
            unitOfMeasure: 'kg',
            initialStock: 0,
            minStockAlert: 50
        });

        const frames = await Product.create({
            name: 'Steel Frames',
            sku: 'FRM-100',
            category: finishedGoods._id,
            unitOfMeasure: 'units',
            initialStock: 50,
            minStockAlert: 10
        });

        console.log("Running Operations Simulation to match requested flow...");

        // Step 1: Receive Goods from Vendor (100 kg Steel)
        console.log(" > Receiving 100 kg Steel...");
        const receipt = await Receipt.create({
            referenceId: generateRef('REC'),
            supplier: 'Global Steel Co.',
            products: [{ product: steel._id, quantity: 100, location: mainStore._id }],
            createdBy: adminUser._id,
            status: 'Done'
        });
        await updateProductStock(steel._id, mainStore._id, 100);
        await StockLedger.create({
            product: steel._id,
            operationType: 'Receipt',
            referenceDocument: receipt.referenceId,
            quantity: 100,
            destinationLocation: mainStore._id,
            user: adminUser._id
        });


        // Step 2: Internal Transfer (Main Store to Production Rack) 
        // Example moves 40kg steel to production
        console.log(" > Transferring 40 kg Steel to Production...");
        const transfer = await Transfer.create({
            referenceId: generateRef('TRF'),
            sourceLocation: mainStore._id,
            destinationLocation: prodRack._id,
            products: [{ product: steel._id, quantity: 40 }],
            createdBy: adminUser._id,
            status: 'Done'
        });

        await updateProductStock(steel._id, mainStore._id, -40);
        await updateProductStock(steel._id, prodRack._id, 40);

        await StockLedger.create({
            product: steel._id,
            operationType: 'Transfer Out',
            referenceDocument: transfer.referenceId,
            quantity: -40,
            sourceLocation: mainStore._id,
            user: adminUser._id
        });
        await StockLedger.create({
            product: steel._id,
            operationType: 'Transfer In',
            referenceDocument: transfer.referenceId,
            quantity: 40,
            destinationLocation: prodRack._id,
            user: adminUser._id
        });

        // Add 50 units initial stock of Steel Frames into the Main store so we can deliver it!
        await updateProductStock(frames._id, mainStore._id, 50);

        // Step 3: Deliver finished goods (Sales order for 20 frames)
        console.log(" > Delivering 20 Steel Frames...");
        const delivery = await DeliveryOrder.create({
            referenceId: generateRef('DEL'),
            customer: 'Acme Corp',
            products: [{ product: frames._id, quantity: 20, location: mainStore._id }],
            createdBy: adminUser._id,
            status: 'Done'
        });

        await updateProductStock(frames._id, mainStore._id, -20);
        await StockLedger.create({
            product: frames._id,
            operationType: 'Delivery',
            referenceDocument: delivery.referenceId,
            quantity: -20,
            sourceLocation: mainStore._id,
            user: adminUser._id
        });

        // Step 4: Adjust damaged items (3 kg steel damaged in Production Rack)
        console.log(" > Adjusting Damaged Steel (3 kg)...");
        const adjustment = await StockAdjustment.create({
            referenceId: generateRef('ADJ'),
            warehouse: prodRack._id,
            reason: 'Damaged materials (rusted)',
            products: [{
                product: steel._id,
                recordedQuantity: 40,
                countedQuantity: 37,
                difference: -3
            }],
            createdBy: adminUser._id,
            status: 'Done'
        });

        await updateProductStock(steel._id, prodRack._id, -3);
        await StockLedger.create({
            product: steel._id,
            operationType: 'Adjustment',
            referenceDocument: adjustment.referenceId,
            quantity: -3,
            sourceLocation: prodRack._id,
            user: adminUser._id
        });

        console.log("Successfully seeded database with Random Data mimicking the requested inventory flow!");
        process.exit(0);

    } catch (error) {
        console.error("Error running seed data script:", error);
        process.exit(1);
    }
}

runSeed();
