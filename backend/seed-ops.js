import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Product from './models/Product.js';
import Warehouse from './models/Warehouse.js';
import Receipt from './models/Receipt.js';
import DeliveryOrder from './models/DeliveryOrder.js';
import Transfer from './models/Transfer.js';

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected correctly for Operations Seeding');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const importOperations = async () => {
    await connectDB();

    try {
        const adminUser = await User.findOne({ email: 'admin@coreinventory.com' });
        const products = await Product.find();
        const warehouses = await Warehouse.find();

        if (!adminUser || products.length === 0 || warehouses.length === 0) {
            console.log('Dependencies not found, please run seed.js first.');
            process.exit();
        }

        console.log('Creating Random Receipts...');
        const receiptsData = [];
        for(let i=0; i<5; i++) {
            const numProducts = Math.floor(Math.random() * 3) + 1;
            const pLines = [];
            for (let j=0; j<numProducts; j++) {
                pLines.push({
                    product: products[Math.floor(Math.random() * products.length)]._id,
                    quantity: Math.floor(Math.random() * 50) + 5
                });
            }
            receiptsData.push({
                referenceId: `REC-MOCK-${Math.floor(Math.random() * 90000)}`,
                supplier: 'Global Vendors Ltd.',
                warehouse: warehouses[Math.floor(Math.random() * warehouses.length)]._id,
                date: new Date(Date.now() - Math.random() * 100000000),
                status: ['Draft', 'Done', 'Canceled'][Math.floor(Math.random() * 3)],
                products: pLines,
                createdBy: adminUser._id
            });
        }
        await Receipt.insertMany(receiptsData);

        console.log('Creating Random Deliveries...');
        const deliveriesData = [];
        for(let i=0; i<6; i++) {
            const numProducts = Math.floor(Math.random() * 3) + 1;
            const pLines = [];
            for (let j=0; j<numProducts; j++) {
                pLines.push({
                    product: products[Math.floor(Math.random() * products.length)]._id,
                    warehouse: warehouses[Math.floor(Math.random() * warehouses.length)]._id,
                    quantity: Math.floor(Math.random() * 20) + 1
                });
            }
            deliveriesData.push({
                referenceId: `DEL-MOCK-${Math.floor(Math.random() * 90000)}`,
                customer: 'Acme Corp.',
                date: new Date(Date.now() - Math.random() * 10000000),
                status: ['Draft', 'Picked', 'Packed', 'Done', 'Canceled'][Math.floor(Math.random() * 5)],
                products: pLines,
                createdBy: adminUser._id
            });
        }
        await DeliveryOrder.insertMany(deliveriesData);

        console.log('Creating Random Transfers...');
        const transfersData = [];
        for(let i=0; i<5; i++) {
            const src = warehouses[Math.floor(Math.random() * warehouses.length)];
            let dest = warehouses[Math.floor(Math.random() * warehouses.length)];
            // ensure src !== dest
            while (src._id.toString() === dest._id.toString()) {
                dest = warehouses[Math.floor(Math.random() * warehouses.length)];
            }

            const numProducts = Math.floor(Math.random() * 2) + 1;
            const pLines = [];
            for (let j=0; j<numProducts; j++) {
                pLines.push({
                    product: products[Math.floor(Math.random() * products.length)]._id,
                    quantity: Math.floor(Math.random() * 15) + 5
                });
            }
            transfersData.push({
                referenceId: `TRN-MOCK-${Math.floor(Math.random() * 90000)}`,
                sourceLocation: src._id,
                destinationLocation: dest._id,
                date: new Date(Date.now() - Math.random() * 1000000),
                status: ['Draft', 'Waiting', 'Done', 'Canceled'][Math.floor(Math.random() * 4)],
                products: pLines,
                createdBy: adminUser._id
            });
        }
        await Transfer.insertMany(transfersData);

        console.log('Operations Seed Data Imported!');
        process.exit();
    } catch (error) {
        console.error('Error with ops data', error);
        process.exit(1);
    }
};

importOperations();
