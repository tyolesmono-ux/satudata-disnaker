import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, ChevronDown, ChevronRight, Menu,
  CheckCircle2, AlertCircle, Users, ReceiptText, ShieldCheck,
  FileText, BarChart, History, FileSpreadsheet, Tag, LogOut,
  Home, Settings, FileCheck, Printer, TrendingUp, Eye
} from 'lucide-react';

// Import Konfigurasi & Helper
import { GAS_URL, theme } from './config/constants';
import { fetchWithTimeout } from './utils/api';
import ErrorBoundary from './components/ErrorBoundary';

// Import Modul-modul
import DashboardView from './components/Dashboard';
import { FormProgram, FormKegiatan, FormSubKegiatan, FormRekening } from './components/Anggaran';
import { FormPegawaiASN, FormWPPribadi, FormWPPihakKetiga, DaftarWajibPajak } from './components/WajibPajak';
import { FormRealisasiGU, FormCetakSPJ, PrintLayout } from './components/Realisasi';
import VerifikasiSPJ from './components/VerifikasiSPJ';
import StandarHarga from './pages/StandarHarga';
import { LaporanRekapGU, LaporanCoreTax, LaporanSIMDTH } from './components/Laporan';
import { KomparasiAnggaran } from './components/KomparasiAnggaran';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ManajemenUser from './pages/ManajemenUser';
import LogAktivitas from './pages/LogAktivitas';
import MasterTagging from './pages/MasterTagging';
import logo from './assets/satudata-logo.png';

import { useAppStore } from './store/useAppStore';

