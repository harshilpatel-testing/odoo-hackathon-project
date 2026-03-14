import mongoose from 'mongoose';

const stockLedgerSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    operationType: { type: String, enum: ['Receipt', 'Delivery', 'Transfer In', 'Transfer Out', 'Adjustment', 'Initial'], required: true },
    referenceDocument: { type: String }, // Document ID/Ref
    quantity: { type: Number, required: true },
    sourceLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    destinationLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, default: 'Done' }
}, { timestamps: true });

export default mongoose.model('StockLedger', stockLedgerSchema);
