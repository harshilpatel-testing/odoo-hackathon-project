import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, ArrowDownToLine, X, Search, Trash2, PackagePlus, ScanBarcode } from 'lucide-react';
import { Badge } from '../components/ui/badge';

export default function Receipts() {
    const { user } = useAuth();
    const [receipts, setReceipts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productsList, setProductsList] = useState([]);
    const [warehousesList, setWarehousesList] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const [barcodeInput, setBarcodeInput] = useState('');

    const [supplier, setSupplier] = useState('');
    const [receiptProducts, setReceiptProducts] = useState([
        { product: '', quantity: 1, location: '' }
    ]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [recRes, prodRes, whRes] = await Promise.all([
                api.get('/operations/receipts'),
                api.get('/products'),
                api.get('/warehouses')
            ]);
            setReceipts(recRes.data);
            setProductsList(prodRes.data);
            setWarehousesList(whRes.data);
        } catch (error) {
            console.error('Failed to fetch data');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        // Validation
        if (!supplier) return alert('Please enter a supplier name');
        for (let p of receiptProducts) {
            if (!p.product) return alert('Please select a product for all lines');
            if (p.quantity <= 0) return alert('Quantity must be greater than 0');
            if (!p.location) return alert('Please select a destination warehouse for all lines');
        }

        setIsSubmitting(true);
        try {
            await api.post('/operations/receipts', {
                supplier,
                products: receiptProducts.map(p => ({
                    product: p.product,
                    quantity: Number(p.quantity),
                    location: p.location
                }))
            });
            await fetchData();
            setIsModalOpen(false);
            setSupplier('');
            setReceiptProducts([{ product: '', quantity: 1, location: '' }]);
        } catch (error) {
            console.error(error);
            alert('Failed to validate receipt');
        } finally {
            setIsSubmitting(false);
        }
    };

    const addProductLine = () => {
        setReceiptProducts([...receiptProducts, { product: '', quantity: 1, location: '' }]);
    };

    const handleBarcodeScan = (e) => {
        e.preventDefault();
        if (!barcodeInput.trim()) return;

        const matchedProduct = productsList.find(p => p.sku.toLowerCase() === barcodeInput.trim().toLowerCase());
        if (matchedProduct) {
            let bestLoc = '';
            if (matchedProduct.locations && matchedProduct.locations.length > 0) {
                const bestLocation = matchedProduct.locations
                    .filter(l => l.quantity > 0)
                    .sort((a, b) => b.quantity - a.quantity)[0] || matchedProduct.locations[0];
                if (bestLocation) {
                    bestLoc = typeof bestLocation.warehouse === 'object' ? bestLocation.warehouse._id : bestLocation.warehouse;
                }
            }

            const newLine = { product: matchedProduct._id, quantity: 1, location: bestLoc };

            // If the first row is completely empty, replace it
            if (receiptProducts.length === 1 && !receiptProducts[0].product) {
                setReceiptProducts([newLine]);
            } else {
                setReceiptProducts([...receiptProducts, newLine]);
            }

            setBarcodeInput('');
        } else {
            alert(`Product SKU '${barcodeInput}' not found`);
        }
    };

    const removeProductLine = (index) => {
        const newProducts = receiptProducts.filter((_, i) => i !== index);
        setReceiptProducts(newProducts.length ? newProducts : [{ product: '', quantity: 1, location: '' }]);
    };

    const updateProductLine = (index, field, value) => {
        const newProducts = [...receiptProducts];
        newProducts[index][field] = value;

        // Auto-select the optimal destination warehouse when a product is chosen
        if (field === 'product') {
            const selectedProduct = productsList.find(p => p._id === value);
            if (selectedProduct && selectedProduct.locations && selectedProduct.locations.length > 0) {
                const bestLocation = selectedProduct.locations
                    .filter(l => l.quantity > 0)
                    .sort((a, b) => b.quantity - a.quantity)[0] || selectedProduct.locations[0];

                if (bestLocation) {
                    const warehouseId = typeof bestLocation.warehouse === 'object' ? bestLocation.warehouse._id : bestLocation.warehouse;
                    newProducts[index]['location'] = warehouseId;
                }
            } else {
                newProducts[index]['location'] = '';
            }
        }

        setReceiptProducts(newProducts);
    };

    const filteredReceipts = receipts.filter(r =>
        r.referenceId.toLowerCase().includes(search.toLowerCase()) ||
        r.supplier.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm">
                        Incoming Receipts
                    </h2>
                    <p className="text-muted-foreground font-medium mt-1">Manage stock arriving from vendors. Validation automatically updates your inventory.</p>
                </div>
                {user?.role === 'Inventory Manager' && (
                    <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-blue-500/20 interactive-scale bg-blue-600 hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" /> Create Receipt
                    </Button>
                )}
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-9 h-10 rounded-xl"
                        placeholder="Search by reference or supplier..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="border rounded-xl bg-card shadow-sm overflow-hidden ring-1 ring-border/50">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Reference ID</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Items Received</TableHead>
                            <TableHead>Total Units</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredReceipts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-40 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <ArrowDownToLine className="h-10 w-10 mb-3 text-muted-foreground/50" />
                                        <p className="font-medium">No incoming receipts found.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredReceipts.map(r => {
                                const totalUnits = r.products?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
                                const uniqueItems = r.products?.length || 0;
                                return (
                                    <TableRow key={r._id} className="group hover:bg-muted/30">
                                        <TableCell className="font-semibold text-blue-600">{r.referenceId}</TableCell>
                                        <TableCell className="font-medium">{r.supplier}</TableCell>
                                        <TableCell>{uniqueItems} product(s)</TableCell>
                                        <TableCell className="font-mono text-green-600 font-semibold text-base">+{totalUnits}</TableCell>
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

            {/* Create Receipt Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-3xl p-0 rounded-2xl shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-border border-0">
                        <div className="bg-blue-600/10 border-b border-border/50 p-6 flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-bl-full -z-10 blur-2xl" />
                            <div>
                                <h3 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                    <ArrowDownToLine className="text-blue-600" /> New Receipt
                                </h3>
                                <p className="text-muted-foreground text-sm mt-1">Receive stock from vendors</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-muted-foreground hover:text-foreground bg-background/50 hover:bg-background p-2 rounded-full interactive-scale shadow-sm backdrop-blur-md"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <form id="receipt-form" onSubmit={handleCreate} className="space-y-6">
                                <div className="space-y-2 max-w-sm">
                                    <Label className="font-semibold text-foreground/80">Supplier Name</Label>
                                    <Input required value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="e.g. Acme Corp" className="h-11 rounded-xl" />
                                </div>

                                <div className="space-y-4">
                                    {/* Barcode Scanner Section */}
                                    <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/20 flex flex-col sm:flex-row gap-3 items-center">
                                        <div className="flex bg-blue-500/10 p-2 rounded-lg text-blue-600 shrink-0">
                                            <ScanBarcode className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 w-full flex flex-col md:flex-row md:items-center gap-2">
                                            <p className="text-sm font-semibold text-blue-800 whitespace-nowrap">Quick Scan (Barcode/QR):</p>
                                            <div className="flex gap-2 w-full">
                                                <Input
                                                    value={barcodeInput}
                                                    onChange={e => setBarcodeInput(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleBarcodeScan(e);
                                                        }
                                                    }}
                                                    placeholder="Scan or type SKU here..."
                                                    className="bg-background border-blue-500/30 focus-visible:ring-blue-500 h-10"
                                                />
                                                <Button type="button" onClick={handleBarcodeScan} variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">Add</Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Label className="font-semibold text-foreground/80 text-lg">Products to Receive</Label>
                                        <Button type="button" variant="outline" size="sm" onClick={addProductLine} className="rounded-xl border-dashed border-2 hover:border-blue-500 hover:text-blue-600 transition-colors">
                                            <PackagePlus className="h-4 w-4 mr-2" /> Add Line
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {receiptProducts.map((line, index) => (
                                            <div key={index} className="flex flex-col sm:flex-row gap-3 items-end bg-muted/20 p-4 rounded-xl border border-border/50 group">
                                                <div className="space-y-2 flex-1 w-full">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Product</Label>
                                                    <select required className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none" value={line.product} onChange={e => updateProductLine(index, 'product', e.target.value)}>
                                                        <option value="" disabled>Select Product...</option>
                                                        {productsList.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-2 w-full sm:w-28">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Quantity</Label>
                                                    <Input type="number" min="1" required value={line.quantity} onChange={e => updateProductLine(index, 'quantity', e.target.value)} className="h-10 text-center font-mono font-medium" />
                                                </div>
                                                <div className="space-y-2 flex-1 w-full">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Destination</Label>
                                                    <select required className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none" value={line.location} onChange={e => updateProductLine(index, 'location', e.target.value)}>
                                                        <option value="" disabled>Select Warehouse...</option>
                                                        {warehousesList.map(w => {
                                                            let stockStr = '';
                                                            if (line.product) {
                                                                const prod = productsList.find(p => p._id === line.product);
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
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeProductLine(index)} className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg">
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="bg-muted/10 border-t border-border/50 p-6 flex justify-between items-center py-4">
                            <div className="text-sm text-muted-foreground font-medium">
                                Total items: <span className="text-foreground font-bold">{receiptProducts.length}</span>
                            </div>
                            <div className="flex space-x-3">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl px-6">Cancel</Button>
                                <Button type="submit" form="receipt-form" disabled={isSubmitting} className="rounded-xl px-8 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 text-white font-semibold">
                                    {isSubmitting ? 'Validating...' : 'Validate & Receive Stock'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
