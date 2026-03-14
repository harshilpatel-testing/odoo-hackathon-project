import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Category from './models/Category.js';
import Product from './models/Product.js';
import Warehouse from './models/Warehouse.js';
import Receipt from './models/Receipt.js';
import DeliveryOrder from './models/DeliveryOrder.js';
import Transfer from './models/Transfer.js';
import StockAdjustment from './models/StockAdjustment.js';
import Ledger from './models/StockLedger.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected correctly for Seeding');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const importData = async () => {
    await connectDB();

    try {
        // Clear all previous data from the DB to start fresh
        // Uncomment the lines below if you wish to wipe everything first
        // await User.deleteMany();
        // await Category.deleteMany();
        // await Product.deleteMany();
        // await Warehouse.deleteMany();
        // await Receipt.deleteMany();
        // await DeliveryOrder.deleteMany();
        // await Transfer.deleteMany();
        // await StockAdjustment.deleteMany();
        // await Ledger.deleteMany();

        console.log('Fetching users to act as creators/managers...');
        let adminUser = await User.findOne({ email: 'admin@coreinventory.com' });

        if (!adminUser) {
            console.log('Admin user not found. Creating a generic Admin...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);
            adminUser = await User.create({
                name: 'System Admin',
                email: 'admin@coreinventory.com',
                password: hashedPassword,
                role: 'Inventory Manager'
            });
        }
        
        // 1. Create Warehouses
        console.log('Creating Warehouses...');
        const warehouses = await Warehouse.insertMany([
            { name: 'Central Hub', location: 'New York, NY', manager: adminUser._id },
            { name: 'West Coast Depot', location: 'Los Angeles, CA', manager: adminUser._id },
            { name: 'Southern Distribution', location: 'Dallas, TX', manager: adminUser._id }
        ]);

        // 2. Create Categories
        console.log('Creating Categories...');
        const categories = await Category.insertMany([
            { name: 'Electronics' },
            { name: 'Office Furniture' },
            { name: 'Industrial Hardware' },
            { name: 'Packaging Materials' }
        ]);

        // 3. Create Products (15-20 records)
        console.log('Creating Products...');
        const productData = [
            // Electronics
            { name: 'LED Monitor 24"', sku: 'ELEC-MON-24', unitOfMeasure: 'pcs', category: categories[0]._id, minStockAlert: 15, initialStock: 0 },
            { name: 'Wireless Keyboard', sku: 'ELEC-KEY-WL', unitOfMeasure: 'pcs', category: categories[0]._id, minStockAlert: 30, initialStock: 0 },
            { name: 'Ergonomic Mouse', sku: 'ELEC-MOU-ER', unitOfMeasure: 'pcs', category: categories[0]._id, minStockAlert: 20, initialStock: 0 },
            { name: 'HDMI Cable 2m', sku: 'ELEC-CAB-HD2', unitOfMeasure: 'pcs', category: categories[0]._id, minStockAlert: 50, initialStock: 0 },
            { name: 'USB-C Hub', sku: 'ELEC-HUB-UC', unitOfMeasure: 'pcs', category: categories[0]._id, minStockAlert: 15, initialStock: 0 },
            
            // Furniture
            { name: 'Ergonomic Desk Chair', sku: 'FURN-CHR-ERGO', unitOfMeasure: 'pcs', category: categories[1]._id, minStockAlert: 5, initialStock: 0 },
            { name: 'Standing Desk Frame', sku: 'FURN-DSK-STND', unitOfMeasure: 'pcs', category: categories[1]._id, minStockAlert: 5, initialStock: 0 },
            { name: 'Filing Cabinet 3-Drawer', sku: 'FURN-CAB-3D', unitOfMeasure: 'pcs', category: categories[1]._id, minStockAlert: 8, initialStock: 0 },
            { name: 'Desk Organizer', sku: 'FURN-ORG-DSK', unitOfMeasure: 'pcs', category: categories[1]._id, minStockAlert: 15, initialStock: 0 },
            { name: 'Whiteboard 4x6', sku: 'FURN-BRD-4X6', unitOfMeasure: 'pcs', category: categories[1]._id, minStockAlert: 3, initialStock: 0 },

            // Hardware
            { name: 'Stainless Steel Screws (Box 100)', sku: 'HARD-SCR-SS100', unitOfMeasure: 'boxes', category: categories[2]._id, minStockAlert: 200, initialStock: 0 },
            { name: 'Heavy Duty Measuring Tape', sku: 'HARD-TAP-HD', unitOfMeasure: 'pcs', category: categories[2]._id, minStockAlert: 40, initialStock: 0 },
            { name: 'Socket Wrench Set', sku: 'HARD-SET-WRN', unitOfMeasure: 'sets', category: categories[2]._id, minStockAlert: 10, initialStock: 0 },
            { name: 'Safety Goggles', sku: 'HARD-SFT-GOG', unitOfMeasure: 'pairs', category: categories[2]._id, minStockAlert: 50, initialStock: 0 },
            { name: 'Claw Hammer 16oz', sku: 'HARD-HAM-16', unitOfMeasure: 'pcs', category: categories[2]._id, minStockAlert: 20, initialStock: 0 },

            // Packaging
            { name: 'Corrugated Box 12x12x12', sku: 'PKG-BOX-12S', unitOfMeasure: 'bundles', category: categories[3]._id, minStockAlert: 100, initialStock: 0 },
            { name: 'Bubble Wrap 50m', sku: 'PKG-BBL-50M', unitOfMeasure: 'rolls', category: categories[3]._id, minStockAlert: 30, initialStock: 0 },
            { name: 'Packing Tape (Pack of 6)', sku: 'PKG-TAP-6P', unitOfMeasure: 'packs', category: categories[3]._id, minStockAlert: 40, initialStock: 0 },
            { name: 'Poly Mailers 10x13', sku: 'PKG-MAIL-1013', unitOfMeasure: 'packs', category: categories[3]._id, minStockAlert: 80, initialStock: 0 }
        ];

        // Randomly assign stock to warehouses
        const products = await Product.insertMany(productData.map(p => {
            // Assign some stock across the 3 warehouses randomly
            const totalStock = Math.floor(Math.random() * 150) + 10; // Between 10 and 160
            const w1Stock = Math.floor(totalStock * 0.5);
            const w2Stock = Math.floor(totalStock * 0.3);
            const w3Stock = totalStock - w1Stock - w2Stock;

            p.locations = [
                { warehouse: warehouses[0]._id, quantity: w1Stock },
                { warehouse: warehouses[1]._id, quantity: w2Stock },
                { warehouse: warehouses[2]._id, quantity: w3Stock }
            ];
            return p;
        }));

        // 4. Create Ledger Entries to represent the "Initial Stock" we just magically added
        console.log('Creating Initial Ledger Entries for the new stock...');
        const ledgerEntries = [];
        
        products.forEach(p => {
            p.locations.forEach(loc => {
                if(loc.quantity > 0) {
                    ledgerEntries.push({
                        date: new Date(Date.now() - Math.random() * 10000000000), // Random time in the past
                        operationType: 'Receipt',
                        referenceDocument: 'INIT-MIG-' + Math.floor(Math.random() * 10000),
                        product: p._id,
                        destinationLocation: loc.warehouse,
                        quantity: loc.quantity,
                        status: 'Done',
                        user: adminUser._id
                    });
                }
            });
        });
        await Ledger.insertMany(ledgerEntries);

        console.log('Seed Data Successfully Imported!');
        process.exit();
    } catch (error) {
        console.error('Error with import data', error);
        process.exit(1);
    }
};

importData();
