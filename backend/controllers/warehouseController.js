import Warehouse from '../models/Warehouse.js';

export const getWarehouses = async (req, res) => {
    try {
        const warehouses = await Warehouse.find().populate('manager', 'name email');
        res.json(warehouses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getWarehouseById = async (req, res) => {
    try {
        const warehouse = await Warehouse.findById(req.params.id).populate('manager', 'name email');
        if (!warehouse) {
            return res.status(404).json({ message: 'Warehouse not found' });
        }
        res.json(warehouse);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createWarehouse = async (req, res) => {
    try {
        const { name, address, manager, racks } = req.body;

        const warehouse = new Warehouse({
            name, address, manager, racks
        });

        const createdWarehouse = await warehouse.save();
        res.status(201).json(createdWarehouse);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateWarehouse = async (req, res) => {
    try {
        const { name, address, manager, racks } = req.body;
        const warehouse = await Warehouse.findById(req.params.id);

        if (!warehouse) return res.status(404).json({ message: 'Warehouse not found' });

        warehouse.name = name || warehouse.name;
        warehouse.address = address || warehouse.address;
        if (manager) warehouse.manager = manager;
        if (racks) warehouse.racks = racks;

        const updated = await warehouse.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteWarehouse = async (req, res) => {
    try {
        const warehouse = await Warehouse.findById(req.params.id);
        if (!warehouse) return res.status(404).json({ message: 'Warehouse not found' });

        await warehouse.deleteOne();
        res.json({ message: 'Warehouse removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
