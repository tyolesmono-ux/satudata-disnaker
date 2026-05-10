import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Download, Upload, FileSpreadsheet, Table, Search, Trash2, Info, CheckSquare, Save, RefreshCw, Filter, Tag, Package, Calculator, Edit3, Copy, X, ChevronRight } from 'lucide-react';
import { FormContainer, InputField, SelectField, SearchableSelect } from './SharedUI';
import { theme } from '../config/constants';
import { formatRupiah } from '../utils/helpers';
import { useAppStore } from '../store/useAppStore';
import { GAS_URL } from '../config/constants';

// Reusable Form Card (consistent style)
const ModernFormCard = ({ children, title, icon: Icon, onSubmit, isSubmitting }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
    <div className="px-6 py-5 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white rounded-t-2xl">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-amber-100 rounded-lg">
          <Icon size={18} className="text-amber-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-800 font-['Roboto']">{title}</h2>
      </div>
    </div>
    <form onSubmit={onSubmit} className="p-6 space-y-6">
      {children}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
        </button>
      </div>
    </form>
  </div>
);

export const FormProgram = () => {
  const { handleSaveData, modal } = useAppStore();
  const isLoading = modal.show && modal.status === 'loading';
  const [formData, setFormData] = useState({ kode_program: '', nama_program: '' });
  const handleSubmit = async (e) => { e.preventDefault(); const success = await handleSaveData('Program', formData); if (success) setFormData({ kode_program: '', nama_program: '' }); };
  return (
    <div className="max-w-3xl mx-auto">
      <ModernFormCard title="Input Data Program" icon={FileSpreadsheet} onSubmit={handleSubmit} isSubmitting={isLoading}>
        <InputField label="Kode Program" value={formData.kode_program} onChange={e => setFormData({ ...formData, kode_program: e.target.value })} placeholder="Contoh: 1.01" required />
        <InputField label="Nama Program" value={formData.nama_program} onChange={e => setFormData({ ...formData, nama_program: e.target.value })} placeholder="Contoh: Program Penunjang..." required />
      </ModernFormCard>
    </div>
  );
};

export const FormKegiatan = () => {
  const { handleSaveData, modal, programs } = useAppStore();
  const isLoading = modal.show && modal.status === 'loading';
  const [formData, setFormData] = useState({ kode_program: '', kode_kegiatan: '', nama_kegiatan: '' });
  const handleSubmit = async (e) => { e.preventDefault(); const success = await handleSaveData('Kegiatan', formData); if (success) setFormData({ ...formData, kode_kegiatan: '', nama_kegiatan: '' }); };
  return (
    <div className="max-w-3xl mx-auto">
      <ModernFormCard title="Input Data Kegiatan" icon={FileSpreadsheet} onSubmit={handleSubmit} isSubmitting={isLoading}>
        <SelectField label="Pilih Program" value={formData.kode_program} onChange={e => setFormData({ ...formData, kode_program: e.target.value })} required>
          <option value="">-- Pilih Program --</option>
          {programs.map(p => <option key={p.kode_program} value={p.kode_program}>[{p.kode_program}] {p.nama_program}</option>)}
        </SelectField>
        <InputField label="Kode Kegiatan" value={formData.kode_kegiatan} onChange={e => setFormData({ ...formData, kode_kegiatan: e.target.value })} placeholder="Contoh: 1.01.01" required disabled={!formData.kode_program} />
        <InputField label="Nama Kegiatan" value={formData.nama_kegiatan} onChange={e => setFormData({ ...formData, nama_kegiatan: e.target.value })} required disabled={!formData.kode_program} />
      </ModernFormCard>
    </div>
  );
};

