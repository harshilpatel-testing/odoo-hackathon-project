import mongoose from 'mongoose';

const stockAdjustmentSchema = new mongoose.Schema({
    referenceId: { type: String, unique: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['Draft', 'Done', 'Canceled'], default: 'Draft' },
    reason: { type: String },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    products: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        recordedQuantity: { type: Number, required: true },
        countedQuantity: { type: Number, required: true },
        difference: { type: Number, required: true }
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('StockAdjustment', stockAdjustmentSchema);
