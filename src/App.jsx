import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Wallet, ChevronDown, ChevronRight, Menu, CheckCircle2, AlertCircle, Users, ReceiptText, ShieldCheck, FileText, BarChart } from 'lucide-react';

// Import Komfigurasi & Helper
import { GAS_URL, theme } from './config/constants';

// Import Modul-modul
import DashboardView from './components/Dashboard';
import { FormProgram, FormKegiatan, FormSubKegiatan, FormRekening } from './components/Anggaran';
import { FormPegawaiASN, FormWPPribadi, FormWPPihakKetiga } from './components/WajibPajak';
import { FormRealisasiGU, FormCetakSPJ, PrintLayout } from './components/Realisasi';
import VerifikasiSPJ from './components/VerifikasiSPJ';
import { LaporanRekapGU, LaporanCoreTax, LaporanSIMDTH } from './components/Laporan';
import { KomparasiAnggaran } from './components/KomparasiAnggaran';
import logo from './assets/satudata-logo.png';

export default function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [expandedMenu, setExpandedMenu] = useState('realisasi'); 
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [modal, setModal] = useState({ show: false, status: 'loading', message: '' });

  const [programs, setPrograms] = useState([]);
  const [kegiatans, setKegiatans] = useState([]);
  const [subKegiatans, setSubKegiatans] = useState([]);
  const [rekenings, setRekenings] = useState([]);
  const [pegawaiASN, setPegawaiASN] = useState([]);
  const [wpPribadi, setWPPribadi] = useState([]);
  const [wpPihakKetiga, setWPPihakKetiga] = useState([]);
  const [realisasiGU, setRealisasiGU] = useState([]); 
  const [dataSPJ, setDataSPJ] = useState([]);
  const [kop21, setKop21] = useState([]);
  const [kopUNI, setKopUNI] = useState([]);

  const [printData, setPrintData] = useState(null);
  const isLoading = modal.show && modal.status === 'loading';
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [printedNotes, setPrintedNotes] = useState([]);

  const fetchAllData = async () => {
    if (!GAS_URL) return;
    setIsFetchingData(true);
    try {
      const response = await fetch(`${GAS_URL}?action=getAllData`);
      const result = await response.json();
      if (result.status === 'success') {
        setPrograms(result.data.program || []);
        setKegiatans(result.data.kegiatan || []);
        setSubKegiatans(result.data.subkegiatan || []);
        setRekenings(result.data.rekening || []);
        setPegawaiASN(result.data.pegawaiasn || []);
        setWPPribadi(result.data.wppribadi || []);
        setWPPihakKetiga(result.data.wppihakketiga || []);
        setDataSPJ(result.data.dataspj || []);
        setKop21(result.data.kop21 || []);
        setKopUNI(result.data.kopuni || []);
        
        const formattedRealisasi = (result.data.realisasigu || []).map((r, idx) => {
          const uniqueId = r.timestamp ? String(r.timestamp) : `temp_${idx}_${Date.now()}`;
          return { 
            ...r, 
            id_nota: r.id_nota || uniqueId,
            timestamp: uniqueId
          };
        });
        setRealisasiGU(formattedRealisasi);
      }
    } catch (error) {
      showToast('Gagal menarik data dari database.', 'error');
    } finally {
      setIsFetchingData(false);
    }
  };

  useEffect(() => {
    const savedPrinted = localStorage.getItem('satuData_printedNotes');
    if (savedPrinted) setPrintedNotes(JSON.parse(savedPrinted));
    fetchAllData();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSaveData = async (sheetName, payload) => {
    setModal({ show: true, status: 'loading', message: `Sedang menyimpan data ${sheetName}...` });
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'insert', sheet: sheetName, payload }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' } 
      });
      const result = await response.json();
      if (result.status !== 'success') throw new Error(result.message);
      
      if (sheetName === 'Program') setPrograms(prev => [...prev, payload]);
      if (sheetName === 'Kegiatan') setKegiatans(prev => [...prev, payload]);
      if (sheetName === 'SubKegiatan') setSubKegiatans(prev => [...prev, payload]);
      if (sheetName === 'Rekening') setRekenings(prev => [...prev, payload]);
      if (sheetName === 'PegawaiASN') setPegawaiASN(prev => [...prev, payload]);
      if (sheetName === 'WPPribadi') setWPPribadi(prev => [...prev, payload]);
      if (sheetName === 'WPPihakKetiga') setWPPihakKetiga(prev => [...prev, payload]);
      if (sheetName === 'RealisasiGU') {
        // Gunakan id_nota & timestamp ASLI dari backend agar konsisten dengan sheet
        const realIdNota = result.id_nota || ('temp_' + Date.now());
        const realTimestamp = result.timestamp || realIdNota;
        setRealisasiGU(prev => [...prev, { 
          ...payload, 
          id_nota: realIdNota, 
          timestamp: realTimestamp,
          status_nota: 'Draft',
          status_spj: 'Draft',
          id_spj: ''
        }]);
      }

      setModal({ show: true, status: 'success', message: `Data ${sheetName} berhasil disimpan!` });
      return true; 
    } catch (error) {
      setModal({ show: true, status: 'error', message: `Gagal: ${error.message}` });
      return false; 
    }
  };

  const handleUpdateData = async (timestamp, updates) => {
    setModal({ show: true, status: 'loading', message: 'Sedang memperbarui data...' });
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'update', sheet: 'RealisasiGU', payload: { timestamp: timestamp, updates } }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const result = await response.json();
      if (result.status !== 'success') throw new Error(result.message);

      // Update state lokal — support single or array of timestamps
      const tsArray = Array.isArray(timestamp) ? timestamp.map(String) : [String(timestamp)];
      setRealisasiGU(prev => prev.map(r => 
        tsArray.includes(String(r.timestamp)) ? { ...r, ...updates } : r
      ));

      setModal({ show: true, status: 'success', message: result.message });
      return true;
    } catch (error) {
      setModal({ show: true, status: 'error', message: `Gagal: ${error.message}` });
      return false;
    }
  };

  // Jika sedang mencetak SPJ, tampilkan Overlay Print
  if (printData) return <PrintLayout data={printData} onBack={() => setPrintData(null)} />;
  
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
          <button onClick={() => setActiveMenu('dashboard')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeMenu === 'dashboard' ? 'bg-white/10' : 'hover:bg-white/5'}`}>
            <LayoutDashboard size={20} style={{ color: activeMenu === 'dashboard' ? theme.gold : '#9ca3af' }} className="shrink-0" />
            {sidebarOpen && <span className="ml-3 font-medium text-white">Dashboard</span>}
          </button>
          <div className="pt-2">
            <button onClick={() => { if(!sidebarOpen) setSidebarOpen(true); setExpandedMenu(expandedMenu === 'anggaran' ? null : 'anggaran'); }} className="w-full flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-white/5">
              <div className="flex items-center"><Wallet size={20} style={{ color: activeMenu.startsWith('input') || activeMenu === 'komparasi_anggaran' ? theme.gold : '#9ca3af' }} className="shrink-0" />{sidebarOpen && <span className="ml-3 font-medium text-white">Anggaran</span>}</div>
              {sidebarOpen && (expandedMenu === 'anggaran' ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />)}
            </button>
            {sidebarOpen && expandedMenu === 'anggaran' && (
              <div className="mt-1 ml-4 pl-4 border-l border-gray-700 space-y-1">
                {[{ id: 'input_program', label: 'Input Program' }, { id: 'input_kegiatan', label: 'Input Kegiatan' }, { id: 'input_subkegiatan', label: 'Input Sub Kegiatan' }, { id: 'input_rekening', label: 'Input Rekening' }].map((item) => (
                  <button key={item.id} onClick={() => setActiveMenu(item.id)} className={`w-full text-left py-2 px-3 rounded-md text-sm ${activeMenu === item.id ? 'text-white font-medium bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{item.label}</button>
                ))}
              </div>
            )}
          </div>
          <div className="pt-2">
            <button onClick={() => setActiveMenu('komparasi_anggaran')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeMenu === 'komparasi_anggaran' ? 'bg-white/10' : 'hover:bg-white/5'}`}>
              <BarChart size={20} style={{ color: activeMenu === 'komparasi_anggaran' ? theme.gold : '#9ca3af' }} className="shrink-0" />
              {sidebarOpen && <span className="ml-3 font-medium text-white">Analisis Pergeseran</span>}
            </button>
          </div>
          <div className="pt-2">
            <button onClick={() => { if(!sidebarOpen) setSidebarOpen(true); setExpandedMenu(expandedMenu === 'wp' ? null : 'wp'); }} className="w-full flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-white/5">
              <div className="flex items-center"><Users size={20} style={{ color: activeMenu.startsWith('wp_') ? theme.gold : '#9ca3af' }} className="shrink-0" />{sidebarOpen && <span className="ml-3 font-medium text-white">Wajib Pajak</span>}</div>
              {sidebarOpen && (expandedMenu === 'wp' ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />)}
            </button>
            {sidebarOpen && expandedMenu === 'wp' && (
              <div className="mt-1 ml-4 pl-4 border-l border-gray-700 space-y-1">
                {[{ id: 'wp_asn', label: 'Data Pegawai ASN' }, { id: 'wp_pribadi', label: 'Data WP Pribadi' }, { id: 'wp_pihakketiga', label: 'Data WP Pihak Ketiga' }].map((item) => (
                  <button key={item.id} onClick={() => setActiveMenu(item.id)} className={`w-full text-left py-2 px-3 rounded-md text-sm ${activeMenu === item.id ? 'text-white font-medium bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{item.label}</button>
                ))}
              </div>
            )}
          </div>
          <div className="pt-2">
            <button onClick={() => { if(!sidebarOpen) setSidebarOpen(true); setExpandedMenu(expandedMenu === 'realisasi' ? null : 'realisasi'); }} className="w-full flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-white/5 group">
              <div className="flex items-center">
                <ReceiptText size={20} style={{ color: activeMenu.startsWith('realisasi_') || activeMenu === 'cetak_spj' || activeMenu === 'verifikasi_spj' ? theme.gold : '#9ca3af' }} className="shrink-0" />
                {sidebarOpen && <span className="ml-3 font-medium text-white">Realisasi / SPJ</span>}
              </div>
              {sidebarOpen && (expandedMenu === 'realisasi' ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />)}
            </button>
            {sidebarOpen && expandedMenu === 'realisasi' && (
              <div className="mt-1 ml-4 pl-4 border-l border-gray-700 space-y-1">
                <button onClick={() => setActiveMenu('realisasi_gu')} className={`w-full text-left py-2 px-3 rounded-md text-sm transition-colors ${activeMenu === 'realisasi_gu' ? 'text-white font-medium bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Input SPJ (GU)</button>
                <button onClick={() => setActiveMenu('cetak_spj')} className={`w-full text-left py-2 px-3 rounded-md text-sm transition-colors ${activeMenu === 'cetak_spj' ? 'text-white font-medium bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Pengajuan SPJ</button>
                <button onClick={() => setActiveMenu('verifikasi_spj')} className={`w-full text-left py-2 px-3 rounded-md text-sm transition-colors ${activeMenu === 'verifikasi_spj' ? 'text-white font-medium bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Verifikasi dan Cetak</button>
              </div>
            )}
          </div>
          <div className="pt-2">
            <button onClick={() => { if(!sidebarOpen) setSidebarOpen(true); setExpandedMenu(expandedMenu === 'laporan' ? null : 'laporan'); }} className="w-full flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-white/5 group">
              <div className="flex items-center">
                <FileText size={20} style={{ color: activeMenu.startsWith('laporan_') ? theme.gold : '#9ca3af' }} className="shrink-0" />
                {sidebarOpen && <span className="ml-3 font-medium text-white">Laporan</span>}
              </div>
              {sidebarOpen && (expandedMenu === 'laporan' ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />)}
            </button>
            {sidebarOpen && expandedMenu === 'laporan' && (
              <div className="mt-1 ml-4 pl-4 border-l border-gray-700 space-y-1">
                <button onClick={() => setActiveMenu('laporan_rekap_gu')} className={`w-full text-left py-2 px-3 rounded-md text-sm transition-colors ${activeMenu === 'laporan_rekap_gu' ? 'text-white font-medium bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Rekapitulasi GU</button>
                <button onClick={() => setActiveMenu('laporan_coretax')} className={`w-full text-left py-2 px-3 rounded-md text-sm transition-colors ${activeMenu === 'laporan_coretax' ? 'text-white font-medium bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Laporan CoreTax</button>
                <button onClick={() => setActiveMenu('laporan_simdth')} className={`w-full text-left py-2 px-3 rounded-md text-sm transition-colors ${activeMenu === 'laporan_simdth' ? 'text-white font-medium bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Laporan SIMDTH</button>
              </div>
            )}
          </div>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white shadow-sm h-16 flex items-center px-8 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 capitalize">{activeMenu.replace(/_/g, ' ')}</h2>
          {isFetchingData && <span className="ml-4 text-sm text-gray-500 animate-pulse">(Sedang sinkronisasi data dengan Spreadsheet...)</span>}
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div key={activeMenu} className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
            {/* ROUTING KONTEN */}
            {activeMenu === 'dashboard' && <DashboardView programs={programs} kegiatans={kegiatans} subKegiatans={subKegiatans} rekenings={rekenings} realisasiGU={realisasiGU} />}
            
            {activeMenu === 'input_program' && <FormProgram onSave={handleSaveData} isLoading={isLoading} />}
            {activeMenu === 'input_kegiatan' && <FormKegiatan onSave={handleSaveData} isLoading={isLoading} programs={programs} />}
            {activeMenu === 'input_subkegiatan' && <FormSubKegiatan onSave={handleSaveData} isLoading={isLoading} kegiatans={kegiatans} />}
            {activeMenu === 'input_rekening' && <FormRekening onSave={handleSaveData} isLoading={isLoading} subKegiatans={subKegiatans} rekenings={rekenings} refreshData={fetchAllData} gasUrl={GAS_URL} setModal={setModal} showToast={showToast} />}
            
            {activeMenu === 'komparasi_anggaran' && <KomparasiAnggaran rekenings={rekenings} subKegiatans={subKegiatans} />}

            {activeMenu === 'wp_asn' && <FormPegawaiASN onSave={handleSaveData} isLoading={isLoading} />}
            {activeMenu === 'wp_pribadi' && <FormWPPribadi onSave={handleSaveData} isLoading={isLoading} />}
            {activeMenu === 'wp_pihakketiga' && <FormWPPihakKetiga onSave={handleSaveData} isLoading={isLoading} />}
            
            {activeMenu === 'realisasi_gu' && <FormRealisasiGU onSave={handleSaveData} isLoading={isLoading} subKegiatans={subKegiatans} rekenings={rekenings} realisasiGU={realisasiGU} setRealisasiGU={setRealisasiGU} pegawaiASN={pegawaiASN} wpPribadi={wpPribadi} wpPihakKetiga={wpPihakKetiga} showToast={showToast} kop21={kop21} kopUNI={kopUNI} />}
            {activeMenu === 'cetak_spj' && <FormCetakSPJ rekenings={rekenings} subKegiatans={subKegiatans} kegiatans={kegiatans} realisasiGU={realisasiGU} setRealisasiGU={setRealisasiGU} dataSPJ={dataSPJ} setDataSPJ={setDataSPJ} pegawaiASN={pegawaiASN} setPrintData={setPrintData} printedNotes={printedNotes} setPrintedNotes={setPrintedNotes} onUpdate={handleUpdateData} isLoading={isLoading} showToast={showToast} />}
            {activeMenu === 'verifikasi_spj' && <VerifikasiSPJ dataSPJ={dataSPJ} setDataSPJ={setDataSPJ} realisasiGU={realisasiGU} setRealisasiGU={setRealisasiGU} rekenings={rekenings} subKegiatans={subKegiatans} kegiatans={kegiatans} pegawaiASN={pegawaiASN} setPrintData={setPrintData} showToast={showToast} />}
            
            {activeMenu === 'laporan_rekap_gu' && <LaporanRekapGU realisasiGU={realisasiGU} rekenings={rekenings} subKegiatans={subKegiatans} />}
            {activeMenu === 'laporan_coretax' && <LaporanCoreTax realisasiGU={realisasiGU} />}
            {activeMenu === 'laporan_simdth' && <LaporanSIMDTH dataSPJ={dataSPJ} />}
          </div>
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