export const FormSubKegiatan = () => {
  const { handleSaveData, modal, kegiatans } = useAppStore();
  const isLoading = modal.show && modal.status === 'loading';
  const [formData, setFormData] = useState({ kode_kegiatan: '', kode_subkegiatan: '', nama_subkegiatan: '' });
  const handleSubmit = async (e) => { e.preventDefault(); const success = await handleSaveData('SubKegiatan', formData); if (success) setFormData({ ...formData, kode_subkegiatan: '', nama_subkegiatan: '' }); };
  return (
    <div className="max-w-3xl mx-auto">
      <ModernFormCard title="Input Data Sub Kegiatan" icon={FileSpreadsheet} onSubmit={handleSubmit} isSubmitting={isLoading}>
        <SelectField label="Pilih Kegiatan" value={formData.kode_kegiatan} onChange={e => setFormData({ ...formData, kode_kegiatan: e.target.value })} required>
          <option value="">-- Pilih Kegiatan --</option>
          {kegiatans.map(k => <option key={k.kode_kegiatan} value={k.kode_kegiatan}>[{k.kode_kegiatan}] {k.nama_kegiatan}</option>)}
        </SelectField>
        <InputField label="Kode Sub Kegiatan" value={formData.kode_subkegiatan} onChange={e => setFormData({ ...formData, kode_subkegiatan: e.target.value })} placeholder="Contoh: 1.01.01.2.01" required disabled={!formData.kode_kegiatan} />
        <InputField label="Nama Sub Kegiatan" value={formData.nama_subkegiatan} onChange={e => setFormData({ ...formData, nama_subkegiatan: e.target.value })} required disabled={!formData.kode_kegiatan} />
      </ModernFormCard>
    </div>
  );
};

