import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Product from './models/Product.js';
import Warehouse from './models/Warehouse.js';
import DeliveryOrder from './models/DeliveryOrder.js';

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected correctly for Deliveries Seeding');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const importMoreDeliveries = async () => {
    await connectDB();

    try {
        const adminUser = await User.findOne({ email: 'admin@coreinventory.com' });
        const products = await Product.find();
        const warehouses = await Warehouse.find();

        if (!adminUser || products.length === 0 || warehouses.length === 0) {
            console.log('Dependencies not found. Run seed.js first.');
            process.exit();
        }

        console.log('Creating 15 More Random Deliveries...');
        const deliveriesData = [];
        
        const customers = [
            'Reliance Retail', 
            'Tata Electronics', 
            'Amazon Fulfillment Centers', 
            'Flipkart Hub', 
            'D-Mart Stores',
            'Croma Electronics',
            'Local Hardware Store',
            'Corporate Office Setup Ltd.'
        ];

        for(let i=0; i<15; i++) {
            const numProducts = Math.floor(Math.random() * 4) + 1; // 1 to 4 products per order
            const pLines = [];
            
            // Randomly select products without replacement to avoid duplicates in same order
            let availableProducts = [...products];

            for (let j=0; j<numProducts; j++) {
                if(availableProducts.length === 0) break;
                
                const randIdx = Math.floor(Math.random() * availableProducts.length);
                const selectedProduct = availableProducts[randIdx];
                availableProducts.splice(randIdx, 1);
                
                pLines.push({
                    product: selectedProduct._id,
                    warehouse: warehouses[Math.floor(Math.random() * warehouses.length)]._id, // Each line can potentially come from a different warehouse, or keep it simple
                    quantity: Math.floor(Math.random() * 10) + 1 // 1 to 10 quantity
                });
            }
            
            const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
            const randomDate = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000); // Random date within last 30 days
            const statuses = ['Draft', 'Picked', 'Packed', 'Done', 'Canceled'];
            // Bias towards 'Done' for realistic data 
            const statusWeights = ['Draft', 'Draft', 'Picked', 'Packed', 'Done', 'Done', 'Done', 'Done', 'Canceled'];
            const randomStatus = statusWeights[Math.floor(Math.random() * statusWeights.length)];

            deliveriesData.push({
                referenceId: `DEL-MOCK-${Math.floor(Math.random() * 900000) + 100000}`,
                customer: randomCustomer,
                date: randomDate,
                status: randomStatus,
                products: pLines,
                createdBy: adminUser._id
            });
        }
        
        await DeliveryOrder.insertMany(deliveriesData);

        console.log('15 Delivery Orders Successfully Imported!');
        process.exit();
    } catch (error) {
        console.error('Error importing deliveries', error);
        process.exit(1);
    }
};

importMoreDeliveries();
