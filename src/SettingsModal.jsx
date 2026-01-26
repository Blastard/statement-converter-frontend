import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { X, CreditCard, Key, Trash2, Loader2 } from 'lucide-react';

export default function SettingsModal({ session, onClose, onDeleteClick }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Use the environment variable, fallback to hardcoded if testing locally without env
    const API_URL = import.meta.env.VITE_API_URL || 'https://statement-converter-backend.vercel.app';

    // 1. MANAGE SUBSCRIPTION (Stripe Portal)
    const handleManageBilling = async () => {
        setLoading('billing');
        try {
            // 1. Get the current session (The Key)
            const { data: { session: currentSession } } = await supabase.auth.getSession();

            if (!currentSession) {
                alert("Please log in first.");
                return;
            }

            // 2. Send the request WITH the token
            const response = await fetch(`${API_URL}/create-portal-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // ✅ CRITICAL: This header was missing. It is the "Key".
                    'Authorization': `Bearer ${currentSession.access_token}`
                },
                // Body can be empty now, backend gets ID from token
                body: JSON.stringify({}),
            });

            const data = await response.json();

            if (response.ok && data.url) {
                window.location.href = data.url;
            } else {
                console.error("Portal Error:", data.error);
                alert("Error connecting to billing: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error('Portal access failed:', error);
            alert("Network error connecting to billing.");
        } finally {
            setLoading(false);
        }
    };

    // 2. PASSWORD RESET
    const handleResetPassword = async () => {
        setLoading('password');
        const { error } = await supabase.auth.resetPasswordForEmail(session.user.email, {
            redirectTo: 'https://vsync.vayltech.com',
        });
        if (error) alert(error.message);
        else setMessage('Password reset link sent to your email.');
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-vayl-card w-full max-w-lg border border-vayl-border rounded-2xl shadow-2xl overflow-hidden relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>

                <div className="p-6 border-b border-vayl-border">
                    <h2 className="text-xl font-bold text-white">Account Settings</h2>
                    <p className="text-sm text-vayl-muted">{session.user.email}</p>
                </div>

                <div className="p-6 space-y-6">

                    {/* BILLING */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-vayl-primary uppercase tracking-wider">Subscription</h3>
                        <button onClick={handleManageBilling} disabled={loading} className="w-full flex items-center justify-between p-4 bg-vayl-bg border border-vayl-border rounded-xl hover:border-vayl-primary transition-colors group">
                            <div className="flex items-center text-gray-300 group-hover:text-white">
                                <CreditCard size={20} className="mr-3" />
                                <span>Manage Plan & Billing</span>
                            </div>
                            {loading === 'billing' ? <Loader2 className="animate-spin" size={18} /> : <span className="text-xs bg-vayl-border px-2 py-1 rounded">OPEN</span>}
                        </button>
                    </div>

                    {/* SECURITY */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-vayl-primary uppercase tracking-wider">Security</h3>
                        <button onClick={handleResetPassword} disabled={loading} className="w-full flex items-center justify-between p-4 bg-vayl-bg border border-vayl-border rounded-xl hover:border-vayl-primary transition-colors group">
                            <div className="flex items-center text-gray-300 group-hover:text-white">
                                <Key size={20} className="mr-3" />
                                <span>Reset Password</span>
                            </div>
                            {loading === 'password' ? <Loader2 className="animate-spin" size={18} /> : <span className="text-xs bg-vayl-border px-2 py-1 rounded">SEND EMAIL</span>}
                        </button>
                        {message && <p className="text-xs text-green-400 mt-2">{message}</p>}
                    </div>

                    {/* DANGER ZONE */}
                    <div className="pt-4 border-t border-vayl-border">
                        {/* THIS IS THE CRITICAL LINE: It calls the prop from App.jsx */}
                        <button onClick={onDeleteClick} className="flex items-center text-red-400 hover:text-red-300 text-sm font-medium transition-colors w-full justify-start">
                            <Trash2 size={16} className="mr-2" /> Delete Account
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}