export const FormRekening = () => {
  const { 
    handleSaveData, handleUpdateData, handleInitializePhase, modal, 
    subKegiatans, rekenings, standarharga, fetchAllData, setModal, 
    showToast, user, taggings, settings 
  } = useAppStore();
  const isLoading = modal.show && modal.status === 'loading';
  const [editItem, setEditItem] = useState(null);
  const [showInitPhase, setShowInitPhase] = useState(false);
  const [initPhaseData, setInitPhaseData] = useState({ source: 'APBD', target: 'Pergeseran 1', year: new Date().getFullYear().toString() });
  const koefisienRef = useRef(null);

  const [formData, setFormData] = useState({
    kode_subkegiatan: '',
    kode_rekening: '',
    nama_rekening: '',
    pagu: '',
    tahun_anggaran: settings.activeTahun,
    tahap_anggaran: settings.activeTahap,
    paket_belanja: '',
    keterangan_belanja: '',
    kode_barang: '',
    uraian_barang: '',
    spesifikasi: '',
    satuan: '',
    harga_satuan: '',
    koefisien_uraian: '',
    volume: ''
  });

  // Sync settings when they change (but only if not editing)
  React.useEffect(() => {
    if (!editItem) {
      setFormData(prev => ({
        ...prev,
        tahun_anggaran: settings.activeTahun,
        tahap_anggaran: settings.activeTahap
      }));
    }
  }, [settings, editItem]);

  const [rekeningOptions, setRekeningOptions] = useState([]);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const shsOptions = useMemo(() => {
    return standarharga.map(item => ({
      value: item.kode_barang,
      label: `[${item.kode_barang}] ${item.uraian_barang}`,
      sublabel: `${item.spesifikasi || '-'} | ${formatRupiah(item.harga_satuan)} / ${item.satuan}`,
      raw: item
    }));
  }, [standarharga]);

  const paketOptions = useMemo(() => {
    return taggings
      .filter(t => t.kategori === 'Paket')
      .map(t => ({ value: t.nama_tag, label: t.nama_tag }));
  }, [taggings]);

  const keteranganOptions = useMemo(() => {
    return taggings
      .filter(t => t.kategori === 'Keterangan')
      .map(t => ({ value: t.nama_tag, label: t.nama_tag }));
  }, [taggings]);

  const handleSelectSHS = (kodeBarang) => {
    const selected = standarharga.find(s => s.kode_barang === kodeBarang);
    if (selected) {
      const rekList = (selected.kode_rekening_list || '').split(',').map(s => s.trim()).filter(Boolean);
      setRekeningOptions(rekList);
      setFormData(prev => ({
        ...prev,
        kode_barang: selected.kode_barang,
        uraian_barang: selected.uraian_barang,
        spesifikasi: selected.spesifikasi,
        satuan: selected.satuan,
        harga_satuan: selected.harga_satuan,
        kode_rekening: prev.kode_rekening || rekList[0] || '',
        nama_rekening: prev.nama_rekening || selected.uraian_barang
      }));
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      if (koefisienRef.current) koefisienRef.current.focus();
    }, 500);
    setFormData({
      kode_subkegiatan: item.kode_subkegiatan,
      kode_rekening: item.kode_rekening,
      nama_rekening: item.nama_rekening,
      pagu: item.pagu,
      tahun_anggaran: item.tahun_anggaran,
      tahap_anggaran: item.tahap_anggaran,
      paket_belanja: item.paket_belanja,
      keterangan_belanja: item.keterangan_belanja,
      kode_barang: item.kode_barang,
      uraian_barang: item.uraian_barang,
      spesifikasi: item.spesifikasi,
      satuan: item.satuan,
      harga_satuan: item.harga_satuan,
      koefisien_uraian: item.koefisien_uraian,
      volume: item.volume
    });
    // Trigger shs logic to populate options
    if (item.kode_barang) {
      const selected = standarharga.find(s => s.kode_barang === item.kode_barang);
      if (selected) {
        const rekList = (selected.kode_rekening_list || '').split(',').map(s => s.trim()).filter(Boolean);
        setRekeningOptions(rekList);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditItem(null);
    setFormData({
      kode_subkegiatan: '', kode_rekening: '', nama_rekening: '', pagu: '',
      tahun_anggaran: settings.activeTahun, 
      tahap_anggaran: settings.activeTahap,
      paket_belanja: '', keterangan_belanja: '', kode_barang: '', uraian_barang: '',
      spesifikasi: '', satuan: '', harga_satuan: '', koefisien_uraian: '', volume: ''
    });
  };

  const onInitPhase = async () => {
    if (initPhaseData.source === initPhaseData.target) return showToast('Sumber dan Tujuan tahap tidak boleh sama', 'error');
    const success = await handleInitializePhase(initPhaseData.source, initPhaseData.target, initPhaseData.year);
    if (success) setShowInitPhase(false);
  };

  React.useEffect(() => {
    const vol = Number(formData.volume || 0);
    const price = Number(formData.harga_satuan || 0);
    setFormData(prev => ({ ...prev, pagu: vol * price }));
  }, [formData.volume, formData.harga_satuan]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Pastikan pagu terupdate dengan angka terbaru sebelum dikirim
    const currentVol = Number(formData.volume || 0);
    const currentPrice = Number(formData.harga_satuan || 0);
    const calculatedPagu = currentVol * currentPrice;
    const finalData = { ...formData, pagu: calculatedPagu };

    let success;
    if (editItem) {
      success = await handleUpdateData('Rekening', editItem.timestamp, finalData);
    } else {
      success = await handleSaveData('Rekening', finalData);
    }
    
    if (success) {
      setEditItem(null);
      setFormData({
        ...formData,
        tahun_anggaran: settings.activeTahun,
        tahap_anggaran: settings.activeTahap,
        kode_rekening: '',
        nama_rekening: '',
        pagu: 0,
        kode_barang: '',
        uraian_barang: '',
        spesifikasi: '',
        satuan: '',
        harga_satuan: 0,
        koefisien_uraian: '',
        volume: 0,
        keterangan_belanja: ''
      });
    }
  };

  const handleExportExcel = () => {
    if (!rekenings || rekenings.length === 0) return showToast('Tidak ada data untuk diexport', 'error');
    const data = rekenings.map(r => ({
      kode_subkegiatan: String(r.kode_subkegiatan || '').replace(/^'/, ''),
      kode_rekening: String(r.kode_rekening || '').replace(/^'/, ''),
      nama_rekening: r.nama_rekening,
      pagu: Number(r.pagu || 0),
      tahun_anggaran: String(r.tahun_anggaran),
      tahap_anggaran: r.tahap_anggaran,
      paket_belanja: r.paket_belanja || '',
      keterangan_belanja: r.keterangan_belanja || '',
      kode_barang: String(r.kode_barang || '').replace(/^'/, ''),
      uraian_barang: r.uraian_barang || '',
      spesifikasi: r.spesifikasi || '',
      satuan: r.satuan || '',
      harga_satuan: Number(r.harga_satuan || 0),
      koefisien_uraian: r.koefisien_uraian || '',
      volume: Number(r.volume || 0)
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kertas_Kerja");
    XLSX.writeFile(wb, `Kertas_Kerja_Anggaran_${new Date().getFullYear()}.xlsx`);
    showToast('Berhasil mengunduh kertas kerja!', 'success');
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws);
        if (jsonData.length === 0) throw new Error('File Excel kosong atau tidak valid.');
        setIsImporting(true);
        setImportProgress(0);
        const chunkSize = 20;
        const totalItems = jsonData.length;
        const totalChunks = Math.ceil(totalItems / chunkSize);
        let successCount = 0;
        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, totalItems);
          const chunk = jsonData.slice(start, end);
          const response = await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'import_kertas_kerja', payload: { items: chunk } }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
          });
          const result = await response.json();
          if (result.status !== 'success') throw new Error(`Gagal pada baris ${start + 1}-${end}: ${result.message}`);
          successCount += chunk.length;
          setImportProgress(Math.round(((i + 1) / totalChunks) * 100));
        }
        setModal({ show: true, status: 'success', message: `Berhasil mengimpor ${successCount} data anggaran secara bertahap!` });
        fetchAllData();
      } catch (error) {
        setModal({ show: true, status: 'error', message: `Gagal import: ${error.message}` });
      } finally {
        setIsImporting(false);
        setImportProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-['Roboto']">
      <ModernFormCard 
        title={editItem ? "Edit Rincian Anggaran" : "Penyusunan Rincian Anggaran"} 
        icon={editItem ? Edit3 : Calculator} 
        onSubmit={handleSubmit} 
        isSubmitting={isLoading}
      >
        {editItem && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex justify-between items-center animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <Info size={18} className="text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-900">Mode Edit Aktif</p>
                <p className="text-xs text-amber-700">Anda sedang mengubah data rekening terpilih.</p>
              </div>
            </div>
            <button onClick={handleCancelEdit} className="p-2 hover:bg-amber-100 rounded-full text-amber-800 transition-colors">
              <X size={18} />
            </button>
          </div>
        )}
        {/* I. Konfigurasi Dasar */}
        <div className="space-y-5">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">I. Konfigurasi Dasar</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-5 rounded-xl border border-gray-100">
            <SelectField label="Tahun Anggaran" value={formData.tahun_anggaran} onChange={e => setFormData({ ...formData, tahun_anggaran: e.target.value })} required disabled>
              <option value="2025">2025</option><option value="2026">2026</option><option value="2027">2027</option>
            </SelectField>
            <SelectField label="Tahap Anggaran" value={formData.tahap_anggaran} onChange={e => setFormData({ ...formData, tahap_anggaran: e.target.value })} required disabled>
              <option value="APBD">APBD</option><option value="Pergeseran 1">Pergeseran 1</option><option value="Pergeseran 2">Pergeseran 2</option><option value="Perubahan">Perubahan (PAK)</option>
            </SelectField>
          </div>
        </div>

        {/* II. Pemilihan Item Belanja */}
        <div className="space-y-5 pt-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">II. Pemilihan Item Belanja</h3>
          </div>
          <div className="space-y-6">
            <SearchableSelect
              label="Cari Sub Kegiatan"
              placeholder="Pilih sub kegiatan yang dituju..."
              options={subKegiatans.map(s => ({ value: s.kode_subkegiatan, label: `[${s.kode_subkegiatan}] ${s.nama_subkegiatan}` }))}
              value={formData.kode_subkegiatan}
              onChange={(val) => setFormData({ ...formData, kode_subkegiatan: val, kode_barang: '' })}
              required
            />
            <SearchableSelect
              label="Cari Barang (Standar Harga)"
              placeholder="Ketik nama barang atau kode SHS..."
              options={shsOptions}
              value={formData.kode_barang}
              onChange={handleSelectSHS}
              required
              disabled={!formData.kode_subkegiatan}
            />

            {formData.kode_barang && (
              <div className="p-6 bg-gray-50/70 rounded-2xl border border-gray-100 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 mb-5">
                  <Info size={18} className="text-amber-500" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Detail Standar Harga Terpilih</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Uraian Barang</p>
                      <p className="text-base font-bold text-gray-800">{formData.uraian_barang}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Spesifikasi</p>
                      <p className="text-sm text-gray-600">{formData.spesifikasi || '-'}</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="bg-white p-3 rounded-xl border shadow-sm flex-1">
                        <p className="text-gray-400 text-[9px] font-bold uppercase">Harga Satuan</p>
                        <p className="text-lg font-black text-gray-800">{formatRupiah(formData.harga_satuan)}</p>
                        <p className="text-[10px] text-gray-400">per {formData.satuan}</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border shadow-sm flex-1">
                        <p className="text-gray-400 text-[9px] font-bold uppercase">Kode Barang</p>
                        <code className="text-xs font-mono font-bold text-gray-700">{formData.kode_barang}</code>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2"><Tag size={14} className="text-amber-500" /> Pemetaan Rekening</p>
                    {rekeningOptions.length > 0 ? (
                      <SelectField label="Pilih Kode Rekening (dari SHS)" value={formData.kode_rekening} onChange={e => setFormData({ ...formData, kode_rekening: e.target.value })} required>
                        {rekeningOptions.map(rek => <option key={rek} value={rek}>{rek}</option>)}
                      </SelectField>
                    ) : (
                      <InputField label="Kode Rekening" value={formData.kode_rekening} onChange={e => setFormData({ ...formData, kode_rekening: e.target.value })} placeholder="Contoh: 5.1.02.01.01.0001" className="font-mono" />
                    )}
                    <InputField label="Nama Rekening (Uraian Belanja)" value={formData.nama_rekening} onChange={e => setFormData({ ...formData, nama_rekening: e.target.value })} placeholder="Masukkan nama rekening belanja..." className="font-semibold" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* III. Perhitungan & Klasifikasi */}
        <div className="space-y-5 pt-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">III. Perhitungan & Klasifikasi</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <InputField ref={koefisienRef} label="Koefisien (Keterangan)" value={formData.koefisien_uraian} onChange={e => setFormData({ ...formData, koefisien_uraian: e.target.value })} placeholder="Contoh: 2 Orang x 10 Hari" disabled={!formData.kode_barang} />
              <InputField label="Volume (Angka)" type="number" value={formData.volume} onChange={e => setFormData({ ...formData, volume: e.target.value })} placeholder="Contoh: 20" required disabled={!formData.kode_barang} />
            </div>
            <div className="space-y-4">
              <SearchableSelect label="Paket / Kelompok Belanja" placeholder="Pilih paket belanja..." options={paketOptions} value={formData.paket_belanja} onChange={(val) => setFormData({ ...formData, paket_belanja: val })} required disabled={!formData.kode_barang} />
              <SearchableSelect label="Keterangan Belanja (Tagging SPJ)" placeholder="Pilih keterangan tagging..." options={keteranganOptions} value={formData.keterangan_belanja} onChange={(val) => setFormData({ ...formData, keterangan_belanja: val })} required disabled={!formData.kode_barang} />
            </div>
          </div>
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-5 text-white shadow-lg mt-4">
            <p className="text-gray-300 text-[10px] font-bold uppercase tracking-wider mb-1">Total Pagu Anggaran</p>
            <p className="text-3xl font-black text-amber-400 tracking-tight">{formatRupiah(formData.pagu)}</p>
            <p className="text-[10px] text-gray-400 mt-2">* Terhitung otomatis berdasarkan Volume x Harga Satuan SHS</p>
          </div>
        </div>
      </ModernFormCard>

      {/* Initialize Phase Section (NEW) */}
      {user?.role === 'super_admin' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <Copy size={20} className="text-amber-600" />
              <h3 className="text-md font-bold text-gray-800">Inisiasi Tahap Anggaran Baru</h3>
            </div>
            {!showInitPhase ? (
              <button onClick={() => setShowInitPhase(true)} className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-bold hover:bg-amber-100 transition-all flex items-center gap-2">
                <Copy size={16} /> Mulai Inisiasi Tahap
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setShowInitPhase(false)} className="px-4 py-2 text-gray-500 text-sm font-bold hover:bg-gray-50 rounded-xl transition-all">Batal</button>
                <button onClick={onInitPhase} disabled={isLoading} className="px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-black transition-all flex items-center gap-2">
                  {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <CheckSquare size={14} />} Proses Copy Data
                </button>
              </div>
            )}
          </div>
          {showInitPhase && (
            <div className="p-6 bg-amber-50/30 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-300">
              <SelectField label="Dari Tahap (Sumber)" value={initPhaseData.source} onChange={e => setInitPhaseData({...initPhaseData, source: e.target.value})}>
                <option value="APBD">APBD</option><option value="Pergeseran 1">Pergeseran 1</option><option value="Pergeseran 2">Pergeseran 2</option>
              </SelectField>
              <SelectField label="Ke Tahap (Tujuan)" value={initPhaseData.target} onChange={e => setInitPhaseData({...initPhaseData, target: e.target.value})}>
                <option value="APBD">APBD</option><option value="Pergeseran 1">Pergeseran 1</option><option value="Pergeseran 2">Pergeseran 2</option><option value="Perubahan">Perubahan (PAK)</option>
              </SelectField>
              <SelectField label="Tahun" value={initPhaseData.year} onChange={e => setInitPhaseData({...initPhaseData, year: e.target.value})}>
                <option value="2025">2025</option><option value="2026">2026</option><option value="2027">2027</option>
              </SelectField>
              <div className="md:col-span-3">
                <p className="text-[10px] text-amber-700 bg-amber-100/50 p-2 rounded-lg border border-amber-200">
                  <strong>Info:</strong> Seluruh data rincian anggaran pada tahap sumber akan diduplikasi ke tahap tujuan. Gunakan ini saat ada perintah pergeseran anggaran baru.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mass Update Section (Super Admin only) */}
      {user?.role === 'super_admin' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-amber-600" />
              <h3 className="text-md font-bold text-gray-800">Upload Kertas Kerja Perubahan Anggaran</h3>
            </div>
            <div className="flex gap-3">
              <button onClick={handleExportExcel} disabled={isImporting} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all flex items-center gap-2">
                <Download size={16} /> Export Excel
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="px-5 py-2 bg-amber-500 text-gray-900 rounded-xl text-sm font-bold shadow-md hover:bg-amber-400 transition-all flex items-center gap-2">
                {isImporting ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                {isImporting ? 'Mengimport...' : 'Import Perubahan'}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />
            </div>
          </div>
          {isImporting && (
            <div className="p-5 border-t">
              <div className="flex justify-between text-sm mb-2"><span className="font-bold">Progres Impor</span><span className="font-bold text-amber-600">{importProgress}%</span></div>
              <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full transition-all duration-500" style={{ width: `${importProgress}%` }}></div></div>
              <p className="text-[10px] text-gray-400 mt-2 text-center">Mohon jangan menutup halaman ini sampai proses selesai...</p>
            </div>
          )}
        </div>
      )}

      {/* Rekening Table */}
      <RekeningTable onEdit={handleEdit} />
    </div>
  );
};

export const RekeningTable = ({ onEdit }) => {
  const { rekenings, settings, subKegiatans } = useAppStore();
  const data = useMemo(() => 
    rekenings.filter(r => String(r.tahun_anggaran) === String(settings.activeTahun) && String(r.tahap_anggaran) === String(settings.activeTahap)),
    [rekenings, settings]
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSub, setFilterSub] = useState('');

  const availableSubInTable = useMemo(() => {
    const codes = new Set(data.map(r => r.kode_subkegiatan));
    return subKegiatans.filter(s => codes.has(s.kode_subkegiatan));
  }, [data, subKegiatans]);

  const filtered = useMemo(() => {
    return data.filter(item => {
      const matchSearch = (
        (item.nama_rekening || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.kode_rekening || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.uraian_barang || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchSub = filterSub ? item.kode_subkegiatan === filterSub : true;
      return matchSearch && matchSub;
    });
  }, [data, searchTerm, filterSub]);

  const totalFilteredPagu = useMemo(() => 
    filtered.reduce((sum, item) => sum + Number(item.pagu || 0), 0),
    [filtered]
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* HEADER SECTION - REORGANIZED TO SEPARATE ROWS */}
      <div className="p-6 space-y-4 bg-gradient-to-b from-gray-50/50 to-white">
        {/* Row 1: Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg text-white">
              <Table size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-800 tracking-tight">Daftar Rekening &amp; Pagu</h3>
              <p className="text-xs text-gray-400 font-medium">Menampilkan {filtered.length} dari {data.length} rincian</p>
            </div>
          </div>
        </div>

        {/* Row 2: Sub-Kegiatan Filter */}
        <div className="relative">
          <SearchableSelect 
            placeholder="Semua Sub Kegiatan (Tanpa Filter)"
            options={availableSubInTable.map(s => ({ 
              value: s.kode_subkegiatan, 
              label: `[${s.kode_subkegiatan}] ${s.nama_subkegiatan}` 
            }))}
            value={filterSub}
            onChange={setFilterSub}
          />
        </div>

        {/* Row 3: Search Field */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Ketik kode rekening, nama rincian, atau sub kegiatan untuk mencari..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto max-h-[600px]">
        <table className="w-full text-sm font-['Roboto']">
          <thead className="bg-gray-900 text-white sticky top-0 z-20">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest">Barang / Rincian</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest">Kode Rekening</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest">Koefisien</th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest">Pagu</th>
              <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest">Tahap</th>
              <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest w-20">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-20 text-center">
                <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                  <Search size={48} className="opacity-10" />
                  <p className="font-medium">Data rincian tidak ditemukan</p>
                </div>
              </td></tr>
            ) : filtered.map((r, i) => (
              <tr key={i} className="hover:bg-amber-50/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-800 text-sm leading-tight">{r.uraian_barang || r.nama_rekening}</div>
                  <div className="text-[10px] text-gray-400 mt-1 font-medium italic">{r.paket_belanja || '-'}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-mono text-xs font-bold text-gray-600 tracking-tighter">{String(r.kode_rekening || '').replace(/^'/, '')}</div>
                  <div className="text-[10px] text-amber-600 font-bold mt-0.5">{String(r.kode_subkegiatan || '').replace(/^'/, '')}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-700 font-medium">{r.koefisien_uraian || `${r.volume} ${r.satuan}`}</div>
                  <div className="text-[10px] text-gray-400 font-medium">{formatRupiah(r.harga_satuan)} / {r.satuan}</div>
                </td>
                <td className="px-6 py-4 text-right font-black text-gray-900 tabular-nums text-base">{formatRupiah(r.pagu)}</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-gray-200">
                    {r.tahap_anggaran}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => onEdit(r)}
                    className="p-2.5 bg-white text-amber-600 border border-amber-100 rounded-xl hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all shadow-sm active:scale-95"
                    title="Edit Item"
                  >
                    <Edit3 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER SUMMARY SECTION */}
      <div className="px-8 py-6 bg-gray-900 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-gray-400 text-sm">
          <span className="font-bold text-white">{filtered.length}</span> item rincian anggaran ditampilkan
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Total Pagu Terfilter</p>
            <p className="text-2xl font-black text-white tracking-tight leading-none">
              {formatRupiah(totalFilteredPagu)}
            </p>
          </div>
          <div className="p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/20">
            <Calculator size={24} className="text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};