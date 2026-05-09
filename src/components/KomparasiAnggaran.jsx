import React, { useState, useMemo } from 'react';
import { BarChart, TrendingUp, TrendingDown, ArrowRightLeft, HelpCircle, Filter, AlertCircle } from 'lucide-react';
import { SelectField } from './SharedUI';
import { formatRupiah } from '../utils/helpers';
import { theme } from '../config/constants';
import { useAppStore } from '../store/useAppStore';

// Modern Summary Card Component (reused style)
const SummaryCard = ({ title, value, icon: Icon, color, subValue }) => {
  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', iconBg: 'bg-blue-100' },
    gold: { bg: 'bg-amber-50', text: 'text-amber-600', iconBg: 'bg-amber-100' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', iconBg: 'bg-emerald-100' },
    red: { bg: 'bg-rose-50', text: 'text-rose-600', iconBg: 'bg-rose-100' },
    gray: { bg: 'bg-gray-50', text: 'text-gray-600', iconBg: 'bg-gray-100' }
  };
  const styles = colorMap[color] || colorMap.gray;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-1 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${styles.iconBg} transition-all duration-300 group-hover:scale-110`}>
          <Icon size={22} className={styles.text} />
        </div>
        {subValue && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{subValue}</span>}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1 font-['Roboto']">{title}</p>
        <p className={`text-2xl font-black ${styles.text} tracking-tight`}>{value}</p>
      </div>
    </div>
  );
};

// Badge untuk status perubahan
const StatusBadge = ({ status }) => {
  const config = {
    'Rekening Baru': { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <TrendingUp size={12} /> },
    'Bertambah': { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <TrendingUp size={12} /> },
    'Berkurang / Efisiensi': { bg: 'bg-orange-100', text: 'text-orange-700', icon: <TrendingDown size={12} /> },
    'Tetap': { bg: 'bg-gray-100', text: 'text-gray-600', icon: null }
  };
  const { bg, text, icon } = config[status] || config.Tetap;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${bg} ${text}`}>
      {icon}
      {status === 'Berkurang / Efisiensi' ? 'Berkurang' : status}
    </span>
  );
};

