import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { User, LogOut, Mail, Shield, KeyRound, CheckCircle2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function Profile() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const initialTab = queryParams.get('tab') === 'password' ? 'password' : 'details';

    const [activeTab, setActiveTab] = useState(initialTab);

    // Form state for changing password
    const [pwdData, setPwdData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        const tab = queryParams.get('tab');
        if (tab === 'password') setActiveTab('password');
        else setActiveTab('details');
    }, [location.search]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        navigate(tab === 'password' ? '/profile?tab=password' : '/profile');
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (pwdData.newPassword !== pwdData.confirmPassword) {
            return setErrorMsg('New passwords do not match.');
        }
        if (pwdData.newPassword.length < 6) {
            return setErrorMsg('Password must be at least 6 characters.');
        }

        setIsSubmitting(true);
        try {
            await api.post('/auth/changepassword', {
                currentPassword: pwdData.currentPassword,
                newPassword: pwdData.newPassword
            });
            setSuccessMsg('Password successfully changed.');
            setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Failed to change password');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div>
                <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent drop-shadow-sm">Account Settings</h2>
                <p className="text-muted-foreground font-medium mt-1">Manage your profile, preferences, and security.</p>
            </div>

            <div className="flex space-x-2 border-b border-border/50 pb-px mb-6">
                <button
                    onClick={() => handleTabChange('details')}
                    className={`px-4 py-2 font-medium text-sm transition-all relative ${activeTab === 'details' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <div className="flex items-center gap-2">
                        <User size={16} /> Profile Details
                    </div>
                    {activeTab === 'details' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
                </button>
                <button
                    onClick={() => handleTabChange('password')}
                    className={`px-4 py-2 font-medium text-sm transition-all relative ${activeTab === 'password' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <div className="flex items-center gap-2">
                        <KeyRound size={16} /> Change Password
                    </div>
                    {activeTab === 'password' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
                </button>
            </div>

            {activeTab === 'details' && (
                <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm ring-1 ring-black/5 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="flex items-start space-x-6">
                        <div className="h-28 w-28 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex flex-shrink-0 items-center justify-center text-white text-5xl font-bold shadow-lg shadow-blue-500/30 ring-4 ring-white dark:ring-zinc-900 z-10">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 space-y-4 pt-2">
                            <div>
                                <h3 className="text-3xl font-bold tracking-tight text-foreground">{user?.name}</h3>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 capitalize">
                                        <Shield size={12} /> {user?.role}
                                    </span>
                                </div>
                            </div>

                            <div className="grid gap-4 mt-6 bg-muted/30 rounded-xl p-5 border border-border/50 max-w-lg">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</span>
                                    <span className="text-foreground font-medium flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-blue-500" /> {user?.email}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-border/50 pt-6 flex justify-end">
                        <Button variant="destructive" onClick={logout} className="rounded-xl shadow-lg shadow-red-500/20 interactive-scale font-medium px-6">
                            <LogOut className="mr-2 h-4 w-4" /> Log out from device
                        </Button>
                    </div>
                </div>
            )}

            {activeTab === 'password' && (
                <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm ring-1 ring-black/5 animate-in fade-in slide-in-from-right-4 duration-300 max-w-lg">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                            <KeyRound className="text-blue-500" size={24} /> Update Password
                        </h3>
                        <p className="text-muted-foreground text-sm mt-1">Ensure your account is using a long, random password to stay secure.</p>
                    </div>

                    {errorMsg && (
                        <div className="mb-6 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-xl text-sm font-medium border border-red-200 dark:border-red-800 animate-in shake">
                            {errorMsg}
                        </div>
                    )}
                    {successMsg && (
                        <div className="mb-6 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 p-3 rounded-xl text-sm font-medium flex items-center gap-2 border border-green-200 dark:border-green-800">
                            <CheckCircle2 size={16} /> {successMsg}
                        </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="font-semibold text-foreground/80">Current Password</Label>
                            <Input
                                type="password"
                                required
                                value={pwdData.currentPassword}
                                onChange={e => setPwdData({ ...pwdData, currentPassword: e.target.value })}
                                className="h-11 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-semibold text-foreground/80">New Password</Label>
                            <Input
                                type="password"
                                required
                                value={pwdData.newPassword}
                                onChange={e => setPwdData({ ...pwdData, newPassword: e.target.value })}
                                className="h-11 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-semibold text-foreground/80">Confirm New Password</Label>
                            <Input
                                type="password"
                                required
                                value={pwdData.confirmPassword}
                                onChange={e => setPwdData({ ...pwdData, confirmPassword: e.target.value })}
                                className="h-11 rounded-xl"
                            />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-xl px-8 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 text-white font-semibold"
                            >
                                {isSubmitting ? 'Updating...' : 'Change Password'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
