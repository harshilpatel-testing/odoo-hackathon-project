import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    unitOfMeasure: { type: String, required: true },
    initialStock: { type: Number, default: 0 },
    minStockAlert: { type: Number, default: 0 },
    locations: [{
        warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
        quantity: { type: Number, default: 0 },
        rackCode: { type: String }
    }]
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
