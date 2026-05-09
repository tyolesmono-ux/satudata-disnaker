import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Download, Upload, FileSpreadsheet, Table, Search, ShieldCheck, Tag, Info } from 'lucide-react';
import { FormContainer, InputField, SelectField, SearchableSelect } from '../components/SharedUI';
import { theme } from '../config/constants';
import { formatRupiah } from '../utils/helpers';
import { useAppStore } from '../store/useAppStore';
import { GAS_URL } from '../config/constants';

export default function StandarHarga() {
  const { handleSaveData, modal, standarharga, fetchAllData, setModal, showToast, user } = useAppStore();
  const isLoading = modal.show && modal.status === 'loading';
  
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  // State untuk form mapping / pengetesan mapping
  const [selectedItem, setSelectedItem] = useState(null);
  const [mappingData, setMappingData] = useState({
    kode_barang: '',
    kode_rekening_terpilih: ''
  });

  // Opsi untuk SearchableSelect barang
  const itemOptions = useMemo(() => {
    return (standarharga || []).map(item => ({
      value: item.id_standar_harga || item.kode_barang,
      label: `[${item.kode_barang}] ${item.uraian_barang}`,
      fullData: item
    }));
  }, [standarharga]);

  // Opsi Kode Rekening hasil pecah string koma
  const rekeningOptions = useMemo(() => {
    if (!selectedItem) return [];
    const listStr = selectedItem.kode_rekening_list || '';
    // Pecah berdasarkan koma, bersihkan spasi, dan hapus jika kosong
    return listStr.split(',').map(s => s.trim()).filter(Boolean).map(code => ({
      value: code,
      label: code
    }));
  }, [selectedItem]);

  const handleSelectItem = (val) => {
    const item = itemOptions.find(opt => opt.value === val);
    if (item) {
      setSelectedItem(item.fullData);
      setMappingData({
        kode_barang: item.fullData.kode_barang,
        kode_rekening_terpilih: ''
      });
    } else {
      setSelectedItem(null);
      setMappingData({ kode_barang: '', kode_rekening_terpilih: '' });
    }
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
        
        // Map excel headers ke backend fields (10 Kolom)
        const mappedItems = jsonData.map(row => ({
          kode_kelompok_barang: row['KODE KELOMPOK BARANG'] || '',
          uraian_kelompok_barang: row['URAIAN KELOMPOK BARANG'] || '',
          id_standar_harga: row['ID STANDAR HARGA'] || '',
          kode_barang: row['KODE BARANG'] || '',
          uraian_barang: row['URAIAN BARANG'] || '',
          spesifikasi: row['SPESIFIKASI'] || '',
          satuan: row['SATUAN'] || '',
          harga_satuan: row['HARGA SATUAN'] || 0,
          kode_rekening_list: row['KODE REKENING'] || '',
          jenis_standar_harga: row['JENIS STANDAR HARGA'] || ''
        }));

        const chunkSize = 25;
        const totalItems = mappedItems.length;
        const totalChunks = Math.ceil(totalItems / chunkSize);
        let successCount = 0;

        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, totalItems);
          const chunk = mappedItems.slice(start, end);

          const response = await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({ 
              action: 'batch_insert', // Gunakan batch insert generik jika tersedia, atau insert biasa
              sheet: 'StandarHarga',
              payload: { items: chunk },
              token: localStorage.getItem('satuData_token') // Pastikan token dikirim
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
          });

          const result = await response.json();
          if (result.status !== 'success') throw new Error(`Gagal pada baris ${start + 1}-${end}: ${result.message}`);
          
          successCount += chunk.length;
          setImportProgress(Math.round(((i + 1) / totalChunks) * 100));
        }

        setModal({ show: true, status: 'success', message: `Berhasil mengimpor ${successCount} data Standar Harga!` });
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
    <div className="space-y-8 pb-20">
      {/* SECTION IMPORT SHS */}
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-[#0A192F] rounded-2xl shadow-xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full -translate-y-24 translate-x-24 blur-3xl group-hover:bg-[#D4AF37]/20 transition-all duration-700"></div>
          <div className="relative">
            <h4 className="text-white font-bold text-xl flex items-center gap-2">
              <ShieldCheck className="text-[#D4AF37]" size={24} /> Database Standar Harga (SHS)
            </h4>
            <p className="text-gray-400 text-sm mt-1">Impor data SHS terbaru dari file Excel untuk sinkronisasi rincian belanja.</p>
          </div>
          <div className="flex gap-3 relative">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="flex items-center gap-2 px-8 py-3 bg-[#D4AF37] hover:bg-[#b8952b] text-[#0A192F] rounded-xl shadow-lg shadow-[#D4AF37]/20 transition-all duration-300 hover:-translate-y-1 active:scale-95 text-sm font-black disabled:opacity-50"
            >
              {isImporting ? <div className="w-4 h-4 border-2 border-[#0A192F]/30 border-t-[#0A192F] rounded-full animate-spin mr-1"></div> : <Upload size={18} />} 
              {isImporting ? 'Mengimport...' : 'Import Excel SHS'}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />
          </div>
        </div>

        {isImporting && (
          <div className="mt-4 p-4 bg-white border rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-[#0A192F]">Progres Impor SHS</span>
              <span className="text-sm font-black text-[#D4AF37]">{importProgress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-[#D4AF37] h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(212,175,55,0.4)]"
                style={{ width: `${importProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* TABEL DATA SHS */}
      <SHSTable data={standarharga} />
    </div>
  );
}

function SHSTable({ data }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filtered = useMemo(() => {
    const kw = searchTerm.toLowerCase();
    return (data || []).filter(r => 
      String(r.uraian_barang).toLowerCase().includes(kw) || 
      String(r.kode_barang).toLowerCase().includes(kw)
    );
  }, [data, searchTerm]);

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border overflow-hidden animate-in fade-in" style={{ borderColor: theme.borderGray }}>
      <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
        <h3 className="text-lg font-bold text-[#0A192F] flex items-center gap-2">
          <Table size={20} className="text-[#D4AF37]" /> Daftar Standar Harga
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Cari nama barang..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border rounded-lg text-sm focus:ring-4 focus:ring-[#D4AF37]/20 outline-none w-full md:w-64"
          />
        </div>
      </div>
      <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
        <table className="w-full text-sm text-left border-separate border-spacing-0">
          <thead className="bg-[#0A192F] sticky top-0 z-10">
            <tr>
              <th className="p-4 font-bold text-white border-b border-white/10 text-[10px] uppercase">Kode Barang</th>
              <th className="p-4 font-bold text-white border-b border-white/10 text-[10px] uppercase">Uraian Barang</th>
              <th className="p-4 font-bold text-white border-b border-white/10 text-[10px] uppercase">Satuan</th>
              <th className="p-4 font-bold text-white border-b border-white/10 text-[10px] uppercase text-right">Harga Satuan</th>
              <th className="p-4 font-bold text-white border-b border-white/10 text-[10px] uppercase">Mapping Rekening</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan="5" className="p-10 text-center text-gray-400 italic">Data SHS belum tersedia. Silakan import file Excel.</td></tr>
            ) : filtered.slice(0, 100).map((r, i) => ( // Batasi display awal untuk performa
              <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                <td className="p-4 font-mono text-[11px] text-gray-500">{r.kode_barang}</td>
                <td className="p-4">
                  <p className="font-bold text-[#0A192F]">{r.uraian_barang}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{r.spesifikasi}</p>
                </td>
                <td className="p-4 text-gray-600">{r.satuan}</td>
                <td className="p-4 text-right font-black text-[#0A192F]">{formatRupiah(r.harga_satuan)}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {(r.kode_rekening_list || '').split(',').map((code, idx) => (
                      <span key={idx} className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                        {code.trim()}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
