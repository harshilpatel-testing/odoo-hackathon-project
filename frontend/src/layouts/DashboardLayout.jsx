import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Package,
    Tags,
    AlertCircle,
    PackageSearch,
    ArrowRightLeft,
    ArrowDownToLine,
    ArrowUpFromLine,
    History,
    Settings as SettingsIcon,
    MapPin,
    LogOut,
    Menu,
    User,
    UserCog,
    Search
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    const isManager = user?.role === 'Inventory Manager';
    const isStaff = user?.role === 'Warehouse Staff';

    const navigationGroups = [
        {
            title: 'Overview',
            items: [
                { name: 'Dashboard', path: '/', icon: LayoutDashboard, show: true },
            ]
        },
        {
            title: 'Products',
            items: [
                { name: 'Products Management', path: '/products', icon: Package, show: isManager },
                { name: 'Stock Availability', path: '/products/stock', icon: PackageSearch, show: true },
                { name: 'Categories', path: '/products/categories', icon: Tags, show: isManager },
                { name: 'Reordering Rules', path: '/products/rules', icon: AlertCircle, show: isManager },
            ]
        },
        {
            title: 'Operations',
            items: [
                { name: 'Receipts', path: '/operations/receipts', icon: ArrowDownToLine, show: true },
                { name: 'Delivery Orders', path: '/operations/deliveries', icon: ArrowUpFromLine, show: true },
                { name: 'Internal Transfers', path: '/operations/transfers', icon: ArrowRightLeft, show: true },
                { name: 'Inventory Adjustment', path: '/operations/adjustments', icon: SettingsIcon, show: true },
                { name: 'Move History', path: '/operations/history', icon: History, show: true },
            ]
        },
        {
            title: 'Setting',
            items: [
                { name: 'Warehouses', path: '/settings/warehouses', icon: MapPin, show: isManager },
                { name: 'Users Management', path: '/settings/users', icon: UserCog, show: isManager },
            ]
        }
    ];

    return (
        <div className="min-h-screen flex bg-background/50">
            {/* Sidebar */}
            <aside className={cn(
                "glass border-r transition-all duration-300 ease-in-out flex flex-col hidden md:flex z-20 relative",
                isSidebarOpen ? "w-64" : "w-16"
            )}>
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none rounded-r-2xl" />
                <div className="h-16 flex items-center px-4 border-b">
                    <Package className="text-primary mr-2" />
                    {isSidebarOpen && <span className="font-bold text-lg text-primary">CoreInventory</span>}
                </div>

                <nav className="flex-1 py-4 overflow-y-auto space-y-6">
                    {navigationGroups.map((group, idx) => {
                        const visibleItems = group.items.filter(item => item.show !== false);
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={idx} className="px-2">
                                {isSidebarOpen && (
                                    <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {group.title}
                                    </h3>
                                )}
                                <div className="space-y-1">
                                    {visibleItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = location.pathname === item.path;
                                        return (
                                            <Link
                                                key={item.name}
                                                to={item.path}
                                                title={!isSidebarOpen ? item.name : undefined}
                                                className={cn(
                                                    "flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                                    isActive
                                                        ? "bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20"
                                                        : "text-muted-foreground hover:bg-primary/10 hover:text-primary interactive-scale"
                                                )}
                                            >
                                                {isActive && (
                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-md" />
                                                )}
                                                <Icon size={20} className={cn("shrink-0 relative z-10", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                                                {isSidebarOpen && <span className="ml-3 truncate text-sm relative z-10">{item.name}</span>}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                <div className="p-3 border-t">
                    {isSidebarOpen && (
                        <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Profile Menu
                        </h3>
                    )}
                    <div className="space-y-1">
                        <Link
                            to="/profile"
                            title={!isSidebarOpen ? "My Profile" : undefined}
                            className={cn(
                                "flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group",
                                location.pathname === "/profile"
                                    ? "bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20"
                                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary interactive-scale"
                            )}
                        >
                            <User size={20} className={cn("shrink-0", location.pathname === "/profile" && location.search === "" ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                            {isSidebarOpen && <span className="ml-3 truncate text-sm">My Profile</span>}
                        </Link>

                        <Link
                            to="/profile?tab=password"
                            title={!isSidebarOpen ? "Change Password" : undefined}
                            className={cn(
                                "flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group",
                                location.pathname === "/profile" && location.search === "?tab=password"
                                    ? "bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20"
                                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary interactive-scale"
                            )}
                        >
                            <SettingsIcon size={20} className={cn("shrink-0", location.pathname === "/profile" && location.search === "?tab=password" ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                            {isSidebarOpen && <span className="ml-3 truncate text-sm">Change Password</span>}
                        </Link>

                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-start text-destructive hover:bg-destructive hover:text-destructive-foreground px-3 py-2.5 h-auto rounded-xl transition-all duration-200 interactive-scale",
                                !isSidebarOpen && "justify-center px-0"
                            )}
                            onClick={logout}
                            title={!isSidebarOpen ? "Logout" : undefined}
                        >
                            <LogOut size={20} className={isSidebarOpen ? "mr-3 shrink-0" : "shrink-0"} />
                            {isSidebarOpen && <span className="text-sm font-normal">Logout</span>}
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">

                {/* Top Header */}
                <header className="h-16 border-b glass flex items-center justify-between px-4 lg:px-8 gap-4 sticky top-0 z-10 shadow-sm shadow-primary/5">
                    <div className="flex items-center shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hidden md:flex">
                            <Menu />
                        </Button>
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu />
                        </Button>
                    </div>

                    {/* Global Product Search */}
                    <div className="flex-1 max-w-xl">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            navigate('/products/stock?q=' + encodeURIComponent(e.target.search.value));
                        }}>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    name="search"
                                    type="search"
                                    placeholder="Global Search: Find Any Product (SKU or Name)..."
                                    className="pl-8 bg-zinc-100/50 dark:bg-zinc-900/50 border-none w-full rounded-2xl focus-visible:ring-primary/50 transition-all font-medium"
                                />
                            </div>
                        </form>
                    </div>

                    <div className="flex items-center space-x-4 shrink-0">
                        <div className="text-sm text-right hidden sm:block">
                            <p className="font-semibold leading-none text-foreground">{user?.name}</p>
                            <p className="text-muted-foreground mt-1 text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full inline-block">{user?.role}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-indigo-400 flex items-center justify-center text-white font-bold shadow-md shadow-primary/30 interactive-scale cursor-pointer border-2 border-white dark:border-zinc-800">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-4 md:p-8 relative">
                    <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] -z-10 pointer-events-none" />
                    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 slide-in-from-bottom-4">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
