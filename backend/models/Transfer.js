import mongoose from 'mongoose';

const transferSchema = new mongoose.Schema({
    referenceId: { type: String, unique: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['Draft', 'Waiting', 'Ready', 'Done', 'Canceled'], default: 'Draft' },
    sourceLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    destinationLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    products: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, required: true }
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Transfer', transferSchema);
