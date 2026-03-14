import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Package, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to login');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-background relative overflow-hidden font-sans selection:bg-indigo-500/30">
            {/* Ambient Background Glowing Spheres */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[150px] pointer-events-none animate-pulse duration-10000" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-500/20 blur-[150px] pointer-events-none animate-pulse duration-7000" />

            {/* Left Side: Stunning Hero Image Section */}
            <div className="hidden lg:flex w-1/2 relative bg-zinc-950 flex-col justify-between overflow-hidden shadow-2xl z-10 p-12 lg:p-16 border-r border-white/10">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8ed7c663be?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-luminosity transform scale-105 transition-transform duration-[20s] ease-linear hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/90 via-zinc-950/80 to-zinc-950/95" />

                <div className="relative z-10 flex flex-col justify-between h-full">
                    <div className="flex items-center gap-3 drop-shadow-lg">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-white/20">
                            <Package className="text-white w-6 h-6" />
                        </div>
                        <span className="text-3xl font-black tracking-tighter text-white">
                            Core<span className="text-indigo-400">Inventory</span>
                        </span>
                    </div>

                    <div className="max-w-md mt-auto mb-16">
                        <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight mb-6 text-white drop-shadow-md">
                            Smart Operations. <br />
                            <span className="bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">Seamless Logic.</span>
                        </h1>
                        <p className="text-zinc-300 text-lg mb-8 leading-relaxed font-medium">
                            Step into the command center of your enterprise. Real-time stock alerts, AI-driven reordering, and barcoded delivery pipelines.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 relative z-10 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
                        <div className="flex gap-4 items-start">
                            <div className="bg-indigo-500/20 p-2.5 rounded-lg border border-indigo-500/30 shadow-inner">
                                <Zap className="text-indigo-300 w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-0.5">Velocity Driven</h3>
                                <p className="text-xs text-zinc-400 font-medium">Built for rapid scanning</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="bg-emerald-500/20 p-2.5 rounded-lg border border-emerald-500/30 shadow-inner">
                                <ShieldCheck className="text-emerald-300 w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-0.5">Bulletproof</h3>
                                <p className="text-xs text-zinc-400 font-medium">Enterprise data security</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Sleek Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 relative z-10 bg-background/50 backdrop-blur-sm">

                {/* Mobile Identity */}
                <div className="flex items-center gap-2 mb-10 lg:hidden">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Package className="text-white w-5 h-5" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter">
                        Core<span className="text-indigo-500">Inventory</span>
                    </span>
                </div>

                <div className="w-full max-w-[420px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-forwards">
                    <div className="text-center mb-10 space-y-2">
                        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Welcome Back</h2>
                        <p className="text-muted-foreground font-medium text-sm">Sign in to your operator workspace</p>
                    </div>

                    <Card className="glass border-0 ring-1 ring-border/50 shadow-2xl shadow-indigo-500/5 rounded-3xl overflow-hidden bg-card/60 backdrop-blur-xl">
                        {/* Shimmer line */}
                        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

                        <CardContent className="p-8 sm:p-10">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="p-4 text-sm font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3 animate-in fade-in zoom-in-95 leading-relaxed">
                                        <div className="mt-0.5 flex-shrink-0">
                                            <ShieldCheck className="w-4 h-4 text-destructive" />
                                        </div>
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="space-y-2 group">
                                    <Label htmlFor="email" className="font-bold text-xs uppercase tracking-wider text-muted-foreground group-focus-within:text-indigo-600 transition-colors">
                                        Email Address
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="admin@coreinventory.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="h-12 bg-muted/30 border-2 border-border/50 focus:border-indigo-500 focus:bg-background rounded-xl px-4 font-medium transition-all focus:shadow-sm focus:shadow-indigo-500/20 focus-visible:ring-0"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 group">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="font-bold text-xs uppercase tracking-wider text-muted-foreground group-focus-within:text-indigo-600 transition-colors">
                                            Password
                                        </Label>
                                        <Link to="/forgot-password" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="h-12 bg-muted/30 border-2 border-border/50 focus:border-indigo-500 focus:bg-background rounded-xl px-4 font-medium transition-all focus:shadow-sm focus:shadow-indigo-500/20 focus-visible:ring-0"
                                        />
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-12 rounded-xl text-base font-bold mt-4 group relative overflow-hidden bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 border border-indigo-500/50 transition-all active:scale-[0.98]"
                                    type="submit"
                                    disabled={loading}
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                                    <span className="relative flex items-center justify-center gap-2">
                                        {loading ? 'Authenticating...' : 'Secure Sign In'}
                                        {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />}
                                    </span>
                                </Button>
                            </form>
                        </CardContent>

                        <div className="bg-muted/30 border-t border-border/40 p-6 text-center text-sm font-medium text-muted-foreground">
                            New team member?{' '}
                            <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors">
                                Request an account
                            </Link>
                        </div>
                    </Card>

                    <p className="text-center text-xs font-medium text-muted-foreground mt-8 opacity-60">
                        &copy; {new Date().getFullYear()} CoreInventory Systems. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