export const KomparasiAnggaran = () => {
  const { rekenings, subKegiatans } = useAppStore();
  const [tahunAnggaran, setTahunAnggaran] = useState(new Date().getFullYear().toString());
  const [tahapAwal, setTahapAwal] = useState('APBD');
  const [tahapAkhir, setTahapAkhir] = useState('Pergeseran 1');

  // Dapatkan daftar tahun unik dari data
  const availableTahun = useMemo(() => {
    const years = new Set((rekenings || []).map(r => String(r.tahun_anggaran)).filter(Boolean));
    const sorted = Array.from(years).sort((a, b) => b - a);
    return sorted.length > 0 ? sorted : [new Date().getFullYear().toString()];
  }, [rekenings]);

  // Daftar tahap yang tersedia
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
    const filteredRekenings = (rekenings || []).filter(r => String(r.tahun_anggaran) === tahunAnggaran);

    // Map sub kegiatan
    const mapSubKegiatan = new Map();
    (subKegiatans || []).forEach(s => {
      mapSubKegiatan.set(String(s.kode_subkegiatan), s.nama_subkegiatan);
    });

    const mapData = new Map();

    filteredRekenings.forEach(r => {
      const kodeSub = String(r.kode_subkegiatan || '').replace(/^'/, '');
      const kodeRek = String(r.kode_rekening || '').replace(/^'/, '');
      if (!kodeSub || !kodeRek) return;

      const key = `${kodeSub}-${kodeRek}`;
      if (!mapData.has(key)) {
        mapData.set(key, {
          kode_subkegiatan: kodeSub,
          nama_subkegiatan: mapSubKegiatan.get(kodeSub) || 'Sub Kegiatan Tidak Dikenal',
          kode_rekening: kodeRek,
          nama_rekening: r.nama_rekening,
          paguInduk: 0,
          paguPerubahan: 0
        });
      }

      const item = mapData.get(key);
      const val = Number(r.pagu) || 0;
      if (r.tahap_anggaran === tahapAwal) item.paguInduk += val;
      else if (r.tahap_anggaran === tahapAkhir) item.paguPerubahan += val;
    });

    let totalInduk = 0, totalPerubahan = 0;
    const finalData = [];

    mapData.forEach(item => {
      totalInduk += item.paguInduk;
      totalPerubahan += item.paguPerubahan;

      const selisih = item.paguPerubahan - item.paguInduk;
      let status = '';
      if (item.paguInduk === 0 && item.paguPerubahan > 0) status = 'Rekening Baru';
      else if (selisih > 0) status = 'Bertambah';
      else if (selisih < 0) status = 'Berkurang / Efisiensi';
      else status = 'Tetap';

      if (status !== 'Tetap') {
        finalData.push({ ...item, selisih, status });
      }
    });

    finalData.sort((a, b) => {
      if (a.kode_subkegiatan === b.kode_subkegiatan) {
        return a.kode_rekening.localeCompare(b.kode_rekening);
      }
      return a.kode_subkegiatan.localeCompare(b.kode_subkegiatan);
    });

    return {
      dataKomparasi: finalData,
      summary: {
        totalInduk,
        totalPerubahan,
        defisitSurplus: totalPerubahan - totalInduk
      }
    };
  }, [rekenings, subKegiatans, tahunAnggaran, tahapAwal, tahapAkhir]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-lg">
              <BarChart size={24} className="text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight font-['Roboto']">
              Analisis Pergeseran Anggaran
            </h1>
          </div>
          <p className="text-gray-500 text-sm ml-14 font-['Roboto']">
            Membandingkan pagu antar tahapan anggaran untuk melihat perubahan dan efisiensi
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
        <div className="px-6 py-4 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider font-['Roboto']">Filter Analisis</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SelectField
              label="Tahun Anggaran"
              value={tahunAnggaran}
              onChange={e => setTahunAnggaran(e.target.value)}
              className="font-['Roboto']"
            >
              {availableTahun.map(y => <option key={y} value={y}>{y}</option>)}
            </SelectField>
            <SelectField
              label="Tahap Awal (Pagu Induk)"
              value={tahapAwal}
              onChange={e => setTahapAwal(e.target.value)}
            >
              {availableTahap.map(t => <option key={t} value={t}>{t}</option>)}
            </SelectField>
            <SelectField
              label="Tahap Akhir (Pagu Banding)"
              value={tahapAkhir}
              onChange={e => setTahapAkhir(e.target.value)}
            >
              {availableTahap.map(t => <option key={t} value={t}>{t}</option>)}
            </SelectField>
            <div className="flex items-end">
              <div className="w-full bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Perbandingan</p>
                <p className="text-sm font-bold text-gray-700 mt-1">{tahapAwal} → {tahapAkhir}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <SummaryCard
          title={`Total Pagu: ${tahapAwal}`}
          value={formatRupiah(summary.totalInduk)}
          icon={BarChart}
          color="blue"
          subValue="Anggaran Awal"
        />
        <SummaryCard
          title={`Total Pagu: ${tahapAkhir}`}
          value={formatRupiah(summary.totalPerubahan)}
          icon={TrendingUp}
          color="gold"
          subValue="Anggaran Akhir"
        />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-1 group">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl ${summary.defisitSurplus > 0 ? 'bg-emerald-100' : summary.defisitSurplus < 0 ? 'bg-rose-100' : 'bg-gray-100'} transition-all duration-300 group-hover:scale-110`}>
              {summary.defisitSurplus > 0 ? <TrendingUp size={22} className="text-emerald-600" /> : summary.defisitSurplus < 0 ? <TrendingDown size={22} className="text-rose-600" /> : <ArrowRightLeft size={22} className="text-gray-500" />}
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Net Perubahan</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1 font-['Roboto']">
              {summary.defisitSurplus > 0 ? 'Anggaran Bertambah' : summary.defisitSurplus < 0 ? 'Anggaran Berkurang' : 'Tidak Ada Perubahan'}
            </p>
            <p className={`text-2xl font-black tracking-tight ${summary.defisitSurplus > 0 ? 'text-emerald-600' : summary.defisitSurplus < 0 ? 'text-rose-600' : 'text-gray-500'}`}>
              {summary.defisitSurplus !== 0 && (summary.defisitSurplus > 0 ? '+' : '')}{formatRupiah(summary.defisitSurplus)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabel Detail Perubahan */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="px-6 py-4 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-700 font-['Roboto']">Detail Rekening yang Mengalami Perubahan</h3>
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">
              {dataKomparasi.length} item
            </span>
          </div>
          <p className="text-[11px] text-gray-400">Hanya menampilkan rekening dengan perubahan nilai</p>
        </div>

        {dataKomparasi.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex flex-col items-center justify-center text-gray-400">
              <HelpCircle size={48} className="mb-3 opacity-50" />
              <p className="text-base font-semibold text-gray-500 font-['Roboto']">Tidak Ada Perubahan</p>
              <p className="text-sm text-gray-400 mt-1">Semua pagu masih tetap atau data tidak tersedia pada tahap yang dipilih.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-['Roboto']">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Sub Kegiatan</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Rekening</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Pagu Awal</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Pagu Akhir</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Selisih</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dataKomparasi.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 align-top">
                      <div className="text-xs font-mono text-blue-600 font-bold mb-1">{item.kode_subkegiatan}</div>
                      <div className="text-sm text-gray-700 line-clamp-2" title={item.nama_subkegiatan}>
                        {item.nama_subkegiatan.length > 60 ? `${item.nama_subkegiatan.substring(0, 60)}...` : item.nama_subkegiatan}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="text-xs font-mono text-gray-500 mb-1">{item.kode_rekening}</div>
                      <div className="font-semibold text-gray-800">{item.nama_rekening}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-600 tabular-nums">
                      {formatRupiah(item.paguInduk)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-amber-600 tabular-nums">
                      {formatRupiah(item.paguPerubahan)}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold tabular-nums ${item.selisih > 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {item.selisih > 0 ? '+' : ''}{formatRupiah(item.selisih)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Catatan kaki */}
      {dataKomparasi.length > 0 && (
        <div className="text-xs text-gray-400 text-center py-2 font-['Roboto']">
          * Hanya menampilkan rekening dengan perubahan nilai dari {tahapAwal} ke {tahapAkhir}
        </div>
      )}
    </div>
  );
};