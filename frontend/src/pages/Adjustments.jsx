import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Settings, X, Info, Search } from 'lucide-react';
import { Badge } from '../components/ui/badge';

export default function Adjustments() {
    const [adjustments, setAdjustments] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productsList, setProductsList] = useState([]);
    const [warehousesList, setWarehousesList] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [search, setSearch] = useState('');

    const [formData, setFormData] = useState({
        warehouse: '',
        reason: '',
        product: '',
        recordedQuantity: 0,
        countedQuantity: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [adjRes, prodRes, whRes] = await Promise.all([
                api.get('/operations/adjustments'),
                api.get('/products'),
                api.get('/warehouses')
            ]);
            setAdjustments(adjRes.data);
            setProductsList(prodRes.data);
            setWarehousesList(whRes.data);
        } catch (error) {
            console.error('Failed to fetch data');
        }
    };

    // Auto calculate expected quantity when product or warehouse changes
    useEffect(() => {
        if (formData.product && formData.warehouse) {
            const selectedProduct = productsList.find(p => p._id === formData.product);
            if (selectedProduct) {
                const loc = selectedProduct.locations?.find(l => {
                    const wId = typeof l.warehouse === 'object' ? l.warehouse._id : l.warehouse;
                    return wId === formData.warehouse;
                });
                const expected = loc ? loc.quantity : 0;
                setFormData(prev => ({ ...prev, recordedQuantity: expected }));
            }
        }
    }, [formData.product, formData.warehouse, productsList]);

    const handleCreate = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const recQty = Number(formData.recordedQuantity);
            const countQty = Number(formData.countedQuantity);

            await api.post('/operations/adjustments', {
                warehouse: formData.warehouse,
                reason: formData.reason,
                products: [{
                    product: formData.product,
                    recordedQuantity: recQty,
                    countedQuantity: countQty,
                    difference: countQty - recQty
                }]
            });
            await fetchData();
            setIsModalOpen(false);
            setFormData({ warehouse: '', reason: '', product: '', recordedQuantity: 0, countedQuantity: 0 });
        } catch (error) {
            console.error(error);
            alert('Failed to create adjustment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredAdjustments = adjustments.filter(r =>
        r.referenceId.toLowerCase().includes(search.toLowerCase()) ||
        r.reason.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent drop-shadow-sm">
                        Stock Adjustments
                    </h2>
                    <p className="text-muted-foreground font-medium mt-1">Fix differences between system inventory and physical counted stock.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-teal-500/20 interactive-scale bg-teal-600 hover:bg-teal-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> New Adjustment
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-9 h-10 rounded-xl"
                        placeholder="Search by reference or reason..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="border rounded-xl bg-card shadow-sm overflow-hidden ring-1 ring-border/50">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Reference</TableHead>
                            <TableHead>Warehouse</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Net Difference</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAdjustments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-40 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <Settings className="h-10 w-10 mb-3 text-muted-foreground/50" />
                                        <p className="font-medium">No stock adjustments found.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAdjustments.map(r => {
                                const totalDiff = r.products?.reduce((acc, curr) => acc + curr.difference, 0) || 0;
                                const isPositive = totalDiff > 0;
                                const isNegative = totalDiff < 0;

                                return (
                                    <TableRow key={r._id} className="group hover:bg-muted/30">
                                        <TableCell className="font-semibold text-teal-700">{r.referenceId}</TableCell>
                                        <TableCell className="font-medium">{r.warehouse?.name}</TableCell>
                                        <TableCell>{r.reason}</TableCell>
                                        <TableCell className={`font-mono font-bold text-base ${isPositive ? 'text-green-600' : isNegative ? 'text-destructive' : 'text-foreground'}`}>
                                            {isPositive ? `+${totalDiff}` : totalDiff}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{new Date(r.date).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={r.status === 'Done' ? 'success' : 'secondary'} className="shadow-sm">{r.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-xl p-0 rounded-2xl shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-border border-0">
                        <div className="bg-teal-600/10 border-b border-border/50 p-6 flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 rounded-bl-full -z-10 blur-2xl" />
                            <div>
                                <h3 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                    <Settings className="text-teal-600 w-6 h-6" /> Physical Inventory Count
                                </h3>
                                <p className="text-muted-foreground text-sm mt-1">Realign system stock manually</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground bg-background/50 hover:bg-background p-2 rounded-full interactive-scale shadow-sm backdrop-blur-md">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <form id="adj-form" onSubmit={handleCreate} className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="font-semibold text-foreground/80">Reason for adjustment</Label>
                                    <Input required value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} placeholder="e.g. Stock count discrepancy, damaged items..." className="h-11 rounded-xl" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="font-semibold text-foreground/80">Warehouse Location</Label>
                                        <select required className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:outline-none" value={formData.warehouse} onChange={e => setFormData({ ...formData, warehouse: e.target.value })}>
                                            <option value="" disabled>Select Warehouse</option>
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
                                        <Label className="font-semibold text-foreground/80">Product To Adjust</Label>
                                        <select required className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:outline-none" value={formData.product} onChange={e => {
                                            const val = e.target.value;
                                            let wh = formData.warehouse;
                                            const selectedProduct = productsList.find(p => p._id === val);
                                            if (selectedProduct && selectedProduct.locations && selectedProduct.locations.length > 0) {
                                                const bestLocation = selectedProduct.locations
                                                    .filter(l => l.quantity > 0)
                                                    .sort((a, b) => b.quantity - a.quantity)[0] || selectedProduct.locations[0];
                                                if (bestLocation) {
                                                    wh = typeof bestLocation.warehouse === 'object' ? bestLocation.warehouse._id : bestLocation.warehouse;
                                                }
                                            }
                                            setFormData({ ...formData, product: val, warehouse: wh });
                                        }}>
                                            <option value="" disabled>Select Product</option>
                                            {productsList.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-2">
                                        <Label className="font-semibold text-foreground/80 text-muted-foreground">System Expected Qty</Label>
                                        <Input type="number" readOnly value={formData.recordedQuantity} className="h-11 rounded-xl bg-muted/50 font-mono text-center font-bold text-lg" tabIndex={-1} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-semibold text-foreground/80">Actual Counted Qty</Label>
                                        <Input type="number" required value={formData.countedQuantity} onChange={e => setFormData({ ...formData, countedQuantity: e.target.value })} className="h-11 rounded-xl font-mono text-center font-bold text-lg border-teal-500 ring-1 ring-teal-500/20 focus-visible:ring-teal-500" autoFocus={!!(formData.product && formData.warehouse)} />
                                    </div>
                                </div>

                                <div className="bg-muted/30 p-4 rounded-xl text-sm border border-border/50 flex items-start gap-3 mt-4">
                                    <Info className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                                    <div className="leading-relaxed">
                                        Difference will be computed directly. System will log an adjustment of <strong className={`font-mono text-base ${Number(formData.countedQuantity) - Number(formData.recordedQuantity) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                                            {Number(formData.countedQuantity) - Number(formData.recordedQuantity) > 0 ? '+' : ''}{Number(formData.countedQuantity) - Number(formData.recordedQuantity)}
                                        </strong> automatically to fix the disparity.
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="bg-muted/10 border-t border-border/50 p-6 flex justify-end space-x-3 py-4">
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl px-6">Cancel</Button>
                            <Button type="submit" form="adj-form" disabled={isSubmitting} className="rounded-xl px-8 bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20 text-white font-semibold flex items-center gap-2">
                                <Settings className="w-4 h-4" /> {isSubmitting ? 'Recording...' : 'Record Adjustment'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
