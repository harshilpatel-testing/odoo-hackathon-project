import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Search, PackageOpen, X, Edit, Trash2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formState, setFormState] = useState({
        name: '',
        sku: '',
        categoryName: '',
        unitOfMeasure: 'pcs',
        minStockAlert: 10,
        initialStock: 0,
        warehouseId: ''
    });

    useEffect(() => {
        fetchProducts();
        fetchWarehouses();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data);
        } catch (error) {
            console.error('Failed to fetch products');
        }
    };

    const fetchWarehouses = async () => {
        try {
            const res = await api.get('/warehouses');
            setWarehouses(res.data);
        } catch (error) {
            console.error('Failed to fetch warehouses');
        }
    };

    const handleOpenCreate = () => {
        setIsEditMode(false);
        setEditingId(null);
        setFormState({ name: '', sku: '', categoryName: '', unitOfMeasure: 'pcs', minStockAlert: 10, initialStock: 0, warehouseId: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (product) => {
        setIsEditMode(true);
        setEditingId(product._id);
        setFormState({
            name: product.name,
            sku: product.sku,
            categoryName: product.category?.name || '',
            unitOfMeasure: product.unitOfMeasure || 'pcs',
            minStockAlert: product.minStockAlert || 10,
            initialStock: product.initialStock || 0,
            warehouseId: product.locations?.[0]?.warehouse?._id || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            await api.delete(`/products/${id}`);
            await fetchProducts();
        } catch (error) {
            alert('Failed to delete product. It may be linked to existing operations.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // First create or get category
            let categoryId = null;
            if (formState.categoryName) {
                const categoryRes = await api.post('/products/categories', {
                    name: formState.categoryName
                });
                categoryId = categoryRes.data._id;
            }

            const payload = {
                name: formState.name,
                sku: formState.sku,
                unitOfMeasure: formState.unitOfMeasure,
                minStockAlert: formState.minStockAlert,
                initialStock: formState.initialStock || 0
            };

            if (categoryId) payload.category = categoryId;

            // Associate initial stock with specific warehouse if selected
            if (!isEditMode && formState.warehouseId && formState.initialStock > 0) {
                payload.locations = [{ warehouse: formState.warehouseId, quantity: formState.initialStock }];
                payload.initialStock = 0; // Move it entirely to the warehouse location
            }

            if (isEditMode) {
                await api.put(`/products/${editingId}`, payload);
            } else {
                await api.post('/products', payload);
            }

            await fetchProducts();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to save product:', error);
            alert(error.response?.data?.message || 'Failed to save product');
        } finally {
            setIsSubmitting(false);
        }
    };

    const [categoryFilter, setCategoryFilter] = useState('');

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter ? p.category?.name === categoryFilter : true;
        return matchesSearch && matchesCategory;
    });

    const uniqueCategories = [...new Set(products.map(p => p.category?.name).filter(Boolean))];

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm">Products Management</h2>
                    <p className="text-muted-foreground font-medium mt-1">Manage your product catalog, edit details, and configure reordering rules.</p>
                </div>
                <Button onClick={handleOpenCreate} className="shadow-lg shadow-blue-500/20 interactive-scale bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-9 h-11 rounded-xl border-border/50 bg-card shadow-sm"
                        placeholder="Smart Search: Name or SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="w-full sm:w-auto min-w-[200px]">
                    <select
                        className="h-11 w-full rounded-xl border border-border/50 bg-card px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {uniqueCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>SKU</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Total Stock</TableHead>
                            <TableHead>Reorder Alert</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-40 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <PackageOpen className="h-10 w-10 mb-3 text-muted-foreground/50" />
                                        <p className="font-medium">No products found.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts.map(p => {
                                const systemStock = p.initialStock || 0;
                                const locationStock = p.locations?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
                                const totalStock = systemStock + locationStock;
                                const minAlert = p.minStockAlert || 10;
                                const status = totalStock === 0 ? 'Out of Stock' : totalStock <= minAlert ? 'Low Stock' : 'In Stock';
                                const variant = status === 'Out of Stock' ? 'destructive' : status === 'Low Stock' ? 'warning' : 'success';

                                return (
                                    <TableRow key={p._id} className="group hover:bg-muted/30">
                                        <TableCell className="font-medium">{p.sku}</TableCell>
                                        <TableCell className="font-semibold text-primary">{p.name}</TableCell>
                                        <TableCell>{p.category?.name || 'N/A'}</TableCell>
                                        <TableCell className="font-mono">{totalStock} {p.unitOfMeasure}</TableCell>
                                        <TableCell className="text-muted-foreground">&lt; {minAlert}</TableCell>
                                        <TableCell>
                                            <Badge variant={variant} className="shadow-sm">{status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100" onClick={() => handleOpenEdit(p)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p._id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Modal for Product Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-lg p-6 rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto ring-1 ring-border border-0">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground bg-muted p-1 rounded-full interactive-scale"
                        >
                            <X size={20} />
                        </button>
                        <h3 className="text-2xl font-bold mb-6 tracking-tight">
                            {isEditMode ? 'Edit Product' : 'Add New Product'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-semibold">Product Name</Label>
                                    <Input required value={formState.name} onChange={e => setFormState({ ...formState, name: e.target.value })} placeholder="e.g. Steel Rods" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-semibold">SKU / Product Code</Label>
                                    <Input required value={formState.sku} onChange={e => setFormState({ ...formState, sku: e.target.value })} placeholder="e.g. SR-1001" disabled={isEditMode} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-semibold">Category</Label>
                                    <Input required value={formState.categoryName} onChange={e => setFormState({ ...formState, categoryName: e.target.value })} placeholder="e.g. Raw Materials" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-semibold">Unit of Measure</Label>
                                    <Input required value={formState.unitOfMeasure} onChange={e => setFormState({ ...formState, unitOfMeasure: e.target.value })} placeholder="e.g. pcs, kg, liters" />
                                </div>
                            </div>

                            <div className="border border-border/60 rounded-xl p-4 bg-muted/20 space-y-4">
                                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Inventory Rules & Setup</h4>

                                <div className="space-y-2">
                                    <Label className="font-semibold">Min Stock Alert (Reordering Rule)</Label>
                                    <Input type="number" required value={formState.minStockAlert} onChange={e => setFormState({ ...formState, minStockAlert: Number(e.target.value) })} placeholder="Alert threshold (e.g. 10)" />
                                </div>

                                {!isEditMode && (
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-2">
                                            <Label className="font-semibold">Initial Stock</Label>
                                            <Input type="number" min="0" value={formState.initialStock} onChange={e => setFormState({ ...formState, initialStock: Number(e.target.value) })} placeholder="0" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-semibold">Warehouse Location</Label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                value={formState.warehouseId}
                                                onChange={e => setFormState({ ...formState, warehouseId: e.target.value })}
                                            >
                                                <option value="">System Default (Unassigned)</option>
                                                {warehouses.map(w => (
                                                    <option key={w._id} value={w._id}>{w.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end pt-4 space-x-3">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isSubmitting} className="shadow-md shadow-primary/20">
                                    {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Product' : 'Create Product')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
