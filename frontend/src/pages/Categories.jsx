import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tags } from 'lucide-react';

export default function Categories() {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        api.get('/categories').then(res => setCategories(res.data)).catch(console.error);
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Product Categories</h2>
                <p className="text-muted-foreground">Manage product classifications.</p>
            </div>
            <div className="border rounded-md bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Category Name</TableHead>
                            <TableHead>Description</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <Tags className="h-8 w-8 mb-2" />
                                        No categories found.
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            categories.map(c => (
                                <TableRow key={c._id}>
                                    <TableCell className="font-medium text-primary">{c.name}</TableCell>
                                    <TableCell>{c.description || 'N/A'}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
