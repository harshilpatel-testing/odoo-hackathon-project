import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, BellRing } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import { Badge } from '../components/ui/badge';
import api from '../lib/api';
import { BrainCircuit, ScanBarcode } from 'lucide-react'; // For AI and Barcode features

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalProducts: 0,
        lowStock: 0,
        pendingReceipts: 0,
        pendingDeliveries: 0,
        transfers: 0
    });
    const [chartData, setChartData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [warehouseStock, setWarehouseStock] = useState([]);
    const [aiReorderList, setAiReorderList] = useState([]);
    const [lowStockList, setLowStockList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [productsRes, receiptsRes, deliveriesRes, transfersRes, ledgerRes, whRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/operations/receipts'),
                    api.get('/operations/deliveries'),
                    api.get('/operations/transfers'),
                    api.get('/operations/ledger'),
                    api.get('/warehouses')
                ]);

                const products = productsRes.data;
                const ledger = ledgerRes.data;
                const warehouses = whRes.data;
                const lowStockItems = [];

                let lowStockcount = 0;
                products.forEach(p => {
                    const totalStock = p.locations.reduce((acc, curr) => acc + curr.quantity, 0);
                    const minAlert = p.minStockAlert || 10;
                    if (totalStock <= minAlert) {
                        lowStockcount++;
                        lowStockItems.push({
                            id: p._id,
                            name: p.name,
                            sku: p.sku,
                            stock: totalStock,
                            minStock: minAlert
                        });
                    }
                });

                setStats({
                    totalProducts: products.length,
                    lowStock: lowStockcount,
                    pendingReceipts: receiptsRes.data.filter(r => r.status !== 'Done' && r.status !== 'Canceled').length,
                    pendingDeliveries: deliveriesRes.data.filter(d => d.status !== 'Done' && d.status !== 'Canceled').length,
                    transfers: transfersRes.data.filter(t => t.status !== 'Done' && t.status !== 'Canceled').length,
                });

                setLowStockList(lowStockItems.slice(0, 10)); // keep top 10

                // Mock chart data based on product categories
                const catMap = {};
                products.forEach(p => {
                    const cName = p.category?.name || 'Uncategorized';
                    const stock = p.locations.reduce((acc, curr) => acc + curr.quantity, 0);
                    catMap[cName] = (catMap[cName] || 0) + stock;
                });

                const cData = Object.keys(catMap).map(k => ({
                    name: k,
                    stock: catMap[k]
                }));
                setChartData(cData.length > 0 ? cData : [{ name: 'Electronics', stock: 120 }, { name: 'Furniture', stock: 50 }]);

                // 1. Warehouse Stock Comparison
                const whData = warehouses.map(wh => {
                    let total = 0;
                    products.forEach(p => {
                        const loc = p.locations.find(l => {
                            const wId = typeof l.warehouse === 'object' ? l.warehouse._id : l.warehouse;
                            return wId === wh._id;
                        });
                        if (loc) total += loc.quantity;
                    });
                    return { name: wh.name, stock: total };
                }).filter(w => w.stock > 0);
                setWarehouseStock(whData);

                // 2. Monthly Stock Movement
                // Group ledger entries by month for the last 6 months
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const movementMap = {};
                ledger.forEach(entry => {
                    const date = new Date(entry.date);
                    const monthName = `${months[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
                    if (!movementMap[monthName]) movementMap[monthName] = { month: monthName, inflow: 0, outflow: 0, sortKey: date.getTime() };
                    if (entry.quantity > 0) movementMap[monthName].inflow += entry.quantity;
                    else movementMap[monthName].outflow += Math.abs(entry.quantity);
                });

                let sortedMovement = Object.values(movementMap).sort((a, b) => a.sortKey - b.sortKey);
                // take last 6
                sortedMovement = sortedMovement.slice(-6);
                setMonthlyData(sortedMovement);

                // 3. AI Smart Reordering (Predict based on last 30 days usage)
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                const aiSuggestions = [];
                products.forEach(p => {
                    const recentOut = ledger.filter(l => {
                        const pId = typeof l.product === 'object' ? l.product._id : l.product;
                        return pId === p._id && l.quantity < 0 && new Date(l.date) >= thirtyDaysAgo;
                    }).reduce((acc, l) => acc + Math.abs(l.quantity), 0);

                    const dailyAvg = recentOut / 30;
                    const leadTimeDays = 14; // assume 14 days lead time
                    const projectedNeed = dailyAvg * leadTimeDays;
                    const currentStock = p.locations.reduce((acc, curr) => acc + curr.quantity, 0);

                    // Suggest reorder if stock will run out in lead time, or avg usage is very high
                    if (dailyAvg > 0.5 && currentStock <= projectedNeed * 1.5) {
                        aiSuggestions.push({
                            id: p._id,
                            name: p.name,
                            sku: p.sku,
                            stock: currentStock,
                            dailyAvg: dailyAvg.toFixed(1),
                            suggestedReorder: Math.ceil(projectedNeed * 2) // Recommended order size
                        });
                    }
                });
                setAiReorderList(aiSuggestions.sort((a, b) => b.dailyAvg - a.dailyAvg).slice(0, 8)); // Top 8 urgent

                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard data', error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return <div className="text-center mt-20 text-muted-foreground animate-pulse font-medium">Loading Dashboard Data...</div>;

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent drop-shadow-sm">
                    Operating Dashboard
                </h2>
                <p className="text-muted-foreground font-medium mt-1 text-sm md:text-base">Real-time overview of your warehouse operations and inventory health.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                <Card className="glass card-hover relative overflow-hidden border-0 ring-1 ring-border/50">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -z-10 blur-2xl" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Products</CardTitle>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center p-1.5 object-center content-center flex">
                            <Package className="h-5 w-5 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold text-foreground">{stats.totalProducts}</div>
                    </CardContent>
                </Card>

                <Card className="glass card-hover relative overflow-hidden border-0 ring-1 ring-border/50">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-destructive/10 rounded-bl-full -z-10 blur-2xl" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Low Stock Items</CardTitle>
                        <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center p-1.5 flex">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold text-destructive flex items-center gap-2">
                            {stats.lowStock}
                            {stats.lowStock > 0 && <span className="flex h-2 w-2 rounded-full bg-destructive animate-ping" />}
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass card-hover relative overflow-hidden border-0 ring-1 ring-border/50">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -z-10 blur-2xl" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pending Receipts</CardTitle>
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center p-1.5 flex">
                            <ArrowDownToLine className="h-5 w-5 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold text-blue-600">{stats.pendingReceipts}</div>
                    </CardContent>
                </Card>

                <Card className="glass card-hover relative overflow-hidden border-0 ring-1 ring-border/50">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-bl-full -z-10 blur-2xl" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pending Deliveries</CardTitle>
                        <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center p-1.5 flex">
                            <ArrowUpFromLine className="h-5 w-5 text-orange-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold text-orange-600">{stats.pendingDeliveries}</div>
                    </CardContent>
                </Card>

                <Card className="glass card-hover relative overflow-hidden border-0 ring-1 ring-border/50">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -z-10 blur-2xl" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Transfers</CardTitle>
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center p-1.5 flex">
                            <ArrowRightLeft className="h-5 w-5 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold text-emerald-600">{stats.transfers}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 glass border-0 ring-1 ring-border/50 shadow-lg shadow-black/5">
                    <CardHeader className="pb-8">
                        <CardTitle className="text-lg font-bold">Category Distribution Volume</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-0 pr-4">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                                <XAxis dataKey="name" stroke="#888888" fontSize={13} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#888888" fontSize={13} tickLine={false} axisLine={false} dx={-10} tickFormatter={(value) => `${value}`} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="stock" fill="currentColor" radius={[6, 6, 0, 0]} className="fill-primary" barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-3 glass border-0 ring-1 ring-destructive/20 shadow-lg shadow-destructive/5 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-destructive/5 rounded-bl-[100px] -z-10 blur-3xl pointer-events-none" />
                    <CardHeader className="border-b border-border/50 bg-destructive/5 flex flex-row items-center gap-3 space-y-0 py-4">
                        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                            <BellRing className="w-5 h-5 text-destructive animate-pulse" />
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-lg font-bold text-destructive">Low Stock Alerts</CardTitle>
                            <CardDescription className="text-xs font-medium text-destructive/70 mt-0.5">Automated threshold notifications</CardDescription>
                        </div>
                        <Badge variant="destructive" className="px-2.5 py-1 text-sm font-bold shadow-sm">{stats.lowStock}</Badge>
                    </CardHeader>
                    <CardContent className="p-0 overflow-y-auto max-h-[350px] flex-1">
                        {lowStockList.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center justify-center text-muted-foreground h-full">
                                <AlertTriangle className="h-10 w-10 mb-3 opacity-20" />
                                <p className="font-semibold text-sm">All clear!</p>
                                <p className="text-xs mt-1">No products are currently below their minimum stock alert threshold.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {lowStockList.map((item, idx) => (
                                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                        <div>
                                            <p className="font-semibold text-sm text-foreground">{item.name}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{item.sku}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground mb-1">Min = {item.minStock}</p>
                                            <div className="inline-flex items-center gap-1.5">
                                                <Badge variant="outline" className="text-xs font-mono border-destructive/30 text-destructive bg-destructive/5">
                                                    Stock = {item.stock}
                                                </Badge>
                                                <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {stats.lowStock > 10 && (
                                    <div className="p-3 text-center bg-muted/20 text-xs font-medium text-muted-foreground">
                                        + {stats.lowStock - 10} more items require attention in Products page
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* AI Smart Reordering & Monthly Analytics */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-1 glass border-0 ring-1 ring-purple-500/20 shadow-lg shadow-purple-500/5 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-bl-[100px] -z-10 blur-3xl pointer-events-none" />
                    <CardHeader className="border-b border-border/50 bg-purple-500/5 flex flex-row items-center gap-3 py-4">
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                            <BrainCircuit className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-lg font-bold text-purple-700">AI Smart Reordering</CardTitle>
                            <CardDescription className="text-xs font-medium text-purple-700/70 mt-0.5">Based on 30-day velocity</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-y-auto max-h-[400px]">
                        {aiReorderList.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center justify-center text-muted-foreground h-full">
                                <BrainCircuit className="h-10 w-10 mb-3 opacity-20" />
                                <p className="font-semibold text-sm">Optimal Stock Levels</p>
                                <p className="text-xs mt-1">No AI predictions require immediate action.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {aiReorderList.map((item) => (
                                    <div key={item.id} className="p-4 flex flex-col gap-2 hover:bg-muted/30 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-sm text-foreground">{item.name}</p>
                                                <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                                            </div>
                                            <Badge variant="outline" className="text-purple-700 bg-purple-500/10 border-purple-500/30 font-bold whitespace-nowrap ml-2">
                                                Order {item.suggestedReorder}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1 bg-background rounded p-2 ring-1 ring-border/50">
                                            <span>Current: <strong>{item.stock}</strong></span>
                                            <span className="flex items-center gap-1">Trend: <ArrowDownToLine className="w-3 h-3 text-red-500" /> {item.dailyAvg}/day</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-2 glass border-0 ring-1 ring-border/50 shadow-lg shadow-black/5">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-bold">Monthly Stock Movement (In vs Out)</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-0 pr-4">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Legend verticalAlign="top" height={36} />
                                <Area type="monotone" dataKey="inflow" name="Total Inflow" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" />
                                <Area type="monotone" dataKey="outflow" name="Total Outflow" stroke="#f43f5e" fillOpacity={1} fill="url(#colorOut)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Warehouse Comparison Chart (Pie or separate) */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                <Card className="col-span-1 glass border-0 ring-1 ring-border/50 shadow-lg shadow-black/5">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Warehouse Stock Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center flex-col items-center">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={warehouseStock}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="stock"
                                >
                                    {warehouseStock.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][index % 5]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
