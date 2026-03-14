import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Trash2, ShieldAlert, UserCog } from 'lucide-react';
import { Badge } from '../components/ui/badge';

export default function UsersManagement() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm("Are you sure you want to permanently delete this user?")) return;

        try {
            await api.delete(`/users/${userId}`);
            alert('User profile removed.');
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete user.');
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div>
                <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">
                    System Users
                </h2>
                <p className="text-muted-foreground mt-1">Manage platform access. Revoke permissions or remove accounts.</p>
            </div>

            <div className="border rounded-2xl bg-card shadow-sm overflow-hidden ring-1 ring-border/50">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Full Name</TableHead>
                            <TableHead>Email Address</TableHead>
                            <TableHead>System Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Loading identity matrix...</TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                                    <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    No users discovered
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((u) => (
                                <TableRow key={u._id} className="group hover:bg-muted/30">
                                    <TableCell>
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 border flex items-center justify-center font-bold text-xs text-muted-foreground">
                                            {u.name?.charAt(0) || '?'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold text-foreground">{u.name}</TableCell>
                                    <TableCell className="font-mono text-xs">{u.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={u.role === 'Inventory Manager' ? 'default' : 'secondary'} className={u.role === 'Inventory Manager' ? 'bg-indigo-600' : ''}>
                                            <UserCog className="w-3 h-3 mr-1" />
                                            {u.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(u._id)}
                                            disabled={u.email === 'admin@coreinventory.com'}
                                            className="text-muted-foreground hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-4 h-4 mr-1.5" /> Remove Access
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
