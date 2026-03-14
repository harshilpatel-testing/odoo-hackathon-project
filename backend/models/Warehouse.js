import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    racks: [{ type: String }] // Array of rack codes
}, { timestamps: true });

export default mongoose.model('Warehouse', warehouseSchema);
