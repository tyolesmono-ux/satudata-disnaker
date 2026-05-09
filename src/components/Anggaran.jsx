import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Download, Upload, FileSpreadsheet, Table, Search, Trash2, Info, CheckSquare, Save, RefreshCw, Filter, Tag, Package, Calculator } from 'lucide-react';
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
        kode_rekening: rekList[0] || '',
        nama_rekening: selected.uraian_barang
      }));
    }
  };

  React.useEffect(() => {
    const vol = Number(formData.volume || 0);
    const price = Number(formData.harga_satuan || 0);
    setFormData(prev => ({ ...prev, pagu: vol * price }));
  }, [formData.volume, formData.harga_satuan]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await handleSaveData('Rekening', formData);
    if (success) setFormData({
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
      <ModernFormCard title="Penyusunan Rincian Anggaran" icon={Calculator} onSubmit={handleSubmit} isSubmitting={isLoading}>
        {/* I. Konfigurasi Dasar */}
        <div className="space-y-5">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">I. Konfigurasi Dasar</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-5 rounded-xl border border-gray-100">
            <SelectField label="Tahun Anggaran" value={formData.tahun_anggaran} onChange={e => setFormData({ ...formData, tahun_anggaran: e.target.value })} required>
              <option value="2025">2025</option><option value="2026">2026</option><option value="2027">2027</option>
            </SelectField>
            <SelectField label="Tahap Anggaran" value={formData.tahap_anggaran} onChange={e => setFormData({ ...formData, tahap_anggaran: e.target.value })} required>
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
              <InputField label="Koefisien (Keterangan)" value={formData.koefisien_uraian} onChange={e => setFormData({ ...formData, koefisien_uraian: e.target.value })} placeholder="Contoh: 2 Orang x 10 Hari" disabled={!formData.kode_barang} />
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

      {/* Mass Update Section (Super Admin only) */}
      {user?.role === 'super_admin' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-amber-600" />
              <h3 className="text-md font-bold text-gray-800">Mass Update Kertas Kerja</h3>
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
      <div className="px-6 py-5 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Table size={20} className="text-amber-600" />
            <h3 className="text-lg font-bold text-gray-800">Daftar Rekening &amp; Pagu</h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Total {data.length} item rekening terdaftar</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Cari kode atau nama..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all" />
        </div>
      </div>
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-sm font-['Roboto']">
          <thead className="bg-gray-900 text-white sticky top-0">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Barang / Rincian</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Kode Rekening</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Koefisien</th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Pagu</th>
              <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Tahap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">Data tidak ditemukan.</td></tr>
            ) : filtered.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-800 text-sm">{r.uraian_barang || r.nama_rekening}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{r.paket_belanja || '-'}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-mono text-xs font-bold text-gray-700">{String(r.kode_rekening || '').replace(/^'/, '')}</div>
                  <div className="text-[10px] text-gray-400">{String(r.kode_subkegiatan || '').replace(/^'/, '')}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-700">{r.koefisien_uraian || `${r.volume} ${r.satuan}`}</div>
                  <div className="text-[10px] text-gray-400">{formatRupiah(r.harga_satuan)} / {r.satuan}</div>
                </td>
                <td className="px-6 py-4 text-right font-black text-gray-800 tabular-nums">{formatRupiah(r.pagu)}</td>
                <td className="px-6 py-4 text-center"><span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase">{r.tahap_anggaran}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};