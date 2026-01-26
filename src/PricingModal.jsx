import React, { useState } from 'react';
import { Check, Loader2, X, Sparkles } from 'lucide-react';
import Logo from './components/Logo';
import { supabase } from '../supabaseClient'; // <--- NEW IMPORT REQUIRED

// *** PASTE STRIPE IDs HERE ***
const PLANS = [
    {
        id: 'basic',
        name: 'Vsync Basic',
        price: '$6',
        period: '/mo',
        priceId: 'price_1SX5yF5XXtc792l625r3suMc',
        features: ['Unlimited Conversions', 'Formats: CSV, QBO'],
        color: 'bg-vayl-dark border-vayl-darker',
        textColor: 'text-white',
        btnColor: 'bg-vayl-darker hover:bg-gray-700 text-white border border-gray-600',
    },
    {
        id: 'pro',
        name: 'Vsync Pro',
        price: '$9',
        period: '/mo',
        priceId: 'price_1SX60r5XXtc792l6LWXSzfyt',
        features: ['Unlimited Conversions', 'All Formats (OFX, BAI2, MT940)', 'Priority Support'],
        color: 'bg-vayl-dark border-vayl-purple shadow-xl shadow-vayl-purple/20',
        textColor: 'text-white',
        btnColor: 'bg-vayl-purple hover:bg-vayl-purpleDark text-white font-bold shadow-lg shadow-vayl-purple/30',
        popular: true,
    },
    {
        id: 'pro3',
        name: 'Vsync Pro 3',
        price: '$19',
        period: '/3 mos',
        priceId: 'price_1SX62W5XXtc792l6xAGss9r6',
        features: ['Everything in Pro', 'Save ~30% vs Monthly'],
        color: 'bg-vayl-dark border-vayl-darker',
        textColor: 'text-white',
        btnColor: 'bg-vayl-darker hover:bg-gray-700 text-white border border-gray-600',
    },
    {
        id: 'pro12',
        name: 'Vsync Pro 12',
        price: '$59',
        period: '/year',
        priceId: 'price_1SX65J5XXtc792l6WxKOlHOp',
        features: ['Everything in Pro', 'Best Value (Save ~45%)'],
        color: 'bg-vayl-dark border-vayl-darker',
        textColor: 'text-white',
        btnColor: 'bg-vayl-darker hover:bg-gray-700 text-white border border-gray-600',
    }
];

export default function Pricing({ userId, onClose }) {
    const [loading, setLoading] = useState(null);
    // Use the environment variable, fallback to hardcoded if testing locally without env
    const API_URL = import.meta.env.VITE_API_URL || 'https://statement-converter-backend.vercel.app';

    const handleSubscribe = async (priceId) => {
        setLoading(priceId);
        try {
            // 1. GET SESSION TOKEN
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                alert("Please log in to upgrade.");
                setLoading(null);
                return;
            }

            // 2. SEND REQUEST WITH TOKEN
            const response = await fetch(`${API_URL}/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}` // <--- CRITICAL FIX
                },
                // No need to send userId anymore, backend gets it from token
                body: JSON.stringify({ priceId }),
            });

            const data = await response.json();

            if (response.ok && data.url) {
                window.location.href = data.url;
            } else {
                console.error('Checkout Error:', data.error);
                alert("Subscription failed: " + (data.error || "Unknown error"));
            }

        } catch (error) {
            console.error(error);
            alert("Network error. Please try again.");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-vayl-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto font-sans">
            <div className="bg-vayl-black rounded-3xl w-full max-w-6xl p-8 relative my-8 border border-vayl-darker shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-vayl-purple opacity-[0.1] blur-[120px] rounded-full pointer-events-none"></div>

                <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors z-20 bg-vayl-darker p-2 rounded-full">
                    <X size={24} />
                </button>

                <div className="text-center mb-12 relative z-10">
                    <Logo className="h-12 w-auto mx-auto mb-4" />
                    <h2 className="text-4xl font-bold text-white mb-3 tracking-tight">Upgrade your Workspace</h2>
                    <p className="text-xl text-gray-400">Unlock enterprise-grade formats and unlimited power.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    {PLANS.map((plan) => (
                        <div key={plan.id} className={`rounded-2xl p-8 flex flex-col border transition-all hover:-translate-y-1 hover:shadow-2xl ${plan.color} relative`}>
                            {plan.popular && (
                                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-vayl-purple text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center border border-vayl-purpleDark">
                                    <Sparkles size={12} className="mr-1" /> MOST POPULAR
                                </span>
                            )}
                            <h3 className={`text-xl font-bold mb-2 ${plan.textColor}`}>{plan.name}</h3>
                            <div className={`text-5xl font-extrabold mb-6 ${plan.textColor}`}>
                                {plan.price}<span className="text-lg font-medium opacity-60">{plan.period}</span>
                            </div>

                            <ul className="space-y-4 mb-10 flex-grow">
                                {plan.features.map((feat, i) => (
                                    <li key={i} className="flex items-start text-md text-gray-300">
                                        <Check size={20} className="mr-3 mt-0.5 flex-shrink-0 text-vayl-purple" />
                                        <span>{feat}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSubscribe(plan.priceId)}
                                disabled={loading}
                                className={`w-full py-4 rounded-xl transition-all flex justify-center text-lg ${plan.btnColor}`}
                            >
                                {loading === plan.priceId ? <Loader2 className="animate-spin" size={24} /> : 'Choose Plan'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}