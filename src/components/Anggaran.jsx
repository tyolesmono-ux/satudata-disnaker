// File: src/components/Anggaran.jsx

import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Download, Upload, FileSpreadsheet, Table, Search, Trash2 } from 'lucide-react';
import { FormContainer, InputField, SelectField } from './SharedUI';
import { theme } from '../config/constants';
import { formatRupiah } from '../utils/helpers';


export const FormProgram = ({ onSave, isLoading }) => {
  const [formData, setFormData] = useState({ kode_program: '', nama_program: '' });
  const handleSubmit = async (e) => { e.preventDefault(); const success = await onSave('Program', formData); if(success) setFormData({ kode_program: '', nama_program: '' }); };
  return (
    <FormContainer title="Input Data Program" onSubmit={handleSubmit} isSubmitting={isLoading}>
      <InputField label="Kode Program" value={formData.kode_program} onChange={e => setFormData({...formData, kode_program: e.target.value})} placeholder="Contoh: 1.01" required />
      <InputField label="Nama Program" value={formData.nama_program} onChange={e => setFormData({...formData, nama_program: e.target.value})} placeholder="Contoh: Program Penunjang..." required />
    </FormContainer>
  );
};

export const FormKegiatan = ({ onSave, isLoading, programs }) => {
  const [formData, setFormData] = useState({ kode_program: '', kode_kegiatan: '', nama_kegiatan: '' });
  const handleSubmit = async (e) => { e.preventDefault(); const success = await onSave('Kegiatan', formData); if(success) setFormData({ ...formData, kode_kegiatan: '', nama_kegiatan: '' }); };
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

export const FormSubKegiatan = ({ onSave, isLoading, kegiatans }) => {
  const [formData, setFormData] = useState({ kode_kegiatan: '', kode_subkegiatan: '', nama_subkegiatan: '' });
  const handleSubmit = async (e) => { e.preventDefault(); const success = await onSave('SubKegiatan', formData); if(success) setFormData({ ...formData, kode_subkegiatan: '', nama_subkegiatan: '' }); };
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

export const FormRekening = ({ onSave, isLoading, subKegiatans, rekenings, refreshData, gasUrl, setModal, showToast }) => {
  const [formData, setFormData] = useState({ kode_subkegiatan: '', kode_rekening: '', nama_rekening: '', pagu: '', tahun_anggaran: new Date().getFullYear().toString(), tahap_anggaran: 'Induk' });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);
  
  const masterRekening = useMemo(() => {
    const unique = []; const map = new Map();
    rekenings.forEach(item => { if (item.kode_rekening && !map.has(item.kode_rekening)) { map.set(item.kode_rekening, true); unique.push({ kode_rekening: item.kode_rekening, nama_rekening: item.nama_rekening }); } });
    return unique;
  }, [rekenings]);

  const filteredSuggestions = useMemo(() => {
    if (!formData.kode_rekening) return []; const kw = String(formData.kode_rekening).toLowerCase();
    return masterRekening.filter(item => String(item.kode_rekening).toLowerCase().includes(kw) || String(item.nama_rekening).toLowerCase().includes(kw));
  }, [formData.kode_rekening, masterRekening]);

  const handleSubmit = async (e) => { e.preventDefault(); const success = await onSave('Rekening', formData); if(success) setFormData({ ...formData, kode_rekening: '', nama_rekening: '', pagu: '' }); };

  const handleExportExcel = () => {
    if (!rekenings || rekenings.length === 0) return showToast('Tidak ada data untuk diexport', 'error');
    
    // Siapkan data untuk diexport
    const data = rekenings.map(r => ({
      kode_subkegiatan: String(r.kode_subkegiatan || '').replace(/^'/, ''),
      kode_rekening: String(r.kode_rekening || '').replace(/^'/, ''),
      nama_rekening: r.nama_rekening,
      pagu: Number(r.pagu || 0),
      tahun_anggaran: String(r.tahun_anggaran),
      tahap_anggaran: r.tahap_anggaran
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

          const response = await fetch(gasUrl, {
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
        if (refreshData) refreshData();
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
    <div className="space-y-8">
      <FormContainer title="Input Data Rekening (Pagu)" onSubmit={handleSubmit} isSubmitting={isLoading}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2 p-4 rounded-lg bg-gray-50 border" style={{ borderColor: theme.borderGray }}>
          <SelectField label="Tahun Anggaran" value={formData.tahun_anggaran} onChange={e => setFormData({...formData, tahun_anggaran: e.target.value})} required>
            <option value="2025">2025</option><option value="2026">2026</option><option value="2027">2027</option>
          </SelectField>
          <SelectField label="Tahap Anggaran" value={formData.tahap_anggaran} onChange={e => setFormData({...formData, tahap_anggaran: e.target.value})} required>
            <option value="Induk">Induk (Murni)</option><option value="Pergeseran 1">Pergeseran 1</option><option value="Perubahan">Perubahan (PAK)</option>
          </SelectField>
        </div>
        <SelectField label="Pilih Sub Kegiatan" value={formData.kode_subkegiatan} onChange={e => setFormData({...formData, kode_subkegiatan: e.target.value})} required>
          <option value="">-- Pilih Sub Kegiatan --</option>
          {subKegiatans.map(s => <option key={s.kode_subkegiatan} value={s.kode_subkegiatan}>[{s.kode_subkegiatan}] {s.nama_subkegiatan}</option>)}
        </SelectField>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <InputField label="Kode / Cari Rekening" value={formData.kode_rekening} onChange={e => { setFormData({...formData, kode_rekening: e.target.value}); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} placeholder="Ketik 5.1... atau 'Belanja...'" required disabled={!formData.kode_subkegiatan} autoComplete="off" />
            {showSuggestions && filteredSuggestions.length > 0 && formData.kode_subkegiatan && (
              <ul className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-auto">
                {filteredSuggestions.map((s, idx) => (
                  <li key={idx} onClick={() => { setFormData({...formData, kode_rekening: s.kode_rekening, nama_rekening: s.nama_rekening}); setShowSuggestions(false); }} className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b text-sm">
                    <span className="font-bold">{s.kode_rekening}</span> <br/> <span className="text-gray-500">{s.nama_rekening}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <InputField label="Pagu Anggaran (Rp)" type="number" value={formData.pagu} onChange={e => setFormData({...formData, pagu: e.target.value})} required disabled={!formData.kode_subkegiatan} />
        </div>
        <InputField label="Nama Rekening (Uraian)" value={formData.nama_rekening} onChange={e => setFormData({...formData, nama_rekening: e.target.value})} required disabled={!formData.kode_subkegiatan} />
      </FormContainer>

      {/* SECTION EXPORT/IMPORT */}
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

      <RekeningTable data={rekenings} />
    </div>
  );
};

export const RekeningTable = ({ data }) => {
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
              <th className="p-4 font-bold text-white border-b border-white/10 uppercase tracking-tighter text-[10px]">Sub Kegiatan</th>
              <th className="p-4 font-bold text-white border-b border-white/10 uppercase tracking-tighter text-[10px]">Kode Rekening</th>
              <th className="p-4 font-bold text-white border-b border-white/10 uppercase tracking-tighter text-[10px]">Nama Rekening</th>
              <th className="p-4 font-bold text-white border-b border-white/10 uppercase tracking-tighter text-[10px] text-right">Pagu Anggaran</th>
              <th className="p-4 font-bold text-white border-b border-white/10 uppercase tracking-tighter text-[10px] text-center">Tahun/Tahap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan="5" className="p-10 text-center text-gray-400 italic">Data tidak ditemukan dalam database atau filter saat ini.</td></tr>
            ) : filtered.map((r, i) => (
              <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                <td className="p-4 font-mono text-[11px] text-gray-400 group-hover:text-gray-600 transition-colors">{String(r.kode_subkegiatan || '').replace(/^'/, '')}</td>
                <td className="p-4 font-bold text-[#0A192F]">{String(r.kode_rekening || '').replace(/^'/, '')}</td>
                <td className="p-4 text-gray-600 text-xs leading-relaxed">{r.nama_rekening}</td>
                <td className="p-4 text-right font-black text-[#0A192F] tabular-nums whitespace-nowrap">{formatRupiah(r.pagu)}</td>
                <td className="p-4 text-center">
                  <div className="inline-block text-[9px] font-black px-2 py-1 bg-gray-100 rounded text-gray-500 uppercase tracking-tighter whitespace-nowrap">
                    {r.tahun_anggaran} | {r.tahap_anggaran}
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