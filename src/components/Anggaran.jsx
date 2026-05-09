import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Download, Upload, FileSpreadsheet, Table, Search, Trash2, Info, CheckSquare } from 'lucide-react';
import { FormContainer, InputField, SelectField, SearchableSelect } from './SharedUI';
import { theme } from '../config/constants';
import { formatRupiah } from '../utils/helpers';
import { useAppStore } from '../store/useAppStore';
import { GAS_URL } from '../config/constants';

export const FormProgram = () => {
  const { handleSaveData, modal } = useAppStore();
  const isLoading = modal.show && modal.status === 'loading';
  const [formData, setFormData] = useState({ kode_program: '', nama_program: '' });
  const handleSubmit = async (e) => { e.preventDefault(); const success = await handleSaveData('Program', formData); if(success) setFormData({ kode_program: '', nama_program: '' }); };
  return (
    <FormContainer title="Input Data Program" onSubmit={handleSubmit} isSubmitting={isLoading}>
      <InputField label="Kode Program" value={formData.kode_program} onChange={e => setFormData({...formData, kode_program: e.target.value})} placeholder="Contoh: 1.01" required />
      <InputField label="Nama Program" value={formData.nama_program} onChange={e => setFormData({...formData, nama_program: e.target.value})} placeholder="Contoh: Program Penunjang..." required />
    </FormContainer>
  );
};

export const FormKegiatan = () => {
  const { handleSaveData, modal, programs } = useAppStore();
  const isLoading = modal.show && modal.status === 'loading';
  const [formData, setFormData] = useState({ kode_program: '', kode_kegiatan: '', nama_kegiatan: '' });
  const handleSubmit = async (e) => { e.preventDefault(); const success = await handleSaveData('Kegiatan', formData); if(success) setFormData({ ...formData, kode_kegiatan: '', nama_kegiatan: '' }); };
  return (
    <FormContainer title="Input Data Kegiatan" onSubmit={handleSubmit} isSubmitting={isLoading}>
      <SelectField label="Pilih Program" value={formData.kode_program} onChange={e => setFormData({...formData, kode_program: e.target.value})} required>
        <option value="">-- Pilih Program --</option>
        {programs.map(p => <option key={p.kode_program} value={p.kode_program}>[{p.kode_program}] {p.nama_program}</option>)}
      </SelectField>
      <InputField label="Kode Kegiatan" value={formData.kode_kegiatan} onChange={e => setFormData({...formData, kode_kegiatan: e.target.value})} placeholder="Contoh: 1.01.01" required disabled={!formData.kode_program} />
      <InputField label="Nama Kegiatan" value={formData.nama_kegiatan} onChange={e => setFormData({...formData, nama_kegiatan: e.target.value})} required disabled={!formData.kode_program} />
    </FormContainer>
  );
};

export const FormSubKegiatan = () => {
  const { handleSaveData, modal, kegiatans } = useAppStore();
  const isLoading = modal.show && modal.status === 'loading';
  const [formData, setFormData] = useState({ kode_kegiatan: '', kode_subkegiatan: '', nama_subkegiatan: '' });
  const handleSubmit = async (e) => { e.preventDefault(); const success = await handleSaveData('SubKegiatan', formData); if(success) setFormData({ ...formData, kode_subkegiatan: '', nama_subkegiatan: '' }); };
  return (
    <FormContainer title="Input Data Sub Kegiatan" onSubmit={handleSubmit} isSubmitting={isLoading}>
      <SelectField label="Pilih Kegiatan" value={formData.kode_kegiatan} onChange={e => setFormData({...formData, kode_kegiatan: e.target.value})} required>
        <option value="">-- Pilih Kegiatan --</option>
        {kegiatans.map(k => <option key={k.kode_kegiatan} value={k.kode_kegiatan}>[{k.kode_kegiatan}] {k.nama_kegiatan}</option>)}
      </SelectField>
      <InputField label="Kode Sub Kegiatan" value={formData.kode_subkegiatan} onChange={e => setFormData({...formData, kode_subkegiatan: e.target.value})} placeholder="Contoh: 1.01.01.2.01" required disabled={!formData.kode_kegiatan} />
      <InputField label="Nama Sub Kegiatan" value={formData.nama_subkegiatan} onChange={e => setFormData({...formData, nama_subkegiatan: e.target.value})} required disabled={!formData.kode_kegiatan} />
    </FormContainer>
  );
};

