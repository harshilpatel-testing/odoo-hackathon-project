import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { AlertCircle } from 'lucide-react';
import { Badge } from '../components/ui/badge';

export default function ReorderingRules() {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        api.get('/products').then(res => setProducts(res.data)).catch(console.error);
    }, []);

    const getTotalStock = (p) => p.locations?.reduce((sum, l) => sum + (l.quantity || 0), 0) || 0;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Reordering Rules</h2>
                <p className="text-muted-foreground">Track products that are falling below their minimum stock alert levels.</p>
            </div>
            <div className="border rounded-md bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Total Stock</TableHead>
                            <TableHead>Min Alert Quantity</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <AlertCircle className="h-8 w-8 mb-2" />
                                        No products found.
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map(p => {
                                const total = getTotalStock(p);
                                const isLow = total <= (p.minStockAlert || 0);
                                return (
                                    <TableRow key={p._id}>
                                        <TableCell className="font-medium">{p.name}</TableCell>
                                        <TableCell>{p.sku}</TableCell>
                                        <TableCell className="font-bold">{total}</TableCell>
                                        <TableCell>{p.minStockAlert || 0}</TableCell>
                                        <TableCell>
                                            {isLow ? <Badge variant="destructive">Reorder Needed</Badge> : <Badge variant="success" className="bg-green-600">Sufficient</Badge>}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
