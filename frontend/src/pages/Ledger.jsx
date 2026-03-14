import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { History, FilterX, Download } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import * as XLSX from 'xlsx';

export default function Ledger() {
    const [ledger, setLedger] = useState([]);

    // Filters state
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterWarehouse, setFilterWarehouse] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    useEffect(() => {
        fetchLedger();
    }, []);

    const fetchLedger = async () => {
        try {
            const res = await api.get('/operations/ledger');
            setLedger(res.data);
        } catch (error) {
            console.error('Failed to fetch ledger');
        }
    };

    // Extract unique options from the current robust ledger data for the dropdowns
    const uniqueTypes = [...new Set(ledger.map(item => item.operationType))].filter(Boolean);
    const uniqueStatuses = [...new Set(ledger.map(item => item.status))].filter(Boolean);

    // Aggregate all warehouses mentioned in source or destination
    const allWarehouses = [];
    ledger.forEach(item => {
        if (item.sourceLocation) allWarehouses.push(item.sourceLocation.name);
        if (item.destinationLocation) allWarehouses.push(item.destinationLocation.name);
    });
    const uniqueWarehouses = [...new Set(allWarehouses)].filter(Boolean);

    const uniqueCategories = [...new Set(ledger.map(item => item.product?.category?.name))].filter(Boolean);

    // Apply filtering
    const filteredLedger = ledger.filter(item => {
        const matchesType = filterType ? item.operationType === filterType : true;
        const matchesStatus = filterStatus ? item.status === filterStatus : true;

        let matchesWarehouse = true;
        if (filterWarehouse) {
            const src = item.sourceLocation?.name === filterWarehouse;
            const dst = item.destinationLocation?.name === filterWarehouse;
            matchesWarehouse = src || dst;
        }

        const matchesCategory = filterCategory ? item.product?.category?.name === filterCategory : true;

        return matchesType && matchesStatus && matchesWarehouse && matchesCategory;
    });

    const clearFilters = () => {
        setFilterType('');
        setFilterStatus('');
        setFilterWarehouse('');
        setFilterCategory('');
    };

    const handleExportExcel = () => {
        const exportData = filteredLedger.map(r => ({
            Date: new Date(r.date).toLocaleString(),
            Operation: r.operationType,
            Reference: r.referenceDocument,
            Product: r.product?.name || 'N/A',
            SKU: r.product?.sku || 'N/A',
            Category: r.product?.category?.name || 'N/A',
            Source: r.sourceLocation?.name || '-',
            Destination: r.destinationLocation?.name || '-',
            Quantity: r.quantity,
            Status: r.status,
            User: r.user?.name || 'Unknown'
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Ledger");
        XLSX.writeFile(workbook, `CoreInventory_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Stock Ledger (Move History)</h2>
                    <p className="text-muted-foreground">Comprehensive history of all stock movements with dynamic tracking.</p>
                </div>
                <Button onClick={handleExportExcel} className="shrink-0 flex items-center bg-green-700 hover:bg-green-800 text-white">
                    <Download className="mr-2 h-4 w-4" /> Export to Excel
                </Button>
            </div>

            {/* Filters Area */}
            <div className="flex flex-col md:flex-row gap-4 p-4 border rounded-md bg-card">
                <div className="flex-1 space-y-1">
                    <label className="text-sm font-medium">Document Type</label>
                    <select
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={filterType} onChange={e => setFilterType(e.target.value)}
                    >
                        <option value="">All Types</option>
                        {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <div className="flex-1 space-y-1">
                    <label className="text-sm font-medium">Status</label>
                    <select
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div className="flex-1 space-y-1">
                    <label className="text-sm font-medium">Location / Warehouse</label>
                    <select
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={filterWarehouse} onChange={e => setFilterWarehouse(e.target.value)}
                    >
                        <option value="">All Locations</option>
                        {uniqueWarehouses.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                </div>

                <div className="flex-1 space-y-1">
                    <label className="text-sm font-medium">Category</label>
                    <select
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="flex items-end">
                    <Button variant="outline" className="h-10" onClick={clearFilters}>
                        <FilterX className="mr-2 h-4 w-4" /> Clear
                    </Button>
                </div>
            </div>

            <div className="border rounded-md bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Operation</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>User</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLedger.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <History className="h-8 w-8 mb-2" />
                                        No movements match the active filters.
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLedger.map(r => (
                                <TableRow key={r._id}>
                                    <TableCell>{new Date(r.date).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{r.operationType}</Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{r.referenceDocument}</TableCell>
                                    <TableCell>{r.product?.name} <span className="text-xs text-muted-foreground">({r.product?.sku})</span></TableCell>
                                    <TableCell>{r.product?.category?.name || 'N/A'}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {r.sourceLocation ? <span className="text-destructive">Out: {r.sourceLocation.name}</span> : null}
                                        {r.sourceLocation && r.destinationLocation ? <br /> : null}
                                        {r.destinationLocation ? <span className="text-green-600">In: {r.destinationLocation.name}</span> : null}
                                        {!r.sourceLocation && !r.destinationLocation ? '-' : ''}
                                    </TableCell>
                                    <TableCell className={r.quantity > 0 ? "text-green-600 font-medium" : "text-destructive font-medium"}>
                                        {r.quantity > 0 ? `+${r.quantity}` : r.quantity}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={r.status === 'Done' ? 'success' : 'secondary'}>{r.status}</Badge>
                                    </TableCell>
                                    <TableCell>{r.user?.name}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
