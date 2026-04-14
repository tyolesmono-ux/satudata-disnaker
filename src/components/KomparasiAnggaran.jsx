import React, { useState, useMemo } from 'react';
import { BarChart, TrendingUp, TrendingDown, ArrowRightLeft, Info, HelpCircle } from 'lucide-react';
import { SelectField } from './SharedUI';
import { formatRupiah } from '../utils/helpers';
import { theme } from '../config/constants';

export const KomparasiAnggaran = ({ rekenings, subKegiatans }) => {
  const currentYear = new Date().getFullYear().toString();
  const [tahunAnggaran, setTahunAnggaran] = useState(new Date().getFullYear().toString());
  const [tahapAwal, setTahapAwal] = useState('APBD');
  const [tahapAkhir, setTahapAkhir] = useState('Pergeseran 1');

  // Dapatkan daftar tahap unik dari data
  const availableTahun = useMemo(() => {
    const years = new Set((rekenings || []).map(r => String(r.tahun_anggaran)).filter(Boolean));
    const sorted = Array.from(years).sort((a, b) => b - a);
    return sorted.length > 0 ? sorted : [new Date().getFullYear().toString()];
  }, [rekenings]);

  const availableTahap = useMemo(() => {
    const tahaps = new Set((rekenings || []).map(r => r.tahap_anggaran).filter(Boolean));
    if (tahaps.size === 0) return ['APBD', 'Pergeseran 1', 'Pergeseran 2', 'Perubahan'];
    
    const order = ['APBD', 'Pergeseran 1', 'Pergeseran 2', 'Perubahan'];
    return Array.from(tahaps).sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }, [rekenings]);

  const { dataKomparasi, summary } = useMemo(() => {
    // a. Filter berdasarkan tahun
    const filteredRekenings = (rekenings || []).filter(r => String(r.tahun_anggaran) === tahunAnggaran);

    // Persiapkan Helper Nama Sub Kegiatan
    const mapSubKegiatan = new Map();
    (subKegiatans || []).forEach(s => {
      mapSubKegiatan.set(String(s.kode_subkegiatan), s.nama_subkegiatan);
    });

    const mapData = new Map();

    // b & c. Kelompokkan data dan hitung pagu
    filteredRekenings.forEach(r => {
      const kodeSub = String(r.kode_subkegiatan || '').replace(/^'/, '');
      const kodeRek = String(r.kode_rekening || '').replace(/^'/, '');
      if (!kodeSub || !kodeRek) return;

      const key = `${kodeSub}-${kodeRek}`;
      
      if (!mapData.has(key)) {
        mapData.set(key, {
          kode_subkegiatan: kodeSub,
          nama_subkegiatan: mapSubKegiatan.get(kodeSub) || 'Unknown Sub Kegiatan',
          kode_rekening: kodeRek,
          nama_rekening: r.nama_rekening,
          paguInduk: 0,
          paguPerubahan: 0
        });
      }

      const item = mapData.get(key);
      const val = Number(r.pagu) || 0;

      if (r.tahap_anggaran === tahapAwal) {
        item.paguInduk += val;
      } else if (r.tahap_anggaran === tahapAkhir) {
        item.paguPerubahan += val;
      }
    });

    let totalInduk = 0;
    let totalPerubahan = 0;
    const finalData = [];

    // d, e, f, & g. Hitung selisih, tentukan status, dan filter
    mapData.forEach(item => {
      totalInduk += item.paguInduk;
      totalPerubahan += item.paguPerubahan;

      const selisih = item.paguPerubahan - item.paguInduk;
      let status = '';

      if (item.paguInduk === 0 && item.paguPerubahan > 0) {
        status = 'Rekening Baru';
      } else if (selisih > 0) {
        status = 'Bertambah';
      } else if (selisih < 0) {
        status = 'Berkurang / Efisiensi';
      } else {
        status = 'Tetap';
      }

      if (status !== 'Tetap') {
        finalData.push({ ...item, selisih, status });
      }
    });

    // Urutkan berdasarkan Sub Kegiatan, lalu Kode Rekening
    finalData.sort((a, b) => {
      if (a.kode_subkegiatan === b.kode_subkegiatan) {
        return a.kode_rekening.localeCompare(b.kode_rekening);
      }
      return a.kode_subkegiatan.localeCompare(b.kode_subkegiatan);
    });

    const sum = {
      totalInduk,
      totalPerubahan,
      defisitSurplus: totalPerubahan - totalInduk
    };

    return { dataKomparasi: finalData, summary: sum };
  }, [rekenings, subKegiatans, tahunAnggaran, tahapAwal, tahapAkhir]);

  // Render Status Badge
  const renderBadge = (status) => {
    switch (status) {
      case 'Rekening Baru':
      case 'Bertambah':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded flex items-center gap-1 w-max"><TrendingUp size={14} /> {status}</span>;
      case 'Berkurang / Efisiensi':
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded flex items-center gap-1 w-max"><TrendingDown size={14} /> {status}</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded w-max">{status}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* Header & Filter */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-[#0A192F]">
            <BarChart className="text-[#D4AF37]" size={24} /> Analisis Pergeseran Anggaran
          </h2>
          <p className="text-sm text-gray-500 mt-1 flex flex-wrap gap-1 items-center">
            Membandingkan Pagu <span className="px-2 py-0.5 bg-gray-100 rounded-md font-bold">{tahapAwal}</span> melawan <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold">{tahapAkhir}</span>
          </p>
        </div>
        <div className="w-full justify-end flex flex-col md:flex-row gap-2">
          <SelectField label="Komparasi Awal" value={tahapAwal} onChange={e => setTahapAwal(e.target.value)}>
            {availableTahap.map(t => <option key={t} value={t}>{t}</option>)}
          </SelectField>
          <div className="flex items-center justify-center pt-6 px-1 hidden md:flex">
             <ArrowRightLeft className="text-gray-300" size={16} />
          </div>
          <SelectField label="Komparasi Akhir" value={tahapAkhir} onChange={e => setTahapAkhir(e.target.value)}>
            {availableTahap.map(t => <option key={t} value={t}>{t}</option>)}
          </SelectField>
          <SelectField label="Filter Tahun" value={tahunAnggaran} onChange={e => setTahunAnggaran(e.target.value)}>
            {availableTahun.map(y => <option key={y} value={y}>{y}</option>)}
          </SelectField>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -translate-y-8 translate-x-8 group-hover:bg-blue-100 transition-colors duration-500"></div>
          <p className="text-sm font-semibold text-gray-500 relative z-10">Total Pagu: {tahapAwal}</p>
          <p className="text-2xl font-black text-[#0A192F] mt-1 relative z-10">{formatRupiah(summary.totalInduk)}</p>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/10 rounded-full -translate-y-8 translate-x-8 group-hover:bg-[#D4AF37]/20 transition-colors duration-500"></div>
          <p className="text-sm font-semibold text-gray-500 relative z-10">Total Pagu: {tahapAkhir}</p>
          <p className="text-2xl font-black text-[#D4AF37] mt-1 relative z-10">{formatRupiah(summary.totalPerubahan)}</p>
        </div>

        <div className={`p-5 rounded-2xl shadow-sm border relative overflow-hidden group ${summary.defisitSurplus > 0 ? 'bg-red-50 border-red-100' : summary.defisitSurplus < 0 ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 rounded-full -translate-y-8 translate-x-8 group-hover:bg-white/60 transition-colors duration-500"></div>
          <p className={`text-sm font-semibold relative z-10 ${summary.defisitSurplus > 0 ? 'text-red-700' : summary.defisitSurplus < 0 ? 'text-green-700' : 'text-gray-500'}`}>
            <span className="flex items-center gap-1">
              <ArrowRightLeft size={16} /> Total Defisit / Surplus Pergeseran
            </span>
          </p>
          <p className={`text-2xl font-black mt-1 relative z-10 ${summary.defisitSurplus > 0 ? 'text-red-600' : summary.defisitSurplus < 0 ? 'text-green-600' : 'text-gray-600'}`}>
            {summary.defisitSurplus > 0 ? '+' : ''}{formatRupiah(summary.defisitSurplus)}
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
          <h3 className="font-bold text-[#0A192F]">Detail Rekening yang Berubah</h3>
          <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
            Ditemukan {dataKomparasi.length} perubahan
          </span>
        </div>
        
        {dataKomparasi.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
             <HelpCircle className="mx-auto mb-3 text-gray-300" size={48} />
             <p className="font-semibold text-lg">Tidak ada pergeseran</p>
             <p className="text-sm">Semua pagu masih bernilai Tetap atau tidak ada data pada tahap yang sedang dibandingkan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
            <table className="w-full text-sm text-left border-separate border-spacing-0">
              <thead className="bg-[#0A192F] text-white sticky top-0 z-10">
                <tr>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px] w-64 border-b border-white/10">Sub Kegiatan</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">Kode & Nama Rekening</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px] text-right border-b border-white/10">Pagu Awal (Rp)</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px] text-right border-b border-white/10">Pagu Akhir (Rp)</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px] text-right border-b border-white/10">Selisih (Rp)</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dataKomparasi.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 align-top">
                      <div className="font-mono text-xs text-blue-600 font-bold mb-1">{item.kode_subkegiatan}</div>
                      <div className="text-xs text-gray-600 line-clamp-2" title={item.nama_subkegiatan}>{item.nama_subkegiatan}</div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-mono text-xs text-gray-500 mb-1">{item.kode_rekening}</div>
                      <div className="font-semibold text-[#0A192F]">{item.nama_rekening}</div>
                    </td>
                    <td className="p-4 text-right align-top tabular-nums text-gray-500">
                      {formatRupiah(item.paguInduk)}
                    </td>
                    <td className="p-4 text-right align-top tabular-nums font-semibold text-[#D4AF37]">
                      {formatRupiah(item.paguPerubahan)}
                    </td>
                    <td className={`p-4 text-right align-top tabular-nums font-bold ${item.selisih > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                      {item.selisih > 0 ? '+' : ''}{formatRupiah(item.selisih)}
                    </td>
                    <td className="p-4 align-top">
                      {renderBadge(item.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
