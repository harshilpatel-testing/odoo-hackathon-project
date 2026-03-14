import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { MapPin, Plus, Trash2, Edit, X, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function Warehouses() {
    const [warehouses, setWarehouses] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [search, setSearch] = useState('');

    // For editing
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        address: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/warehouses');
            setWarehouses(res.data);
        } catch (error) {
            console.error('Failed to fetch warehouses');
        }
    };

    const handleOpenCreate = () => {
        setEditingId(null);
        setFormData({ name: '', address: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (w) => {
        setEditingId(w._id);
        setFormData({ name: w.name, address: w.address || '' });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingId) {
                await api.put(`/warehouses/${editingId}`, formData);
            } else {
                await api.post('/warehouses', formData);
            }
            await fetchData();
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            alert(editingId ? 'Failed to update warehouse' : 'Failed to create warehouse');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this warehouse? This might break existing product stock records.')) return;
        try {
            await api.delete(`/warehouses/${id}`);
            await fetchData();
        } catch (error) {
            console.error(error);
            alert('Failed to delete warehouse');
        }
    };

    const filteredWarehouses = warehouses.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        (w.address && w.address.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm">
                        Warehouses
                    </h2>
                    <p className="text-muted-foreground font-medium mt-1">Manage all physical locations and storage facilities.</p>
                </div>
                <Button onClick={handleOpenCreate} className="shadow-lg shadow-purple-500/20 interactive-scale bg-purple-600 hover:bg-purple-700">
                    <Plus className="mr-2 h-4 w-4" /> Add Warehouse
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-9 h-10 rounded-xl"
                        placeholder="Search by name or address..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="border rounded-xl bg-card shadow-sm overflow-hidden ring-1 ring-border/50">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Warehouse Name</TableHead>
                            <TableHead>Location Details</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredWarehouses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-40 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <MapPin className="h-10 w-10 mb-3 text-muted-foreground/50" />
                                        <p className="font-medium">No warehouses found.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredWarehouses.map(w => (
                                <TableRow key={w._id} className="group hover:bg-muted/30">
                                    <TableCell className="font-semibold text-purple-700 flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-purple-500" />
                                        {w.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{w.address || 'No address provided'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleOpenEdit(w)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(w._id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-md p-0 rounded-2xl shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-border border-0">
                        <div className="bg-purple-600/10 border-b border-border/50 p-6 flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-bl-full -z-10 blur-2xl" />
                            <div>
                                <h3 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                    <MapPin className="text-purple-600" /> {editingId ? 'Edit Warehouse' : 'New Warehouse'}
                                </h3>
                                <p className="text-muted-foreground text-sm mt-1">{editingId ? 'Modify warehouse details' : 'Add a new location to your network'}</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-muted-foreground hover:text-foreground bg-background/50 hover:bg-background p-2 rounded-full interactive-scale shadow-sm backdrop-blur-md"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <form id="warehouse-form" onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="font-semibold text-foreground/80">Warehouse Name</Label>
                                    <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Main Hub" className="h-11 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-semibold text-foreground/80">Address (Optional)</Label>
                                    <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="e.g. 123 Storage Lane" className="h-11 rounded-xl" />
                                </div>
                            </form>
                        </div>

                        <div className="bg-muted/10 border-t border-border/50 p-6 flex justify-end space-x-3 py-4">
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl px-6">Cancel</Button>
                            <Button type="submit" form="warehouse-form" disabled={isSubmitting} className="rounded-xl px-8 bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20 text-white font-semibold">
                                {isSubmitting ? 'Saving...' : (editingId ? 'Update Warehouse' : 'Create Warehouse')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
