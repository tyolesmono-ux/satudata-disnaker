import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Download, Upload, FileSpreadsheet, Table, Search, ShieldCheck, Tag, Info, RefreshCw, AlertCircle } from 'lucide-react';
import { InputField } from '../components/SharedUI';
import { theme } from '../config/constants';
import { formatRupiah } from '../utils/helpers';
import { useAppStore } from '../store/useAppStore';
import { GAS_URL } from '../config/constants';

const ModernCard = ({ children, title, icon: Icon, description }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
    <div className="px-6 py-5 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-amber-100 rounded-lg">
          <Icon size={18} className="text-amber-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800 font-['Roboto']">{title}</h2>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

export default function StandarHarga() {
  const { handleSaveData, modal, standarharga, fetchAllData, setModal, showToast, user } = useAppStore();
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

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
              action: 'batch_insert',
              sheet: 'StandarHarga',
              payload: { items: chunk },
              token: localStorage.getItem('satuData_token')
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-0 space-y-8 font-['Roboto'] pb-12">
      <ModernCard title="Database Standar Harga (SHS)" icon={ShieldCheck} description="Impor data SHS terbaru dari file Excel untuk sinkronisasi rincian belanja">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-sm text-gray-500">
            <p>Total data tersimpan: <span className="font-bold text-gray-800">{standarharga.length}</span> item</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-gray-900 rounded-xl font-bold shadow-md hover:bg-amber-400 transition-all disabled:opacity-50"
            >
              {isImporting ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
              {isImporting ? 'Mengimport...' : 'Import Excel SHS'}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />
          </div>
        </div>
        {isImporting && (
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex justify-between text-sm mb-2 font-bold"><span>Progres Impor SHS</span><span className="text-amber-600">{importProgress}%</span></div>
            <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full transition-all duration-500" style={{ width: `${importProgress}%` }}></div></div>
            <p className="text-[10px] text-gray-400 mt-2">Mohon tunggu, jangan tutup halaman...</p>
          </div>
        )}
      </ModernCard>

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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
      <div className="px-6 py-5 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Table size={20} className="text-amber-600" />
          <h3 className="text-lg font-bold text-gray-800">Daftar Standar Harga</h3>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Cari kode atau nama barang..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all" />
        </div>
      </div>
      <div className="overflow-x-auto max-h-[600px]">
        <table className="w-full text-sm font-['Roboto']">
          <thead className="bg-gray-900 text-white sticky top-0">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Kode Barang</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Uraian Barang</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Satuan</th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Harga Satuan</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Mapping Rekening</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2"><AlertCircle size={28} className="opacity-50" /><p className="text-sm">Data SHS belum tersedia. Silakan import file Excel terlebih dahulu.</p></div>
                </td>
              </tr>
            ) : (
              filtered.slice(0, 200).map((r, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-[11px] text-gray-500">{r.kode_barang}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-800">{r.uraian_barang}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{r.spesifikasi}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{r.satuan}</td>
                  <td className="px-6 py-4 text-right font-black text-gray-800 tabular-nums">{formatRupiah(r.harga_satuan)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(r.kode_rekening_list || '').split(',').slice(0, 3).map((code, idx) => (
                        <span key={idx} className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">{code.trim()}</span>
                      ))}
                      {(r.kode_rekening_list || '').split(',').length > 3 && <span className="text-[9px] text-gray-400">+{r.kode_rekening_list.split(',').length - 3}</span>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {filtered.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/30 text-right">
          <p className="text-[10px] text-gray-400">Menampilkan {Math.min(filtered.length, 200)} dari {filtered.length} data</p>
        </div>
      )}
    </div>
  );
}