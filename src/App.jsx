import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import AuthForm from './AuthForm';
import Logo from './components/VsyncLogo';
import SettingsModal from './SettingsModal';
import DeleteAccountModal from './components/DeleteAccountModal'; // <--- NEW: Import the new modal
import { Upload, FileText, AlertCircle, Loader2, ChevronDown, LogOut, User, Sparkles, Zap, Check, X, Settings } from 'lucide-react';

// Vayltech Logo Component for Ribbons
const VayltechLogo = () => (
  <div className="flex flex-col items-center">
    <img src="/vayltech-logo.png" alt="Vayltech Logo" className="w-32 h-auto mb-2 drop-shadow-[0_0_15px_rgba(20,184,166,0.5)]" />
    <span className="text-xl font-bold text-vayl-primary tracking-[0.2em]">VAYLTECH</span>
  </div>
);

export default function App() {
  const [session, setSession] = useState(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // <--- NEW: State for delete modal
  const [isDeleting, setIsDeleting] = useState(false); // <--- NEW: Loading state for deletion process
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('CSV');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState('free');
  const [reconStatus, setReconStatus] = useState(null);

  // Backend API URLs
  const API_URL = 'https://vsync-converter-backend.onrender.com/convert';
  // <--- NEW: Add the delete endpoint URL
  const DELETE_API_URL = 'https://vsync-converter-backend.onrender.com/api/user/delete-account';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('subscription_tier').eq('id', userId).single();
    if (data) setSubscription(data.subscription_tier);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear(); setSession(null);
  };

  // <--- NEW: Handler for confirming account deletion
  const handleConfirmDelete = async () => {
    if (!session) return;
    setIsDeleting(true);

    try {
      // Get the current session token for authentication
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const token = currentSession?.access_token;

      if (!token) throw new Error("No authentication token found.");

      const response = await fetch(DELETE_API_URL, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`, // Send token in header
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Account deletion failed.');
      }

      // Success! Log out the user.
      await handleLogout();
      alert("Your account has been permanently deleted.");

    } catch (err) {
      console.error("Deletion Error:", err);
      alert(`Error: ${err.message}`);
      setIsDeleting(false);
      setShowDeleteModal(false); // Close modal on error
    }
  };

  if (!session) return <AuthForm onLogin={setSession} />;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected); setError(null); setReconStatus(null);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsLoading(true); setError(null); setReconStatus(null);

    const formData = new FormData();
    formData.append('statement', file);
    formData.append('format', format);
    formData.append('userId', session.user.id);

    try {
      // 1. GET THE TOKEN (Critical Fix)
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const token = currentSession?.access_token;

      if (!token) throw new Error("You must be logged in to convert files.");

      // 2. SEND TOKEN IN HEADERS
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          // Note: Do NOT set Content-Type here; fetch sets it automatically for FormData
          'Authorization': `Bearer ${token}`
        }
      });

      const fraudWarning = response.headers.get('x-fraud-warning');
      if (fraudWarning) {
        const proceed = window.confirm(`⚠️ SECURITY WARNING: Vsync detected potential file tampering:\n\n"${fraudWarning}"\n\nDo you want to proceed?`);
        if (!proceed) { setIsLoading(false); return; }
      }

      const statusHeader = response.headers.get('x-reconciliation-status');
      if (statusHeader) setReconStatus(statusHeader);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Conversion failed.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      let ext = format.toLowerCase();
      if (format === 'MT940') ext = 'sta';
      if (format === 'Excel') ext = 'xlsx';

      a.download = `Vsync-${file.name.split('.')[0]}.${ext}`;
      document.body.appendChild(a);
      a.click(); a.remove(); window.URL.revokeObjectURL(url);
      setFile(null);
    } catch (err) {
      console.error(err); setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#050505] relative overflow-hidden">

      {/* Left Ribbon */}
      <div className="fixed left-0 top-0 bottom-0 w-48 bg-gradient-to-b from-vayl-card via-vayl-bg to-vayl-card border-r border-vayl-primary/30 z-20 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_bottom,transparent,theme(colors.vayl.primary)_50%,transparent)] bg-[length:100%_200%] animate-pulse-slow"></div>
        <VayltechLogo />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center p-4 ml-48 mr-48 relative">
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-vayl-purple opacity-[0.07] blur-[150px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mb-12 mt-6 z-10 relative gap-4">
          <a href="https://www.vayltech.com" className="flex items-center hover:opacity-80 transition-opacity">
            <Logo className="h-8 w-auto mr-3 drop-shadow" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Vsync <span className="text-xs text-vayl-muted ml-2 font-medium uppercase border border-vayl-border bg-vayl-card px-2 py-1 rounded tracking-wider">{subscription === 'free66' ? 'Lifetime' : subscription}</span></h1>
          </a>

          <div className="flex items-center gap-4 bg-vayl-card/80 backdrop-blur-md p-1.5 rounded-full border border-vayl-border shadow-sm">
            <button onClick={() => setShowPricing(true)} className="flex items-center px-5 py-2.5 bg-vayl-gradient hover:opacity-90 text-white rounded-full text-sm font-bold shadow-md shadow-teal-900/10 transition-all transform hover:scale-105">
              <Sparkles size={16} className="mr-2" /> Upgrade
            </button>
            <div className="flex items-center text-sm text-vayl-muted border-l pl-4 pr-2 border-vayl-border font-medium">
              <User size={16} className="mr-2 text-vayl-primary" /> {session.user.email}
            </div>
            <button onClick={() => setShowSettings(true)} className="flex items-center justify-center w-8 h-8 rounded-full bg-vayl-bg text-vayl-muted hover:text-white hover:bg-vayl-border transition-colors border border-vayl-border" title="Settings">
              <Settings size={14} />
            </button>
            <button onClick={handleLogout} className="flex items-center justify-center w-8 h-8 rounded-full bg-vayl-bg text-vayl-muted hover:text-red-400 hover:bg-gray-900 transition-colors border border-vayl-border"><LogOut size={14} /></button>
          </div>
        </div>

        <div className="bg-vayl-card shadow-2xl shadow-vayl-primary/10 rounded-2xl p-10 w-full max-w-2xl border border-vayl-primary/50 z-10 relative mt-16">
          <div className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all mb-8 group overflow-hidden ${file ? 'border-vayl-primary bg-vayl-primary/5' : 'border-vayl-border hover:border-vayl-primary hover:bg-vayl-bg'}`}>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx,.xls" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
            {file ? (
              <div className="flex flex-col items-center text-vayl-primary animate-in fade-in zoom-in duration-300">
                <FileText size={64} className="mb-4" />
                <span className="font-bold text-white text-xl truncate w-full px-4">{file.name}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-vayl-muted group-hover:text-white transition-colors">
                <Upload size={32} className="text-vayl-primary mb-4" />
                <span className="font-bold text-xl">Drop Statement Here</span>
                <span className="text-xs mt-3 uppercase tracking-widest text-gray-500 font-bold">PDF • Images • Word • Excel</span>
              </div>
            )}
          </div>

          <div className="mb-8 relative">
            <label className="block text-xs font-bold text-vayl-muted uppercase tracking-widest mb-3 ml-1">Target Format</label>
            <div className="relative group">
              <select value={format} onChange={(e) => setFormat(e.target.value)} className="block w-full pl-5 pr-12 py-4 text-lg bg-vayl-bg border border-vayl-border focus:outline-none focus:ring-2 focus:ring-vayl-primary focus:border-transparent rounded-xl appearance-none text-white font-medium transition-all shadow-sm group-hover:border-gray-600">
                <option value="CSV">CSV (Excel/Xero)</option>
                <option value="QBO">QBO (QuickBooks Online)</option>
                <option value="IIF">IIF (QuickBooks Desktop)</option>
                <option value="Excel">Excel (.xlsx)</option>
                <option value="JSON">JSON (Raw Data)</option>
                <option value="OFX">OFX (Money/Standard)</option>
                <option value="QFX">QFX (Quicken)</option>
                <option value="BAI2">BAI2 (Cash Management)</option>
                <option value="MT940">MT940 (SWIFT)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-gray-500"><ChevronDown size={20} /></div>
            </div>
          </div>

          {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-200 text-sm rounded-xl flex items-center font-medium"><AlertCircle size={20} className="mr-3 flex-shrink-0" />{error}</div>}

          {reconStatus && (
            <div className={`mb-6 p-4 border rounded-xl flex items-center font-medium animate-in fade-in slide-in-from-bottom-2
              ${reconStatus === 'BALANCED' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'}`}>
              {reconStatus === 'BALANCED' ? <Check className="mr-3 flex-shrink-0" size={20} /> : <AlertCircle className="mr-3 flex-shrink-0" size={20} />}
              <div>
                <p className="text-sm font-bold uppercase tracking-wider">{reconStatus === 'BALANCED' ? 'Reconciliation Successful' : 'Discrepancy Detected'}</p>
                {reconStatus !== 'BALANCED' && <p className="text-xs opacity-80 mt-1">Calculated balance differs by: <span className="font-mono font-bold">{reconStatus.replace('IMBALANCE: ', '')}</span></p>}
              </div>
            </div>
          )}

          <button onClick={handleConvert} disabled={!file || isLoading} className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg flex items-center justify-center transition-all shadow-lg transform ${!file || isLoading ? 'bg-vayl-border text-gray-500 cursor-not-allowed' : 'bg-vayl-gradient hover:opacity-90 hover:-translate-y-1'}`}>
            {isLoading ? <><Loader2 size={24} className="animate-spin mr-3" /> Processing...</> : "Convert File"}
          </button>
        </div>

        {/* <--- NEW: Pass the onDelete handler to the SettingsModal */}
        {showPricing && <PricingComponent userId={session.user.id} onClose={() => setShowPricing(false)} />}
        {showSettings && <SettingsModal session={session} onClose={() => setShowSettings(false)} onDeleteClick={() => { setShowSettings(false); setShowDeleteModal(true); }} />}

        <div className="mt-16 text-center z-10">
          <a href="mailto:support@vayltech.com" className="text-vayl-muted hover:text-vayl-primary transition-colors font-semibold text-sm">Support</a>
        </div>
      </div>

      {/* Right Ribbon */}
      <div className="fixed right-0 top-0 bottom-0 w-48 bg-gradient-to-b from-vayl-card via-vayl-bg to-vayl-card border-l border-vayl-primary/30 z-20 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_bottom,transparent,theme(colors.vayl.primary)_50%,transparent)] bg-[length:100%_200%] animate-pulse-slow"></div>
        <VayltechLogo />
      </div>

      {/* <--- NEW: Render the DeleteAccountModal here */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />

    </div>
  );
}

// --- SUBSCRIPTION TIERS (Kept the same) ---
const PLANS = [
  { id: 'basic', name: 'Basic', price: '$7', period: '/mo', priceId: 'price_1SX5yF5XXtc792l625r3suMc', features: ['20 Page Limit', 'Formats: CSV, QBO'], color: 'bg-vayl-card border-vayl-border' },
  { id: 'pro', name: 'Pro', price: '$9', period: '/mo', priceId: 'price_1SX60r5XXtc792l6LWXSzfyt', features: ['Unlimited Pages', 'All Formats (IIF, Excel)', 'Receipts & Invoices'], color: 'bg-vayl-card border-vayl-primary shadow-xl shadow-teal-900/20', popular: true },
  { id: 'pro3', name: 'Pro 3', price: '$19', period: '/qtr', priceId: 'price_1SX62W5XXtc792l6xAGss9r6', features: ['Same as Pro', 'Save ~30%'], color: 'bg-vayl-card border-vayl-border' },
  { id: 'pro12', name: 'Pro 12', price: '$57', period: '/yr', priceId: 'price_1SX65J5XXtc792l6WxKOlHOp', features: ['Same as Pro', 'Best Value'], color: 'bg-vayl-card border-vayl-border' },
  { id: 'team3', name: 'Team 3', price: '$29', period: '/qtr', priceId: 'price_1SYBSZ5XXtc792l6k80TTAPp', features: ['6 Simultaneous Logins', 'Team Dashboard'], color: 'bg-[#020617] border-blue-900/40' },
  { id: 'team12', name: 'Team 12', price: '$67', period: '/yr', priceId: 'price_1SYBTk5XXtc792l6axcP1rXh', features: ['20 Simultaneous Logins', 'Enterprise Priority'], color: 'bg-[#020617] border-blue-900/40' },
];

function PricingComponent({ userId, onClose }) {
  const [loading, setLoading] = useState(null);
  const API_URL = 'https://vsync-converter-backend.onrender.com/create-checkout-session';

  const handleSubscribe = async (priceId, tierId) => {
    setLoading(priceId);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, priceId, tier: tierId }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (error) { console.error(error); alert("Network error."); } finally { setLoading(null); }
  };

  return (
    <div className="fixed inset-0 bg-[#020617]/95 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto font-sans">
      <div className="bg-vayl-bg w-full max-w-7xl p-8 relative my-8 border border-vayl-border shadow-2xl relative overflow-hidden rounded-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 text-vayl-muted hover:text-white transition-colors z-20 bg-vayl-card p-2 rounded-full border border-vayl-border"><X size={24} /></button>
        <h2 className="text-4xl font-bold text-white mb-8 text-center tracking-tight">Upgrade Workspace</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {PLANS.map((plan) => (
            <div key={plan.id} className={`rounded-xl p-5 flex flex-col border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${plan.color} relative overflow-hidden group`}>
              {plan.popular && <span className="bg-vayl-primary text-white text-[10px] font-bold px-2 py-1 rounded mb-3 w-fit tracking-wider shadow-md">RECOMMENDED</span>}
              <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
              <div className="text-3xl font-extrabold text-white mb-6 tracking-tight">{plan.price}<span className="text-sm font-normal text-vayl-muted">{plan.period}</span></div>
              <ul className="space-y-3 mb-6 flex-grow">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-start text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                    <Check size={14} className="mr-2 text-vayl-primary mt-0.5" />{feat}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleSubscribe(plan.priceId, plan.id)} disabled={loading} className="w-full py-3 rounded-lg bg-vayl-card hover:bg-vayl-primary hover:text-white text-vayl-muted font-bold text-sm transition-all border border-vayl-border hover:border-transparent">
                {loading === plan.priceId ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Select'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}