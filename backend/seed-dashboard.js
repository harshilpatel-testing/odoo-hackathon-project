import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Product from './models/Product.js';
import Warehouse from './models/Warehouse.js';
import StockLedger from './models/StockLedger.js';
import DeliveryOrder from './models/DeliveryOrder.js';

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected correctly for Dashboard Seeding');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seedDashboard = async () => {
    await connectDB();

    try {
        const adminUser = await User.findOne({ email: 'admin@coreinventory.com' });
        const products = await Product.find();
        const warehouses = await Warehouse.find();

        if (!adminUser || products.length === 0 || warehouses.length === 0) {
            console.log('Dependencies not found. Run seed.js first.');
            process.exit();
        }

        console.log('Generating heavy historical Ledger data for charts & AI...');
        const ledgerData = [];
        
        // Generate monthly data spanning back 6 months
        const today = new Date();
        
        for (let m = 0; m < 6; m++) {
            const numOps = Math.floor(Math.random() * 20) + 15; // 15-35 ops per month
            
            for (let i = 0; i < numOps; i++) {
                const isOutflow = Math.random() > 0.4; // 60% chance of outflow (sales) vs inflow
                const date = new Date(today.getFullYear(), today.getMonth() - m, Math.floor(Math.random() * 28) + 1);
                const randProd = products[Math.floor(Math.random() * products.length)];
                const randWh = warehouses[Math.floor(Math.random() * warehouses.length)];
                const qty = Math.floor(Math.random() * 50) + 5;
                
                if (isOutflow) {
                    ledgerData.push({
                        product: randProd._id,
                        operationType: 'Delivery',
                        referenceDocument: `DEL-HIST-${Math.floor(Math.random() * 90000)}`,
                        quantity: -qty, // negative for outflow
                        sourceLocation: randWh._id,
                        user: adminUser._id,
                        date: date
                    });
                } else {
                    ledgerData.push({
                        product: randProd._id,
                        operationType: 'Receipt',
                        referenceDocument: `REC-HIST-${Math.floor(Math.random() * 90000)}`,
                        quantity: qty, // positive for inflow
                        destinationLocation: randWh._id,
                        user: adminUser._id,
                        date: date
                    });
                }
            }
        }
        
        // To trigger AI reordering, we need extremely high recent usage on a few specific products.
        console.log('Triggering AI Reorder Thresholds on specific products...');
        const targetProducts = products.slice(0, 3); // Grab first 3 products
        const recentDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
        
        for(let p of targetProducts) {
            // Log a huge outflow just recently
            ledgerData.push({
                product: p._id,
                operationType: 'Delivery',
                referenceDocument: `DEL-SPIKE-${Math.floor(Math.random() * 9000)}`,
                quantity: -350, // massive recent sale
                sourceLocation: warehouses[0]._id,
                user: adminUser._id,
                date: recentDate
            });
        }
        
        await StockLedger.insertMany(ledgerData);
        console.log(`Inserted ${ledgerData.length} mock ledger entries for charts!`);

        process.exit();
    } catch (error) {
        console.error('Error seeding dashboard', error);
        process.exit(1);
    }
};

seedDashboard();
