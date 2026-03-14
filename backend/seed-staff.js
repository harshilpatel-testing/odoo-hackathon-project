import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const seedStaff = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected correctly for Staff Seeding');
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);
        
        let staffUser = await User.findOne({ email: 'staff@coreinventory.com' });
        if (!staffUser) {
            await User.create({
                name: 'Basic Warehouse Staff',
                email: 'staff@coreinventory.com',
                password: hashedPassword,
                role: 'Warehouse Staff'
            });
            console.log('Created generic Warehouse Staff account!');
        } else {
            console.log('Staff account already exists!');
        }
        
        process.exit();
    } catch (error) {
        console.error('Error seeding dashboard', error);
        process.exit(1);
    }
};

seedStaff();