export const FormRekening = () => {
  const { handleSaveData, modal, subKegiatans, rekenings, standarharga, fetchAllData, setModal, showToast, user, taggings } = useAppStore();
  const isLoading = modal.show && modal.status === 'loading';
  
  const [formData, setFormData] = useState({ 
    kode_subkegiatan: '', 
    kode_rekening: '', 
    nama_rekening: '', 
    pagu: '', 
    tahun_anggaran: new Date().getFullYear().toString(), 
    tahap_anggaran: 'APBD',
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

  const [rekeningOptions, setRekeningOptions] = useState([]);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);
  
  // Options untuk SearchableSelect Barang SHS
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

  // Handle saat barang SHS dipilih
  const handleSelectSHS = (kodeBarang) => {
    const selected = standarharga.find(s => s.kode_barang === kodeBarang);
    if (selected) {
      // Pecah list kode rekening dari database SHS
      const rekList = (selected.kode_rekening_list || '').split(',').map(s => s.trim()).filter(Boolean);
      setRekeningOptions(rekList);
      
      setFormData(prev => ({
        ...prev,
        kode_barang: selected.kode_barang,
        uraian_barang: selected.uraian_barang,
        spesifikasi: selected.spesifikasi,
        satuan: selected.satuan,
        harga_satuan: selected.harga_satuan,
        kode_rekening: rekList[0] || '',
        nama_rekening: selected.uraian_barang
      }));
    }
  };

  // Kalkulasi Pagu otomatis saat Volume atau Harga Satuan berubah
  React.useEffect(() => {
    const vol = Number(formData.volume || 0);
    const price = Number(formData.harga_satuan || 0);
    setFormData(prev => ({ ...prev, pagu: vol * price }));
  }, [formData.volume, formData.harga_satuan]);

  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    const success = await handleSaveData('Rekening', formData); 
    if(success) setFormData({ 
      ...formData, 
      kode_rekening: '', 
      nama_rekening: '', 
      pagu: '', 
      kode_barang: '', 
      uraian_barang: '', 
      spesifikasi: '', 
      satuan: '', 
      harga_satuan: '', 
      koefisien_uraian: '', 
      volume: '',
      keterangan_belanja: ''
    }); 
  };

  const handleExportExcel = () => {
    if (!rekenings || rekenings.length === 0) return showToast('Tidak ada data untuk diexport', 'error');
    
    // Siapkan data untuk diexport
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
      };
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-12 pb-20">
      <FormContainer title="Penyusunan Rincian Anggaran" onSubmit={handleSubmit} isSubmitting={isLoading}>
        
        {/* SECTION 1: KONFIGURASI DASAR */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <div className="w-1.5 h-6 bg-[#D4AF37] rounded-full"></div>
            <h4 className="text-sm font-black text-[#0A192F] uppercase tracking-widest">I. Konfigurasi Dasar</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
            <SelectField label="Tahun Anggaran" value={formData.tahun_anggaran} onChange={e => setFormData({...formData, tahun_anggaran: e.target.value})} required>
              <option value="2025">2025</option><option value="2026">2026</option><option value="2027">2027</option>
            </SelectField>
            <SelectField label="Tahap Anggaran" value={formData.tahap_anggaran} onChange={e => setFormData({...formData, tahap_anggaran: e.target.value})} required>
              <option value="APBD">APBD</option><option value="Pergeseran 1">Pergeseran 1</option><option value="Pergeseran 2">Pergeseran 2</option><option value="Perubahan">Perubahan (PAK)</option>
            </SelectField>
          </div>
        </div>

        {/* SECTION 2: PEMILIHAN SUB KEGIATAN & BARANG */}
        <div className="space-y-8 pt-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <div className="w-1.5 h-6 bg-[#D4AF37] rounded-full"></div>
            <h4 className="text-sm font-black text-[#0A192F] uppercase tracking-widest">II. Pemilihan Item Belanja</h4>
          </div>
          
          <div className="space-y-8">
            <SearchableSelect 
              label="Cari Sub Kegiatan" 
              placeholder="Pilih sub kegiatan yang dituju..."
              options={subKegiatans.map(s => ({ value: s.kode_subkegiatan, label: `[${s.kode_subkegiatan}] ${s.nama_subkegiatan}` }))}
              value={formData.kode_subkegiatan}
              onChange={(val) => setFormData({...formData, kode_subkegiatan: val, kode_barang: ''})}
              required
            />

            <SearchableSelect 
              label="Cari Barang (SHS)" 
              placeholder="Ketik nama barang atau kode SHS..."
              options={shsOptions}
              value={formData.kode_barang}
              onChange={handleSelectSHS}
              required
              disabled={!formData.kode_subkegiatan}
            />

            {formData.kode_barang && (
              <div className="p-8 bg-[#0A192F]/[0.02] rounded-3xl border border-[#0A192F]/10 animate-in zoom-in-95 duration-500 relative group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#0A192F] rounded-l-3xl"></div>
                
                <h5 className="text-[11px] font-black text-[#0A192F] uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                  <Info size={18} className="text-[#D4AF37]" /> Detail Standar Harga Terpilih
                </h5>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-5 space-y-8 border-r border-gray-200 pr-6">
                    <div>
                      <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest mb-2">Uraian / Spesifikasi SHS</p>
                      <p className="text-base font-bold text-[#0A192F] leading-relaxed">{formData.uraian_barang}</p>
                      <div className="text-xs text-gray-500 italic mt-3 leading-relaxed bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        {formData.spesifikasi || 'Tidak ada spesifikasi khusus'}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm min-w-[140px]">
                        <p className="text-gray-400 text-[9px] uppercase font-black mb-1">Harga Satuan</p>
                        <p className="text-lg font-black text-[#0A192F]">{formatRupiah(formData.harga_satuan)}</p>
                        <p className="text-[10px] text-gray-400 font-bold">per {formData.satuan}</p>
                      </div>
                      <div className="flex-1 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                         <p className="text-gray-400 text-[9px] uppercase font-black mb-1 tracking-widest">Kode Barang</p>
                         <code className="text-[11px] text-[#0A192F] font-mono font-black break-all">{formData.kode_barang}</code>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-8">
                    <p className="text-[#0A192F] text-[11px] font-black uppercase tracking-widest flex items-center gap-3">
                       <Table size={16} className="text-[#D4AF37]" /> Pemetaan Rekening Belanja
                    </p>
                    
                    <div className="grid grid-cols-1 gap-6">
                      {rekeningOptions.length > 0 ? (
                        <SelectField 
                          label="PILIH KODE REKENING (DARI SHS)" 
                          value={formData.kode_rekening} 
                          onChange={e => setFormData({...formData, kode_rekening: e.target.value})}
                          required
                        >
                          {rekeningOptions.map(rek => (
                            <option key={rek} value={rek}>{rek}</option>
                          ))}
                        </SelectField>
                      ) : (
                        <InputField 
                          label="KODE REKENING" 
                          value={formData.kode_rekening} 
                          onChange={e => setFormData({...formData, kode_rekening: e.target.value})} 
                          placeholder="Contoh: 5.1.02.01.01.0001"
                          className="!bg-white font-mono font-bold"
                        />
                      )}
                      
                      <InputField 
                        label="NAMA REKENING (URAIAN BELANJA)" 
                        value={formData.nama_rekening} 
                        onChange={e => setFormData({...formData, nama_rekening: e.target.value})} 
                        placeholder="Masukkan nama rekening belanja..."
                        className="!bg-white font-bold text-[#0A192F]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: PERHITUNGAN & TAGGING */}
        <div className="space-y-8 pt-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <div className="w-1.5 h-6 bg-[#D4AF37] rounded-full"></div>
            <h4 className="text-sm font-black text-[#0A192F] uppercase tracking-widest">III. Perhitungan & Klasifikasi</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputField label="Koefisien (Keterangan)" value={formData.koefisien_uraian} onChange={e => setFormData({...formData, koefisien_uraian: e.target.value})} placeholder="Contoh: 2 Orang x 10 Hari" disabled={!formData.kode_barang} />
              <InputField label="Volume (Angka)" type="number" value={formData.volume} onChange={e => setFormData({...formData, volume: e.target.value})} placeholder="Contoh: 20" required disabled={!formData.kode_barang} />
              
              <SearchableSelect 
                label="Paket / Kelompok Belanja" 
                placeholder="Pilih paket belanja..."
                options={paketOptions}
                value={formData.paket_belanja}
                onChange={(val) => setFormData({...formData, paket_belanja: val})}
                required
                disabled={!formData.kode_barang}
              />
              <SearchableSelect 
                label="Keterangan Belanja (Tagging SPJ)" 
                placeholder="Pilih keterangan tagging..."
                options={keteranganOptions}
                value={formData.keterangan_belanja}
                onChange={(val) => setFormData({...formData, keterangan_belanja: val})}
                required
                disabled={!formData.kode_barang}
              />
            </div>
            
            <div className="md:col-span-4 bg-[#0A192F] p-8 rounded-3xl shadow-2xl shadow-[#0A192F]/20 relative overflow-hidden group min-h-[160px] flex flex-col justify-center">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full -translate-y-16 translate-x-16 blur-3xl"></div>
               <p className="text-gray-400 text-[10px] uppercase font-black tracking-[0.2em] mb-2 relative z-10">Total Pagu Anggaran</p>
               <p className="text-3xl font-black text-[#D4AF37] relative z-10 tracking-tight">{formatRupiah(formData.pagu)}</p>
               <div className="mt-4 pt-4 border-t border-white/10 relative z-10">
                 <p className="text-[10px] text-gray-500 italic leading-tight">Terhitung otomatis berdasarkan Volume x Harga Satuan SHS</p>
               </div>
            </div>
          </div>
        </div>
      </FormContainer>

      {/* SECTION EXPORT/IMPORT - Hanya untuk Super Admin */}
      {user?.role === 'super_admin' && (
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-[#0A192F] rounded-2xl shadow-xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full -translate-y-16 translate-x-16 blur-3xl group-hover:bg-[#D4AF37]/20 transition-all duration-700"></div>
          <div className="relative">
            <h4 className="text-white font-bold text-lg flex items-center gap-2">
              <FileSpreadsheet className="text-[#D4AF37]" size={22} /> Mass Update Kertas Kerja
            </h4>
            <p className="text-gray-400 text-xs mt-1">Gunakan file Excel (.xlsx) untuk mengupdate banyak pagu sekaligus.</p>
          </div>
          <div className="flex gap-3 relative">
            <button 
              type="button"
              onClick={handleExportExcel}
              disabled={isImporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition-all duration-300 hover:-translate-y-1 active:scale-95 text-sm font-semibold disabled:opacity-50"
            >
              <Download size={16} className="text-[#D4AF37]" /> Export Excel
            </button>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#D4AF37] hover:bg-[#b8952b] text-[#0A192F] rounded-xl shadow-lg shadow-[#D4AF37]/20 transition-all duration-300 hover:-translate-y-1 active:scale-95 text-sm font-black disabled:opacity-50"
            >
              {isImporting ? <div className="w-4 h-4 border-2 border-[#0A192F]/30 border-t-[#0A192F] rounded-full animate-spin mr-1"></div> : <Upload size={16} />} 
              {isImporting ? 'Mengimport...' : 'Import Perubahan'}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />
          </div>
        </div>

        {isImporting && (
          <div className="p-4 bg-white border rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-[#0A192F]">Progres Impor Data Anggaran</span>
              <span className="text-sm font-black text-[#D4AF37]">{importProgress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-[#D4AF37] h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(212,175,55,0.4)]"
                style={{ width: `${importProgress}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 italic text-center">Mohon jangan menutup halaman ini sampai proses selesai...</p>
          </div>
        )}
      </div>
      )}

      <RekeningTable />
    </div>
  );
};

export const RekeningTable = () => {
  const { rekenings } = useAppStore();
  const data = rekenings;
  const [searchTerm, setSearchTerm] = useState('');
  
  const filtered = useMemo(() => {
    if (!searchTerm) return data;
    const kw = searchTerm.toLowerCase();
    return data.filter(r => 
      String(r.kode_rekening).toLowerCase().includes(kw) || 
      String(r.nama_rekening).toLowerCase().includes(kw) ||
      String(r.kode_subkegiatan).toLowerCase().includes(kw)
    );
  }, [data, searchTerm]);

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700" style={{ borderColor: theme.borderGray }}>
      <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
        <div>
          <h3 className="text-lg font-bold text-[#0A192F] flex items-center gap-2">
            <Table size={20} className="text-[#D4AF37]" /> Daftar Rekening & Pagu
          </h3>
          <p className="text-xs text-gray-500 mt-1">Total {data.length} item rekening terdaftar</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Cari kode atau nama..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border rounded-lg text-sm focus:ring-4 focus:ring-[#D4AF37]/20 focus:border-[#0A192F] outline-none w-full md:w-64 transition-all"
          />
        </div>
      </div>
      <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
        <table className="w-full text-sm text-left border-separate border-spacing-0">
          <thead className="bg-[#0A192F] sticky top-0 z-10">
            <tr>
              <th className="p-4 font-bold text-white border-b border-white/10 uppercase tracking-tighter text-[10px]">Barang / Rincian</th>
              <th className="p-4 font-bold text-white border-b border-white/10 uppercase tracking-tighter text-[10px]">Kode Rekening</th>
              <th className="p-4 font-bold text-white border-b border-white/10 uppercase tracking-tighter text-[10px]">Koefisien</th>
              <th className="p-4 font-bold text-white border-b border-white/10 uppercase tracking-tighter text-[10px] text-right">Pagu</th>
              <th className="p-4 font-bold text-white border-b border-white/10 uppercase tracking-tighter text-[10px] text-center">Tahap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan="5" className="p-10 text-center text-gray-400 italic">Data tidak ditemukan dalam database atau filter saat ini.</td></tr>
            ) : filtered.map((r, i) => (
              <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                <td className="p-4">
                   <div className="text-[#0A192F] font-bold text-xs">{r.uraian_barang || r.nama_rekening}</div>
                   <div className="text-[10px] text-gray-400 mt-0.5">{r.paket_belanja || '-'}</div>
                </td>
                <td className="p-4">
                  <div className="font-bold text-[#0A192F] text-xs">{String(r.kode_rekening || '').replace(/^'/, '')}</div>
                  <div className="text-[10px] text-gray-400 truncate max-w-[150px]">{String(r.kode_subkegiatan || '').replace(/^'/, '')}</div>
                </td>
                <td className="p-4">
                  <div className="text-xs text-gray-600">{r.koefisien_uraian || `${r.volume} ${r.satuan}`}</div>
                  <div className="text-[10px] text-gray-400">{formatRupiah(r.harga_satuan)} / {r.satuan}</div>
                </td>
                <td className="p-4 text-right font-black text-[#0A192F] tabular-nums whitespace-nowrap">{formatRupiah(r.pagu)}</td>
                <td className="p-4 text-center">
                  <div className="inline-block text-[9px] font-black px-2 py-1 bg-gray-100 rounded text-gray-500 uppercase tracking-tighter whitespace-nowrap">
                    {r.tahap_anggaran}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};