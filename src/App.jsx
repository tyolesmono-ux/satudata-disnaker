import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, ChevronDown, ChevronRight, Menu, CheckCircle2, AlertCircle, Users, ReceiptText, ShieldCheck, FileText, BarChart } from 'lucide-react';

// Import Komfigurasi & Helper
import { GAS_URL, theme } from './config/constants';
import { fetchWithTimeout } from './utils/api';
import ErrorBoundary from './components/ErrorBoundary';

// Import Modul-modul
import DashboardView from './components/Dashboard';
import { FormProgram, FormKegiatan, FormSubKegiatan, FormRekening } from './components/Anggaran';
import { FormPegawaiASN, FormWPPribadi, FormWPPihakKetiga, DaftarWajibPajak } from './components/WajibPajak';
import { FormRealisasiGU, FormCetakSPJ, PrintLayout } from './components/Realisasi';
import VerifikasiSPJ from './components/VerifikasiSPJ';
import { LaporanRekapGU, LaporanCoreTax, LaporanSIMDTH } from './components/Laporan';
import { KomparasiAnggaran } from './components/KomparasiAnggaran';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ManajemenUser from './pages/ManajemenUser';
import logo from './assets/satudata-logo.png';

import { useAppStore } from './store/useAppStore';

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
        {/* TOAST NOTIFICATION (Bisa dipindah ke komponen global agar bisa dipanggil dari manapun) */}
        {toast.show && (
          <div className="absolute bottom-8 right-8 animate-in slide-in-from-bottom-8 duration-300 z-50">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
              {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        )}
      </>
    );
  }
  
  return (
    <div className="flex h-screen font-sans bg-[#F3F4F6]">
      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col transition-all duration-300 shadow-xl z-20 overflow-y-auto bg-[#0A192F]`}>
        <div className={`relative p-5 mb-4 flex items-center ${sidebarOpen ? 'justify-center' : 'justify-center'}`}>
          {sidebarOpen && (
            <div className="bg-white p-3 rounded-2xl shadow-lg border border-white/20 flex items-center justify-center">
              <img src={logo} alt="SatuData Logo" className="h-16 w-auto" />
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className={`${sidebarOpen ? 'absolute right-5' : ''} p-1 rounded-md hover:bg-white/10 text-white transition-colors`}
          >
            <Menu size={24} />
          </button>
        </div>
        <nav className="flex-1 px-3 space-y-2 pb-6">
          <NavLink to="/" className={({ isActive }) => `w-full flex items-center p-3 rounded-lg transition-all duration-300 hover-scale ${isActive ? 'bg-white/10 shadow-lg' : 'hover:bg-white/5'}`}>
            {({ isActive }) => (
              <>
                <LayoutDashboard size={20} style={{ color: isActive ? theme.gold : '#9ca3af' }} className="shrink-0" />
                {sidebarOpen && <span className="ml-3 font-medium text-white">Dashboard</span>}
              </>
            )}
          </NavLink>
          <div className="pt-2">
            <button onClick={() => { if(!sidebarOpen) setSidebarOpen(true); setExpandedMenu(expandedMenu === 'anggaran' ? null : 'anggaran'); }} className="w-full flex items-center justify-between p-3 rounded-lg transition-all duration-300 hover-scale hover:bg-white/5">
              <div className="flex items-center"><Wallet size={20} style={{ color: activePath.startsWith('/anggaran') ? theme.gold : '#9ca3af' }} className="shrink-0" />{sidebarOpen && <span className="ml-3 font-medium text-white">Anggaran</span>}</div>
              {sidebarOpen && (expandedMenu === 'anggaran' ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />)}
            </button>
            {sidebarOpen && expandedMenu === 'anggaran' && (
              <div className="mt-1 ml-4 pl-4 border-l border-gray-700 space-y-1">
                {[
                  { path: '/anggaran/program', label: 'Input Program' }, 
                  { path: '/anggaran/kegiatan', label: 'Input Kegiatan' }, 
                  { path: '/anggaran/sub-kegiatan', label: 'Input Sub Kegiatan' }, 
                  { path: '/anggaran/rekening', label: 'Input Rekening' }
                ].map((item) => (
                  <NavLink key={item.path} to={item.path} className={({ isActive }) => `w-full block text-left py-2 px-3 rounded-md text-sm ${isActive ? 'text-white font-medium bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
          <div className="pt-2">
            <NavLink to="/anggaran/komparasi" className={({ isActive }) => `w-full flex items-center p-3 rounded-lg transition-all duration-300 hover-scale ${isActive ? 'bg-white/10 shadow-lg' : 'hover:bg-white/5'}`}>
              {({ isActive }) => (
                <>
                  <BarChart size={20} style={{ color: isActive ? theme.gold : '#9ca3af' }} className="shrink-0" />
                  {sidebarOpen && <span className="ml-3 font-medium text-white">Analisis Pergeseran</span>}
                </>
              )}
            </NavLink>
          </div>
          <div className="pt-2">
            <button onClick={() => { if(!sidebarOpen) setSidebarOpen(true); setExpandedMenu(expandedMenu === 'wp' ? null : 'wp'); }} className="w-full flex items-center justify-between p-3 rounded-lg transition-all duration-300 hover-scale hover:bg-white/5">
              <div className="flex items-center"><Users size={20} style={{ color: activePath.startsWith('/wp') ? theme.gold : '#9ca3af' }} className="shrink-0" />{sidebarOpen && <span className="ml-3 font-medium text-white">Wajib Pajak</span>}</div>
              {sidebarOpen && (expandedMenu === 'wp' ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />)}
            </button>
            {sidebarOpen && expandedMenu === 'wp' && (
              <div className="mt-1 ml-4 pl-4 border-l border-gray-700 space-y-1">
                {[
                  { path: '/wp/asn', label: 'Data Pegawai ASN' }, 
                  { path: '/wp/pribadi', label: 'Data WP Pribadi' }, 
                  { path: '/wp/pihak-ketiga', label: 'Data WP Pihak Ketiga' }, 
                  { path: '/wp/list', label: 'Lihat Semua Data' }
                ].map((item) => (
                  <NavLink key={item.path} to={item.path} className={({ isActive }) => `w-full block text-left py-2 px-3 rounded-md text-sm ${isActive ? 'text-white font-medium bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
          <div className="pt-2">
            <button onClick={() => { if(!sidebarOpen) setSidebarOpen(true); setExpandedMenu(expandedMenu === 'realisasi' ? null : 'realisasi'); }} className="w-full flex items-center justify-between p-3 rounded-lg transition-all duration-300 hover-scale hover:bg-white/5 group">
              <div className="flex items-center">
                <ReceiptText size={20} style={{ color: activePath.startsWith('/spj') ? theme.gold : '#9ca3af' }} className="shrink-0" />
                {sidebarOpen && <span className="ml-3 font-medium text-white">Realisasi / SPJ</span>}
              </div>
              {sidebarOpen && (expandedMenu === 'realisasi' ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />)}
            </button>
            {sidebarOpen && expandedMenu === 'realisasi' && (
              <div className="mt-1 ml-4 pl-4 border-l border-gray-700 space-y-1">
                {[
                  { path: '/spj/input', label: 'Input SPJ (GU)' },
                  { path: '/spj/pengajuan', label: 'Pengajuan SPJ' },
                  { path: '/spj/verifikasi', label: 'Verifikasi dan Cetak' }
                ].map((item) => (
                  <NavLink key={item.path} to={item.path} className={({ isActive }) => `w-full block text-left py-2 px-3 rounded-md text-sm ${isActive ? 'text-white font-medium bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
          <div className="pt-2">
            <button onClick={() => { if(!sidebarOpen) setSidebarOpen(true); setExpandedMenu(expandedMenu === 'laporan' ? null : 'laporan'); }} className="w-full flex items-center justify-between p-3 rounded-lg transition-all duration-300 hover-scale hover:bg-white/5 group">
              <div className="flex items-center">
                <FileText size={20} style={{ color: activePath.startsWith('/laporan') ? theme.gold : '#9ca3af' }} className="shrink-0" />
                {sidebarOpen && <span className="ml-3 font-medium text-white">Laporan</span>}
              </div>
              {sidebarOpen && (expandedMenu === 'laporan' ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />)}
            </button>
            {sidebarOpen && expandedMenu === 'laporan' && (
              <div className="mt-1 ml-4 pl-4 border-l border-gray-700 space-y-1">
                {[
                  { path: '/laporan/rekap-gu', label: 'Rekapitulasi GU' },
                  { path: '/laporan/coretax', label: 'Laporan CoreTax' },
                  { path: '/laporan/simdth', label: 'Laporan SIMDTH' }
                ].map((item) => (
                  <NavLink key={item.path} to={item.path} className={({isActive})=>`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${isActive ? 'bg-[#D4AF37] text-[#0A192F] shadow-lg shadow-[#D4AF37]/20 scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40"></div>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Pengaturan - Hanya untuk Super Admin */}
          {user?.role === 'super_admin' && (
            <div className="mt-6">
              <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-3">Pengaturan</p>
              <NavLink to="/pengaturan/users" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-[#D4AF37] text-[#0A192F] shadow-lg shadow-[#D4AF37]/20 scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <Users size={18} />
                <span className="font-semibold">Manajemen User</span>
              </NavLink>
            </div>
          )}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white shadow-sm h-16 flex items-center px-8 border-b border-gray-200 justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-[#0A192F] capitalize">
              {location.pathname === '/' ? 'Dashboard' : location.pathname.split('/').filter(Boolean).join(' / ').replace(/-/g, ' ')}
            </h1>
            {isFetchingData && <span className="text-xs text-gray-400 animate-pulse">(Sinkronisasi...)</span>}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[#0A192F]">{user?.nama_lengkap || 'Operator SatuData'}</p>
              <p className="text-[10px] text-gray-500 capitalize">{user?.role?.replace('_', ' ') || 'Dinas Tenaga Kerja'}</p>
            </div>
            <div className="w-10 h-10 bg-[#0A192F] rounded-full flex items-center justify-center text-white font-bold border-2 border-[#D4AF37]/30 shadow-inner">
              {user?.username?.charAt(0).toUpperCase() || 'S'}
            </div>
            <button 
              onClick={() => { logout(); navigate('/login'); }} 
              className="ml-2 px-3 py-1.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <ErrorBoundary>
            <div key={location.pathname} className="page-transition">
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
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </ErrorBoundary>
        </div>

        {/* MODAL ERROR/LOADING/SUCCESS */}
        {modal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full text-center animate-in zoom-in-90 fade-in duration-300 ease-out sm:scale-100 border border-white/20">
              {modal.status === 'loading' && (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-gray-100 border-t-[#D4AF37] rounded-full animate-spin mb-6"></div>
                  <h3 className="text-xl font-bold text-[#0A192F]">SatuData Sedang Bekerja</h3>
                  <p className="text-sm text-gray-500 mt-2 italic px-4">Mohon tunggu sebentar, data sedang diproses ke server...</p>
                </div>
              )}
              {modal.status === 'success' && (
                <div className="animate-in zoom-in-50 duration-500">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={48} className="text-green-500" />
                  </div>
                  <h3 className="text-xl font-black text-[#0A192F]">Berhasil Tersimpan!</h3>
                  <p className="text-sm text-gray-500 mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">{modal.message}</p>
                  <button onClick={() => setModal({show: false})} className="mt-8 px-6 py-3 text-white bg-[#0A192F] rounded-xl w-full font-bold shadow-lg shadow-[#0A192F]/20 hover:bg-[#122442] transition-all">Tutup Jendela</button>
                </div>
              )}
              {modal.status === 'error' && (
                <div className="animate-in zoom-in-50 duration-500">
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle size={48} className="text-red-500" />
                  </div>
                  <h3 className="text-xl font-black text-[#0A192F]">Ups, Terjadi Kendala</h3>
                  <p className="text-sm text-gray-500 mt-3 bg-red-50/50 p-3 rounded-lg border border-red-100">{modal.message}</p>
                  <button onClick={() => setModal({show: false})} className="mt-8 px-6 py-3 bg-red-600 text-white rounded-xl w-full font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all">Pahami & Kembali</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TOAST NOTIFICATION */}
        {toast.show && (
          <div className="absolute bottom-8 right-8 animate-in slide-in-from-bottom-8 duration-300 z-50">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
              {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}