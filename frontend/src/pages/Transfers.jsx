import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, ArrowRightLeft, X } from 'lucide-react';
import { Badge } from '../components/ui/badge';

export default function Transfers() {
    const { user } = useAuth();
    const [transfers, setTransfers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productsList, setProductsList] = useState([]);
    const [warehousesList, setWarehousesList] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        sourceLocation: '',
        destinationLocation: '',
        product: '',
        quantity: 1
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [trnRes, prodRes, whRes] = await Promise.all([
                api.get('/operations/transfers'),
                api.get('/products'),
                api.get('/warehouses')
            ]);
            setTransfers(trnRes.data);
            setProductsList(prodRes.data);
            setWarehousesList(whRes.data);
        } catch (error) {
            console.error('Failed to fetch data');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        if (formData.sourceLocation === formData.destinationLocation) {
            return alert("Source and Destination cannot be the same warehouse.");
        }

        setIsSubmitting(true);
        try {
            await api.post('/operations/transfers', {
                sourceLocation: formData.sourceLocation,
                destinationLocation: formData.destinationLocation,
                products: [{
                    product: formData.product,
                    quantity: Number(formData.quantity)
                }]
            });
            await fetchData();
            setIsModalOpen(false);
            setFormData({ sourceLocation: '', destinationLocation: '', product: '', quantity: 1 });
        } catch (error) {
            console.error(error);
            alert('Failed to create internal transfer');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Internal Transfers</h2>
                    <p className="text-muted-foreground">Move stock between warehouses or locations.</p>
                </div>
                {user?.role === 'Inventory Manager' && (
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> New Transfer
                    </Button>
                )}
            </div>

            <div className="border rounded-md bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Reference</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Destination</TableHead>
                            <TableHead>Units Transferred</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transfers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <ArrowRightLeft className="h-8 w-8 mb-2" />
                                        No internal transfers found.
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            transfers.map(r => {
                                const totalUnits = r.products?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
                                return (
                                    <TableRow key={r._id}>
                                        <TableCell className="font-medium text-primary">{r.referenceId}</TableCell>
                                        <TableCell>{r.sourceLocation?.name}</TableCell>
                                        <TableCell>{r.destinationLocation?.name}</TableCell>
                                        <TableCell className="font-medium">{totalUnits}</TableCell>
                                        <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={r.status === 'Done' ? 'success' : 'secondary'}>{r.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-card w-full max-w-md p-6 rounded-lg shadow-lg relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                            <X size={20} />
                        </button>
                        <h3 className="text-xl font-bold mb-4">Create Internal Transfer</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Product To Move</Label>
                                <select required className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.product} onChange={e => {
                                    const val = e.target.value;
                                    let sourceLoc = formData.sourceLocation;
                                    const selectedProduct = productsList.find(p => p._id === val);
                                    if (selectedProduct && selectedProduct.locations && selectedProduct.locations.length > 0) {
                                        const bestLocation = selectedProduct.locations
                                            .filter(l => l.quantity > 0)
                                            .sort((a, b) => b.quantity - a.quantity)[0] || selectedProduct.locations[0];
                                        if (bestLocation) {
                                            sourceLoc = typeof bestLocation.warehouse === 'object' ? bestLocation.warehouse._id : bestLocation.warehouse;
                                        }
                                    }
                                    setFormData({ ...formData, product: val, sourceLocation: sourceLoc });
                                }}>
                                    <option value="" disabled>Select Product</option>
                                    {productsList.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Quantity</Label>
                                <Input type="number" min="1" required value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>From Source Location</Label>
                                    <select required className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.sourceLocation} onChange={e => setFormData({ ...formData, sourceLocation: e.target.value })}>
                                        <option value="" disabled>Warehouse</option>
                                        {warehousesList.map(w => {
                                            let stockStr = '';
                                            if (formData.product) {
                                                const prod = productsList.find(p => p._id === formData.product);
                                                if (prod && prod.locations) {
                                                    const loc = prod.locations.find(l => {
                                                        const locWhId = typeof l.warehouse === 'object' ? l.warehouse._id : l.warehouse;
                                                        return locWhId === w._id;
                                                    });
                                                    stockStr = ` (Stock: ${loc ? loc.quantity : 0})`;
                                                }
                                            }
                                            return <option key={w._id} value={w._id}>{w.name}{stockStr}</option>;
                                        })}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>To Destination</Label>
                                    <select required className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.destinationLocation} onChange={e => setFormData({ ...formData, destinationLocation: e.target.value })}>
                                        <option value="" disabled>Warehouse</option>
                                        {warehousesList.map(w => {
                                            let stockStr = '';
                                            if (formData.product) {
                                                const prod = productsList.find(p => p._id === formData.product);
                                                if (prod && prod.locations) {
                                                    const loc = prod.locations.find(l => {
                                                        const locWhId = typeof l.warehouse === 'object' ? l.warehouse._id : l.warehouse;
                                                        return locWhId === w._id;
                                                    });
                                                    stockStr = ` (Stock: ${loc ? loc.quantity : 0})`;
                                                }
                                            }
                                            return <option key={w._id} value={w._id}>{w.name}{stockStr}</option>;
                                        })}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 space-x-2">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Transferring...' : 'Confirm Transfer'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
