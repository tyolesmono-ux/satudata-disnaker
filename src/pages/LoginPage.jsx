import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import logo from '../assets/satudata-logo.png';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, fetchAllData } = useAppStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        await fetchAllData();
        navigate('/');
      } else {
        setError('Username atau password yang Anda masukkan salah.');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A192F] font-['Roboto'] relative overflow-hidden">
      {/* Subtle navy background ornaments */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md p-4 relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-white rounded-2xl shadow-xl border border-white/10 overflow-hidden transition-all duration-300 hover:shadow-2xl">

          {/* Header Section */}
          <div className="px-8 pt-10 pb-6 text-center bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
            <div className="inline-flex p-3 bg-white rounded-xl shadow-sm border border-gray-100 mb-5 group transition-transform hover:scale-105 duration-300">
              <img src={logo} alt="SatuData Logo" className="h-14 w-auto" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Login Aplikasi SatuData</h1>
            <p className="text-gray-500 text-sm mt-1.5">Sistem Informasi Disnaker Surakarta Terintegrasi</p>
          </div>

          <div className="px-8 pb-10 pt-6">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-rose-700 font-medium leading-snug">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="group">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-amber-500 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm transition-all duration-200 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 outline-none placeholder:text-gray-400 font-medium"
                    placeholder="Masukkan username"
                    required
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-amber-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm transition-all duration-200 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 outline-none placeholder:text-gray-400 font-medium"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-3 px-6 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0 group"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="text-sm">Memverifikasi...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className="text-amber-400 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-bold uppercase tracking-wide">Masuk ke Sistem</span>
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-gray-50/50 px-6 py-4 text-center border-t border-gray-100">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              Dinas Tenaga Kerja Surakarta &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}