// Helper untuk breadcrumb
const getBreadcrumb = (pathname) => {
  const paths = pathname.split('/').filter(Boolean);
  if (paths.length === 0) return 'Dashboard';
  return paths.map(p => p.replace(/-/g, ' ')).join(' / ');
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    sidebarOpen, setSidebarOpen,
    expandedMenu, setExpandedMenu,
    toast, modal, isFetchingData,
    printData, setPrintData,
    programs, kegiatans, subKegiatans, rekenings,
    pegawaiASN, wpPribadi, wpPihakKetiga,
    realisasiGU, setRealisasiGU, dataSPJ, setDataSPJ, kop21, kopUNI,
    printedNotes, setPrintedNotes,
    fetchAllData, handleSaveData, handleUpdateData, setModal, showToast,
    user, logout, token
  } = useAppStore();

  const activePath = location.pathname;
  const isLoading = modal.show && modal.status === 'loading';

  useEffect(() => {
    if (token) {
      const savedPrinted = localStorage.getItem('satuData_printedNotes');
      if (savedPrinted) setPrintedNotes(JSON.parse(savedPrinted));
      fetchAllData();
    }
  }, [token]);

  // Jika sedang mencetak SPJ, tampilkan Overlay Print
  if (printData) return <PrintLayout data={printData} onBack={() => setPrintData(null)} />;

  // Jika di halaman login, jangan tampilkan Layout Utama
  if (location.pathname === '/login') {
    return (
      <>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        {/* TOAST NOTIFICATION */}
        {toast.show && (
          <div className="fixed bottom-8 right-8 animate-in slide-in-from-bottom-8 duration-300 z-50">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg text-white ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
              {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans antialiased">
      {/* SIDEBAR - Modern Dark Theme */}
      <aside
        className={`${sidebarOpen ? 'w-72' : 'w-20'} flex flex-col transition-all duration-300 ease-in-out shadow-2xl z-20 overflow-y-auto bg-gradient-to-b from-[#0A192F] to-[#0F2A44]`}
      >
        {/* Logo Area - Compact Premium Style */}
        <div className={`relative pt-14 pb-4 mb-4 flex flex-col items-center transition-all duration-300 ${sidebarOpen ? 'px-6' : 'px-4'}`}>
          <div className={`bg-white rounded-3xl shadow-xl flex flex-col items-center transition-all duration-500 group overflow-hidden ${sidebarOpen ? 'p-4 w-full h-28 justify-center' : 'p-2 w-10 h-10'}`}>
            <img 
              src={logo} 
              alt="SatuData Logo" 
              className={`transition-all duration-500 object-contain ${sidebarOpen ? 'h-20 w-auto' : 'h-6 w-6'}`} 
            />
          </div>
          
          {sidebarOpen && (
            <p className="mt-4 text-[9px] font-black text-white/40 uppercase tracking-[0.2em] animate-in fade-in duration-700">
              Disnaker Kota Surakarta
            </p>
          )}

          {/* Hamburger Button - Optimized Vertical Position */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`absolute transition-all duration-300 p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 ${sidebarOpen ? 'top-4 right-2' : 'top-2 left-1/2 -translate-x-1/2 bg-white/5 border border-white/10'}`}
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 pb-8">
          {/* Dashboard */}
          <NavLink
            to="/"
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
              ${isActive
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-400 shadow-lg shadow-amber-500/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }
            `}
          >
            <Home size={20} className="shrink-0" />
            {sidebarOpen && <span className="font-semibold text-sm">Dashboard</span>}
          </NavLink>

          {/* Anggaran Section */}
          <div className="pt-2">
            <button
              onClick={() => { if (!sidebarOpen) setSidebarOpen(true); setExpandedMenu(expandedMenu === 'anggaran' ? null : 'anggaran'); }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 hover:bg-white/5 text-gray-400 hover:text-white group"
            >
              <div className="flex items-center gap-3">
                <Wallet size={20} className="shrink-0" />
                {sidebarOpen && <span className="font-semibold text-sm">Anggaran</span>}
              </div>
              {sidebarOpen && (
                expandedMenu === 'anggaran'
                  ? <ChevronDown size={16} className="text-gray-500" />
                  : <ChevronRight size={16} className="text-gray-500" />
              )}
            </button>

            {sidebarOpen && expandedMenu === 'anggaran' && (
              <div className="ml-4 pl-4 mt-1 border-l border-gray-700/50 space-y-1">
                <NavLink to="/anggaran/program" className={({ isActive }) => `block px-4 py-2 rounded-lg text-sm ${isActive ? 'text-amber-400 bg-amber-500/10 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  Input Program
                </NavLink>
                <NavLink to="/anggaran/kegiatan" className={({ isActive }) => `block px-4 py-2 rounded-lg text-sm ${isActive ? 'text-amber-400 bg-amber-500/10 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  Input Kegiatan
                </NavLink>
                <NavLink to="/anggaran/sub-kegiatan" className={({ isActive }) => `block px-4 py-2 rounded-lg text-sm ${isActive ? 'text-amber-400 bg-amber-500/10 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  Input Sub Kegiatan
                </NavLink>
                <NavLink to="/anggaran/rekening" className={({ isActive }) => `block px-4 py-2 rounded-lg text-sm ${isActive ? 'text-amber-400 bg-amber-500/10 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  Input Rekening
                </NavLink>
                <NavLink to="/anggaran/komparasi" className={({ isActive }) => `block px-4 py-2 rounded-lg text-sm ${isActive ? 'text-amber-400 bg-amber-500/10 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  Analisis Pergeseran
                </NavLink>
              </div>
            )}
          </div>

          {/* Wajib Pajak Section */}
          <div className="pt-1">
            <button
              onClick={() => { if (!sidebarOpen) setSidebarOpen(true); setExpandedMenu(expandedMenu === 'wp' ? null : 'wp'); }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 hover:bg-white/5 text-gray-400 hover:text-white group"
            >
              <div className="flex items-center gap-3">
                <Users size={20} className="shrink-0" />
                {sidebarOpen && <span className="font-semibold text-sm">Wajib Pajak</span>}
              </div>
              {sidebarOpen && (
                expandedMenu === 'wp'
                  ? <ChevronDown size={16} className="text-gray-500" />
                  : <ChevronRight size={16} className="text-gray-500" />
              )}
            </button>

            {sidebarOpen && expandedMenu === 'wp' && (
              <div className="ml-4 pl-4 mt-1 border-l border-gray-700/50 space-y-1">
                <NavLink to="/wp/asn" className={({ isActive }) => `block px-4 py-2 rounded-lg text-sm ${isActive ? 'text-amber-400 bg-amber-500/10 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  Data Pegawai ASN
                </NavLink>
                <NavLink to="/wp/pribadi" className={({ isActive }) => `block px-4 py-2 rounded-lg text-sm ${isActive ? 'text-amber-400 bg-amber-500/10 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  Data WP Pribadi
                </NavLink>
                <NavLink to="/wp/pihak-ketiga" className={({ isActive }) => `block px-4 py-2 rounded-lg text-sm ${isActive ? 'text-amber-400 bg-amber-500/10 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  Data WP Pihak Ketiga
                </NavLink>
                <NavLink to="/wp/list" className={({ isActive }) => `block px-4 py-2 rounded-lg text-sm ${isActive ? 'text-amber-400 bg-amber-500/10 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  Lihat Semua Data
                </NavLink>
              </div>
            )}
          </div>

          {/* Realisasi / SPJ Section */}
          <div className="pt-1">
            <button
              onClick={() => { if (!sidebarOpen) setSidebarOpen(true); setExpandedMenu(expandedMenu === 'realisasi' ? null : 'realisasi'); }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 hover:bg-white/5 text-gray-400 hover:text-white group"
            >
              <div className="flex items-center gap-3">
                <ReceiptText size={20} className="shrink-0" />
                {sidebarOpen && <span className="font-semibold text-sm">Realisasi / SPJ</span>}
              </div>
              {sidebarOpen && (
                expandedMenu === 'realisasi'
                  ? <ChevronDown size={16} className="text-gray-500" />
                  : <ChevronRight size={16} className="text-gray-500" />
              )}
            </button>

            {sidebarOpen && expandedMenu === 'realisasi' && (
              <div className="ml-4 pl-4 mt-1 border-l border-gray-700/50 space-y-1">
                <NavLink to="/spj/input" className={({ isActive }) => `block px-4 py-2 rounded-lg text-sm ${isActive ? 'text-amber-400 bg-amber-500/10 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  Input SPJ (GU)
                </NavLink>
                <NavLink to="/spj/pengajuan" className={({ isActive }) => `block px-4 py-2 rounded-lg text-sm ${isActive ? 'text-amber-400 bg-amber-500/10 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  Pengajuan SPJ
                </NavLink>
                <NavLink to="/spj/verifikasi" className={({ isActive }) => `block px-4 py-2 rounded-lg text-sm ${isActive ? 'text-amber-400 bg-amber-500/10 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  Verifikasi dan Cetak
                </NavLink>
              </div>
            )}
          </div>

          {/* Laporan Section */}
          <div className="pt-1">
            <button
              onClick={() => { if (!sidebarOpen) setSidebarOpen(true); setExpandedMenu(expandedMenu === 'laporan' ? null : 'laporan'); }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 hover:bg-white/5 text-gray-400 hover:text-white group"
            >
              <div className="flex items-center gap-3">
                <FileText size={20} className="shrink-0" />
                {sidebarOpen && <span className="font-semibold text-sm">Laporan</span>}
              </div>
              {sidebarOpen && (
                expandedMenu === 'laporan'
                  ? <ChevronDown size={16} className="text-gray-500" />
                  : <ChevronRight size={16} className="text-gray-500" />
              )}
            </button>

            {sidebarOpen && expandedMenu === 'laporan' && (
              <div className="ml-4 pl-4 mt-1 border-l border-gray-700/50 space-y-1">
                <NavLink to="/laporan/rekap-gu" className={({ isActive }) => `block px-4 py-2 rounded-lg text-sm ${isActive ? 'text-amber-400 bg-amber-500/10 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  Rekapitulasi GU
                </NavLink>
                <NavLink to="/laporan/coretax" className={({ isActive }) => `block px-4 py-2 rounded-lg text-sm ${isActive ? 'text-amber-400 bg-amber-500/10 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  Laporan CoreTax
                </NavLink>
                <NavLink to="/laporan/simdth" className={({ isActive }) => `block px-4 py-2 rounded-lg text-sm ${isActive ? 'text-amber-400 bg-amber-500/10 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  Laporan SIMDTH
                </NavLink>
              </div>
            )}
          </div>

          {/* Pengaturan - Hanya untuk Super Admin */}
          {user?.role === 'super_admin' && (
            <div className="pt-6 mt-4 border-t border-gray-700/30">
              <p className={`px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 ${!sidebarOpen && 'text-center'}`}>
                {sidebarOpen ? 'Pengaturan' : '⚙️'}
              </p>
              <div className="space-y-1">
                <NavLink to="/pengaturan/users" className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${isActive ? 'text-amber-400 bg-amber-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <Settings size={18} />
                  {sidebarOpen && <span className="text-sm font-medium">Manajemen User</span>}
                </NavLink>
                <NavLink to="/pengaturan/shs" className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${isActive ? 'text-amber-400 bg-amber-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <FileSpreadsheet size={18} />
                  {sidebarOpen && <span className="text-sm font-medium">Standar Harga (SHS)</span>}
                </NavLink>
                <NavLink to="/pengaturan/log" className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${isActive ? 'text-amber-400 bg-amber-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <History size={18} />
                  {sidebarOpen && <span className="text-sm font-medium">Log Aktivitas</span>}
                </NavLink>
                <NavLink to="/pengaturan/tagging" className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${isActive ? 'text-amber-400 bg-amber-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <Tag size={18} />
                  {sidebarOpen && <span className="text-sm font-medium">Manajemen Tagging</span>}
                </NavLink>
              </div>
            </div>
          )}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10 border-b border-gray-200/60">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <span className="text-amber-600">📄</span>
                <span className="font-mono text-xs uppercase tracking-wider">Disnaker</span>
                <span className="text-gray-300">/</span>
                <span className="font-semibold text-gray-700 capitalize">
                  {getBreadcrumb(location.pathname)}
                </span>
              </div>
              {isFetchingData && (
                <div className="flex items-center gap-2 text-xs text-gray-400 animate-pulse">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                  Sinkronisasi...
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-800">{user?.nama_lengkap || 'Operator SatuData'}</p>
                <p className="text-[11px] text-gray-500 capitalize">{user?.role?.replace('_', ' ') || 'Dinas Tenaga Kerja'}</p>
              </div>
              <div className="relative group">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-[#0A192F] rounded-full flex items-center justify-center text-white font-bold shadow-md ring-2 ring-amber-500/30 group-hover:ring-amber-500/50 transition-all">
                  {user?.username?.charAt(0).toUpperCase() || 'S'}
                </div>
              </div>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 border border-rose-200 hover:border-rose-300"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-6">
            <ErrorBoundary>
              <div key={location.pathname} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Routes>
                  <Route path="/" element={<ProtectedRoute><DashboardView /></ProtectedRoute>} />

                  <Route path="/anggaran">
                    <Route path="program" element={<ProtectedRoute><FormProgram /></ProtectedRoute>} />
                    <Route path="kegiatan" element={<ProtectedRoute><FormKegiatan /></ProtectedRoute>} />
                    <Route path="sub-kegiatan" element={<ProtectedRoute><FormSubKegiatan /></ProtectedRoute>} />
                    <Route path="rekening" element={<ProtectedRoute><FormRekening /></ProtectedRoute>} />
                    <Route path="komparasi" element={<ProtectedRoute><KomparasiAnggaran /></ProtectedRoute>} />
                  </Route>

                  <Route path="/wp">
                    <Route path="asn" element={<ProtectedRoute><FormPegawaiASN /></ProtectedRoute>} />
                    <Route path="pribadi" element={<ProtectedRoute><FormWPPribadi /></ProtectedRoute>} />
                    <Route path="pihak-ketiga" element={<ProtectedRoute><FormWPPihakKetiga /></ProtectedRoute>} />
                    <Route path="list" element={<ProtectedRoute><DaftarWajibPajak /></ProtectedRoute>} />
                  </Route>

                  <Route path="/spj">
                    <Route path="input" element={<ProtectedRoute><FormRealisasiGU /></ProtectedRoute>} />
                    <Route path="pengajuan" element={<ProtectedRoute><FormCetakSPJ /></ProtectedRoute>} />
                    <Route path="verifikasi" element={<ProtectedRoute><VerifikasiSPJ /></ProtectedRoute>} />
                  </Route>

                  <Route path="/laporan">
                    <Route path="rekap-gu" element={<ProtectedRoute><LaporanRekapGU /></ProtectedRoute>} />
                    <Route path="coretax" element={<ProtectedRoute><LaporanCoreTax /></ProtectedRoute>} />
                    <Route path="simdth" element={<ProtectedRoute><LaporanSIMDTH /></ProtectedRoute>} />
                  </Route>

                  <Route path="/pengaturan">
                    <Route path="users" element={<ProtectedRoute><ManajemenUser /></ProtectedRoute>} />
                    <Route path="shs" element={<ProtectedRoute><StandarHarga /></ProtectedRoute>} />
                    <Route path="log" element={<ProtectedRoute><LogAktivitas /></ProtectedRoute>} />
                    <Route path="tagging" element={<ProtectedRoute><MasterTagging /></ProtectedRoute>} />
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </ErrorBoundary>
          </div>
        </div>

        {/* MODAL LOADING/SUCCESS/ERROR */}
        {modal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-300">
              {modal.status === 'loading' && (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-gray-100 border-t-amber-600 rounded-full animate-spin mb-6"></div>
                  <h3 className="text-xl font-bold text-gray-800">Memproses Data</h3>
                  <p className="text-sm text-gray-500 mt-2">Mohon tunggu sebentar...</p>
                </div>
              )}
              {modal.status === 'success' && (
                <div className="animate-in zoom-in-50 duration-500">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={48} className="text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-black text-gray-800">Berhasil!</h3>
                  <p className="text-sm text-gray-500 mt-3 bg-gray-50 p-3 rounded-xl">{modal.message}</p>
                  <button onClick={() => setModal({ show: false })} className="mt-8 px-6 py-3 bg-gray-900 text-white rounded-xl w-full font-bold shadow-lg hover:bg-gray-800 transition-all">
                    Tutup
                  </button>
                </div>
              )}
              {modal.status === 'error' && (
                <div className="animate-in zoom-in-50 duration-500">
                  <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle size={48} className="text-rose-500" />
                  </div>
                  <h3 className="text-xl font-black text-gray-800">Terjadi Kesalahan</h3>
                  <p className="text-sm text-gray-500 mt-3 bg-rose-50/50 p-3 rounded-xl border border-rose-100">{modal.message}</p>
                  <button onClick={() => setModal({ show: false })} className="mt-8 px-6 py-3 bg-rose-600 text-white rounded-xl w-full font-bold shadow-lg hover:bg-rose-700 transition-all">
                    Tutup
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TOAST NOTIFICATION */}
        {toast.show && (
          <div className="fixed bottom-8 right-8 animate-in slide-in-from-bottom-8 duration-300 z-50">
            <div className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
              {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}