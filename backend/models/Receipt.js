import mongoose from 'mongoose';

const receiptSchema = new mongoose.Schema({
    referenceId: { type: String, unique: true },
    supplier: { type: String, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['Draft', 'Waiting', 'Ready', 'Done', 'Canceled'], default: 'Draft' },
    products: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, required: true },
        location: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' }
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Receipt', receiptSchema);
