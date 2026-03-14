import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { PackageSearch, Download } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import * as XLSX from 'xlsx';

export default function StockAvailability() {
    const [products, setProducts] = useState([]);
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    useEffect(() => {
        api.get('/products').then(res => setProducts(res.data)).catch(console.error);
    }, []);

    const filteredProducts = query
        ? products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase()))
        : products;

    const handleExportExcel = () => {
        const exportData = [];

        filteredProducts.forEach(p => {
            let hasStock = false;

            if (p.initialStock > 0) {
                exportData.push({
                    Product: p.name,
                    SKU: p.sku,
                    Location: 'System Base Source',
                    'Quantity Available': p.initialStock
                });
                hasStock = true;
            }

            p.locations?.forEach(loc => {
                if (loc.quantity !== 0) {
                    let locationName = loc.warehouse?.name || 'Unknown Warehouse';
                    if (loc.warehouse && typeof loc.warehouse === 'string') locationName = "Warehouse (ID Object)";

                    exportData.push({
                        Product: p.name,
                        SKU: p.sku,
                        Location: locationName,
                        'Quantity Available': loc.quantity
                    });
                    hasStock = true;
                }
            });

            if (!hasStock) {
                exportData.push({
                    Product: p.name,
                    SKU: p.sku,
                    Location: 'No Location Assigned',
                    'Quantity Available': 0
                });
            }
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Availability");
        XLSX.writeFile(workbook, `CoreInventory_Stock_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Stock Availability</h2>
                    <p className="text-muted-foreground">View stock availability specifically broken down by location and base system entries.</p>
                </div>
                <Button onClick={handleExportExcel} className="shrink-0 flex items-center bg-green-700 hover:bg-green-800 text-white">
                    <Download className="mr-2 h-4 w-4" /> Export to Excel
                </Button>
            </div>
            <div className="border rounded-md bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Quantity Available</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <PackageSearch className="h-8 w-8 mb-2" />
                                        {query ? `No products found matching "${query}"` : 'No products found.'}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts.flatMap(p => {
                                const rows = [];

                                // Map initial/system stock if available
                                if (p.initialStock > 0) {
                                    rows.push(
                                        <TableRow key={`${p._id}-initial`}>
                                            <TableCell className="font-medium text-primary">{p.name}</TableCell>
                                            <TableCell>{p.sku}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">System Base Source</Badge>
                                            </TableCell>
                                            <TableCell className="font-bold">{p.initialStock}</TableCell>
                                        </TableRow>
                                    );
                                }

                                // Map location-specific stock
                                p.locations?.forEach(loc => {
                                    if (loc.quantity !== 0) {
                                        let locationName = loc.warehouse?.name;
                                        if (loc.warehouse && typeof loc.warehouse === 'string') {
                                            locationName = "Warehouse (ID Object)";
                                        }

                                        rows.push(
                                            <TableRow key={`${p._id}-${loc._id || loc.warehouse?._id || Math.random()}`}>
                                                <TableCell className="font-medium text-primary">{p.name}</TableCell>
                                                <TableCell>{p.sku}</TableCell>
                                                <TableCell>{locationName || 'Unknown Warehouse'}</TableCell>
                                                <TableCell className="font-bold">{loc.quantity}</TableCell>
                                            </TableRow>
                                        );
                                    }
                                });

                                // Fallback if absolutely 0 stock everywhere
                                if (rows.length === 0) {
                                    rows.push(
                                        <TableRow key={`${p._id}-none`}>
                                            <TableCell className="font-medium">{p.name}</TableCell>
                                            <TableCell>{p.sku}</TableCell>
                                            <TableCell className="text-muted-foreground italic">No Location Assigned</TableCell>
                                            <TableCell className="text-destructive font-bold">0</TableCell>
                                        </TableRow>
                                    )
                                }

                                return rows;
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
