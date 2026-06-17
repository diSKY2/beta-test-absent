import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signInAnonymously } from '../lib/firestoreClient';
import { auth, db } from '../lib/firestoreClient';
import { useNavigate, Link } from 'react-router';
import { doc, setDoc, collection, query, where, getDocs } from '../lib/firestoreClient';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, provider);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Gagal login dengan Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.error === 'Kredensial tidak valid' && trimmedEmail === 'admin@perusahaan.com' && password === 'admin123') {
           const regResponse = await fetch('/api/admin/register', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ email: trimmedEmail, password, name: 'Admin Perusahaan' })
           });
           
           if (regResponse.ok) {
              const regData = await regResponse.json();
              localStorage.setItem('appSession', JSON.stringify({ user: regData.user, token: 'dev-token' }));
              window.location.href = '/admin'; // Force reload to apply auth state
              return;
           } else {
             setError('Gagal membuat akun default admin.');
             setLoading(false);
             return;
           }
        }
        
        setError('Login Gagal: ' + data.error);
        setLoading(false);
        return;
      }
      
      localStorage.setItem('appSession', JSON.stringify({ user: data.user, token: 'dev-token' }));
      window.location.href = '/admin'; // Force reload
      
    } catch (err: any) {
      setError('Network ERROR: Pastikan server backend Anda berjalan (' + err.message + ')');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Left Decoration Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-center items-center">
        <Link to="/" className="absolute top-8 left-8 z-20 flex items-center gap-2 text-white/70 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
        {/* Abstract Glowing Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/20 rounded-full blur-[100px]" />
        
        <div className="relative z-10 p-16 max-w-lg">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10 mb-8">
            <div className="w-6 h-6 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight font-sans tracking-tight">
            BOS Panel<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Future of HR.
            </span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed font-light">
            Sistem terintegrasi untuk rostering cerdas, pantau absensi geofencing, hingga kalkulasi payroll otomatis. Semua dalam satu dasbor minimalis.
          </p>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-sans">Selamat Datang 👋</h2>
            <p className="text-slate-500 mt-2 font-medium">Masuk untuk mengelola operasional HRD Anda</p>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Email Admin</label>
              <input 
                required 
                type="email" 
                className="w-full rounded-xl border-slate-200 bg-slate-50/50 shadow-sm focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 px-4 py-3.5 transition-all outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Admin HRD"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                 <label className="block text-sm font-semibold text-slate-700">Password</label>
              </div>
              <input 
                required 
                type="password" 
                className="w-full rounded-xl border-slate-200 bg-slate-50/50 shadow-sm focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 px-4 py-3.5 transition-all outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full relative flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-3.5 rounded-xl transition-all font-semibold shadow-xl shadow-slate-900/10 disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {loading ? 'Memproses...' : 'Masuk dengan Email'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-center">
            <p className="text-xs text-blue-800/70 font-medium">
              Akses Admin Default:<br/>
              Email: <b>admin@perusahaan.com</b><br/>
              Katasandi: <b>admin123</b>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
