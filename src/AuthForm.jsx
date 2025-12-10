import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Loader2, CheckCircle2, ShieldCheck, ZapIcon } from 'lucide-react';
import Logo from './components/VsyncLogo';

export default function AuthForm({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError(false);

    try {
      let result;
      if (isLogin) {
        result = await supabase.auth.signInWithPassword({ email, password });
      } else {
        result = await supabase.auth.signUp({ email, password });
      }

      if (result.error) throw result.error;

      if (!isLogin) {
        setMessage('Account created! Logging in...');
        if (result.data.session) onLogin(result.data.session);
      } else {
        if (result.data.session) onLogin(result.data.session);
      }

    } catch (err) {
      setError(true);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-vayl-bg">
      {/* Professional Graph Paper Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(#14b8a6 1px, transparent 1px), linear-gradient(90deg, #14b8a6 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }}></div>

      {/* Subtle Glows */}
      <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-vayl-primary opacity-[0.08] blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900 opacity-[0.08] blur-[150px] rounded-full pointer-events-none"></div>

      <div className="text-center mb-10 z-10 relative max-w-2xl">
        <div className="flex justify-center mb-6 drop-shadow-lg">
          {/* 👇 Added Link Wrapper 👇 */}
          <a href="https://www.vayltech.com" className="hover:opacity-80 transition-opacity">
            <Logo className="h-20 w-auto" />
          </a>
          {/* 👆 End Link Wrapper 👆 */}
        </div>
        <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
          Vsync
        </h1>
        <p className="text-xl text-vayl-muted font-light mb-8">
          Secure Financial Data Conversion for Enterprise
        </p>

        {/* Feature Pills (Updated Colors) */}
        <div className="flex flex-wrap justify-center gap-4 mb-8 text-sm font-medium text-gray-300">
          <div className="flex items-center bg-vayl-card/50 border border-vayl-border px-4 py-2 rounded-full backdrop-blur-md">
            <ZapIcon size={16} className="text-yellow-400 mr-2" /> Fast AI Processing
          </div>
          <div className="flex items-center bg-vayl-card/50 border border-vayl-border px-4 py-2 rounded-full backdrop-blur-md">
            <ShieldCheck size={16} className="text-vayl-accent mr-2" /> SOC 2 Ready Architecture
          </div>
          <div className="flex items-center bg-vayl-card/50 border border-vayl-border px-4 py-2 rounded-full backdrop-blur-md">
            <CheckCircle2 size={16} className="text-vayl-primary mr-2" /> Plans from $7/mo
          </div>
        </div>
      </div>

      <div className="bg-vayl-card shadow-2xl rounded-2xl p-8 w-full max-w-md border border-vayl-border z-10 relative">
        <h2 className="text-2xl font-bold text-center mb-8 text-white tracking-wide">
          {isLogin ? 'Secure Login' : 'Start Free Trial'}
        </h2>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-vayl-muted uppercase tracking-wider ml-1">Work Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-vayl-bg border border-vayl-border rounded-lg focus:ring-2 focus:ring-vayl-primary focus:border-transparent focus:outline-none text-white placeholder-gray-600 transition-all"
              placeholder="name@company.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-vayl-muted uppercase tracking-wider ml-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-vayl-bg border border-vayl-border rounded-lg focus:ring-2 focus:ring-vayl-primary focus:border-transparent focus:outline-none text-white placeholder-gray-600 transition-all"
              placeholder="••••••••"
            />
          </div>

          {message && (
            <div className={`p-4 rounded-lg text-sm font-medium border ${error ? 'bg-red-500/10 text-red-200 border-red-500/20' : 'bg-green-500/10 text-green-200 border-green-500/20'}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-vayl-gradient hover:opacity-90 text-white font-bold rounded-lg shadow-lg shadow-teal-900/20 transition-all flex justify-center items-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          {isLogin ? "New to Vayltech? " : "Already have an ID? "}
          <button
            onClick={() => { setIsLogin(!isLogin); setMessage(''); }}
            className="text-vayl-primary font-bold hover:underline"
          >
            {isLogin ? 'Sign Up Now' : 'Log In'}
          </button>
        </div>
      </div>

      <div className="mt-12 text-center z-10">
        <a href="mailto:support@vayltech.com" className="text-vayl-muted hover:text-vayl-primary transition-colors text-sm font-medium">
          Contact Support
        </a>
      </div>
    </div>
  );
}