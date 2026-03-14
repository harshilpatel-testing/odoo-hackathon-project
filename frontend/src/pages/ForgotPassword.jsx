import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { KeyRound, Info } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState(1);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [testOtp, setTestOtp] = useState('');
    const navigate = useNavigate();

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/forgotpassword', { email });
            setMessage(res.data.message);
            // MVP Testing: Surface the OTP directly so the user can test the flow!
            if (res.data.otp) setTestOtp(res.data.otp);
            setError('');
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to request OTP');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/resetpassword', { email, otp, newPassword });
            setMessage(res.data.message);
            setTestOtp('');
            setError('');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 items-center">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
                        <KeyRound className="text-primary-foreground" size={24} />
                    </div>
                    <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                    <CardDescription>
                        {step === 1 ? 'Enter your email to receive an OTP' : 'Enter the OTP and your new password'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}
                    {message && <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 rounded-md">{message}</div>}

                    {testOtp && (
                        <div className="mb-4 p-3 text-sm bg-blue-100 text-blue-800 rounded-md flex items-start gap-2">
                            <Info size={16} className="mt-0.5 shrink-0" />
                            <div>
                                <strong>MVP Test Mode:</strong> Your generated OTP code is <strong className="text-lg tracking-wider">{testOtp}</strong>
                            </div>
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleRequestOtp} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <Button className="w-full" type="submit">Send OTP</Button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="otp">One-Time Password (OTP)</Label>
                                <Input id="otp" type="text" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                            </div>
                            <Button className="w-full" type="submit">Reset Password</Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="justify-center">
                    <div className="text-sm text-muted-foreground">
                        Remember your password? <Link to="/login" className="text-primary hover:underline font-medium">Log in</Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
