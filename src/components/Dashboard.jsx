import React, { useState, useMemo } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { SelectField } from './SharedUI';
import { theme } from '../config/constants';
import { formatRupiah } from '../utils/helpers';

export default function DashboardView({ programs, kegiatans, subKegiatans, rekenings, realisasiGU = [] }) {
  const [dashTahun, setDashTahun] = useState(new Date().getFullYear().toString());
  const [dashTahap, setDashTahap] = useState('APBD');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterKegiatan, setFilterKegiatan] = useState('');
  const [filterSubkegiatan, setFilterSubkegiatan] = useState('');
  
  const availableTahun = useMemo(() => {
    const years = new Set();
    rekenings.forEach(r => { if (r.tahun_anggaran) years.add(String(r.tahun_anggaran)); });
    realisasiGU.forEach(r => { if (r.tahun_anggaran) years.add(String(r.tahun_anggaran)); });
    const sorted = Array.from(years).sort((a, b) => b - a);
    return sorted.length > 0 ? sorted : [new Date().getFullYear().toString()];
  }, [rekenings, realisasiGU]);

  const availableTahap = useMemo(() => {
    const stages = new Set();
    rekenings.forEach(r => { if (r.tahap_anggaran) stages.add(r.tahap_anggaran); });
    realisasiGU.forEach(r => { if (r.tahap_anggaran) stages.add(r.tahap_anggaran); });
    
    const order = ['APBD', 'Pergeseran 1', 'Pergeseran 2', 'Perubahan'];
    const sorted = Array.from(stages).sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
    return sorted.length > 0 ? sorted : ['APBD'];
  }, [rekenings, realisasiGU]);

  const dashboardStats = useMemo(() => {
    const activeRekenings = rekenings.filter(r => String(r.tahun_anggaran) === String(dashTahun) && String(r.tahap_anggaran) === String(dashTahap));
    const activeRealisasi = realisasiGU.filter(r => String(r.tahun_anggaran) === String(dashTahun) && String(r.tahap_anggaran) === String(dashTahap) && r.status_nota !== 'Ditolak');
    
    const totalPagu = activeRekenings.reduce((sum, item) => sum + Number(item.pagu || 0), 0);
    const totalRealisasi = activeRealisasi.reduce((sum, item) => sum + Number(item.nominal_nota || 0), 0);

    return { totalPagu, totalRealisasi, activeRekenings, activeRealisasi };
  }, [rekenings, realisasiGU, dashTahun, dashTahap]);

  const filteredDashboard = useMemo(() => {
    const { activeRekenings, activeRealisasi, totalPagu, totalRealisasi } = dashboardStats;
    let paguProgram = 0, paguKegiatan = 0, paguSubkegiatan = 0;
    let realisasiProgram = 0, realisasiKegiatan = 0, realisasiSubkegiatan = 0;

    let relSubProg = [];
    if (filterProgram) {
      const relKeg = kegiatans.filter(k => k.kode_program === filterProgram).map(k => k.kode_kegiatan);
      relSubProg = subKegiatans.filter(sk => relKeg.includes(sk.kode_kegiatan)).map(sk => String(sk.kode_subkegiatan));
      paguProgram = activeRekenings.filter(r => relSubProg.includes(String(r.kode_subkegiatan))).reduce((sum, r) => sum + Number(r.pagu || 0), 0);
      realisasiProgram = activeRealisasi.filter(r => relSubProg.includes(String(r.kode_subkegiatan))).reduce((sum, r) => sum + Number(r.nominal_nota || 0), 0);
    } else {
      paguProgram = totalPagu;
      realisasiProgram = totalRealisasi;
    }

    if (filterKegiatan) {
      const relSubReq = subKegiatans.filter(sk => sk.kode_kegiatan === filterKegiatan).map(sk => String(sk.kode_subkegiatan));
      paguKegiatan = activeRekenings.filter(r => relSubReq.includes(String(r.kode_subkegiatan))).reduce((sum, r) => sum + Number(r.pagu || 0), 0);
      realisasiKegiatan = activeRealisasi.filter(r => relSubReq.includes(String(r.kode_subkegiatan))).reduce((sum, r) => sum + Number(r.nominal_nota || 0), 0);
    }

    if (filterSubkegiatan) {
      paguSubkegiatan = activeRekenings.filter(r => String(r.kode_subkegiatan) === filterSubkegiatan).reduce((sum, r) => sum + Number(r.pagu || 0), 0);
      realisasiSubkegiatan = activeRealisasi.filter(r => String(r.kode_subkegiatan) === filterSubkegiatan).reduce((sum, r) => sum + Number(r.nominal_nota || 0), 0);
    }

    const availableKegiatans = filterProgram ? kegiatans.filter(k => k.kode_program === filterProgram) : kegiatans;
    const availableSubkegiatans = filterKegiatan ? subKegiatans.filter(sk => sk.kode_kegiatan === filterKegiatan) : 
                                 (filterProgram ? subKegiatans.filter(sk => availableKegiatans.some(ak => ak.kode_kegiatan === sk.kode_kegiatan)) : subKegiatans);
    
    const subKegiatanStats = availableSubkegiatans.map(sk => {
      const code = String(sk.kode_subkegiatan);
      const subPagu = activeRekenings.filter(r => String(r.kode_subkegiatan) === code).reduce((sum, r) => sum + Number(r.pagu || 0), 0);
      const subRealisasi = activeRealisasi.filter(r => String(r.kode_subkegiatan) === code).reduce((sum, r) => sum + Number(r.nominal_nota || 0), 0);
      const percentage = subPagu > 0 ? (subRealisasi / subPagu) * 100 : 0;
      return { ...sk, subPagu, subRealisasi, percentage };
    });

    return { 
      paguProgram, paguKegiatan, paguSubkegiatan, 
      realisasiProgram, realisasiKegiatan, realisasiSubkegiatan,
      availableKegiatans, availableSubkegiatans, subKegiatanStats 
    };
  }, [filterProgram, filterKegiatan, filterSubkegiatan, programs, kegiatans, subKegiatans, dashboardStats]);

  const renderProgress = (pagu, realisasi, isDark = false, isSelected = false) => {
    if (!isSelected && pagu === 0 && realisasi === 0) return null;
    const percent = pagu > 0 ? (realisasi / pagu) * 100 : 0;
    return (
      <div className="mt-4">
        <div className="flex justify-between text-xs font-semibold mb-1">
          <span className={isDark ? "text-gray-300" : "text-gray-500"}>Realisasi: {formatRupiah(realisasi)}</span>
          <span className={isDark ? "text-white" : "text-[#0A192F]"}>{percent.toFixed(2)}%</span>
        </div>
        <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
          <div className={`h-full ${isDark ? 'bg-[#D4AF37]' : 'bg-[#0A192F]'}`} style={{ width: `${Math.min(percent, 100)}%` }}></div>
        </div>
      </div>
    );
  };

  const getBadgeColor = (percent) => {
    if (percent <= 35) return 'bg-red-100 text-red-700 border-red-200';
    if (percent <= 80) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold" style={{ color: theme.navy }}>Dashboard Anggaran</h2>
        <div className="flex gap-2 bg-white p-2 rounded-lg border shadow-sm">
          <select value={dashTahun} onChange={e => setDashTahun(e.target.value)} className="px-3 py-1.5 border-r focus:ring-0 outline-none text-sm font-semibold text-gray-700 cursor-pointer bg-transparent">
            {availableTahun.map(y => <option key={y} value={y}>Tahun {y}</option>)}
          </select>
          <select value={dashTahap} onChange={e => setDashTahap(e.target.value)} className="px-3 py-1.5 focus:ring-0 outline-none text-sm font-semibold text-gray-700 cursor-pointer bg-transparent">
            {availableTahap.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectField label="Filter Program" value={filterProgram} onChange={e => { setFilterProgram(e.target.value); setFilterKegiatan(''); setFilterSubkegiatan(''); }}>
            <option value="">-- Semua Program --</option>
            {programs.map(p => <option key={p.kode_program} value={p.kode_program}>[{p.kode_program}] {p.nama_program}</option>)}
          </SelectField>
          <SelectField label="Filter Kegiatan" value={filterKegiatan} onChange={e => { setFilterKegiatan(e.target.value); setFilterSubkegiatan(''); }}>
            <option value="">-- Semua Kegiatan --</option>
            {filteredDashboard.availableKegiatans.map(k => <option key={k.kode_kegiatan} value={k.kode_kegiatan}>[{k.kode_kegiatan}] {k.nama_kegiatan}</option>)}
          </SelectField>
          <SelectField label="Filter Sub Kegiatan" value={filterSubkegiatan} onChange={e => setFilterSubkegiatan(e.target.value)}>
            <option value="">-- Semua Sub Kegiatan --</option>
            {filteredDashboard.availableSubkegiatans.map(s => <option key={s.kode_subkegiatan} value={s.kode_subkegiatan}>[{s.kode_subkegiatan}] {s.nama_subkegiatan}</option>)}
          </SelectField>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl shadow-sm border relative overflow-hidden bg-[#0A192F]">
          <p className="text-sm font-medium opacity-80 text-white">Pagu Program {filterProgram ? 'Terpilih' : 'Keseluruhan'}</p>
          <p className="text-3xl font-bold mt-2 truncate text-[#D4AF37]">{formatRupiah(filteredDashboard.paguProgram)}</p>
          {renderProgress(filteredDashboard.paguProgram, filteredDashboard.realisasiProgram, true, true)}
        </div>
        <div className="p-6 rounded-xl shadow-sm border bg-white">
          <p className="text-sm font-medium text-gray-500">Pagu Kegiatan {filterKegiatan ? 'Terpilih' : '(Belum dipilih)'}</p>
          <p className={`text-3xl font-bold mt-2 truncate ${filterKegiatan ? 'text-[#0A192F]' : 'text-gray-300'}`}>{filterKegiatan ? formatRupiah(filteredDashboard.paguKegiatan) : '-'}</p>
          {filterKegiatan && renderProgress(filteredDashboard.paguKegiatan, filteredDashboard.realisasiKegiatan, false, true)}
        </div>
        <div className="p-6 rounded-xl shadow-sm border bg-white">
          <p className="text-sm font-medium text-gray-500">Pagu Sub Kegiatan {filterSubkegiatan ? 'Terpilih' : '(Belum dipilih)'}</p>
          <p className={`text-3xl font-bold mt-2 truncate ${filterSubkegiatan ? 'text-[#0A192F]' : 'text-gray-300'}`}>{filterSubkegiatan ? formatRupiah(filteredDashboard.paguSubkegiatan) : '-'}</p>
          {filterSubkegiatan && renderProgress(filteredDashboard.paguSubkegiatan, filteredDashboard.realisasiSubkegiatan, false, true)}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold text-[#0A192F]">Status Realisasi Sub Kegiatan</h3>
          <p className="text-sm text-gray-500 mt-1">Persentase realisasi per sub kegiatan sesuai filter di atas</p>
        </div>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-sm text-left border-separate border-spacing-0">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold text-gray-600 border-b">Kode</th>
                <th className="p-4 font-semibold text-gray-600 border-b">Sub Kegiatan</th>
                <th className="p-4 font-semibold text-gray-600 border-b text-right">Pagu</th>
                <th className="p-4 font-semibold text-gray-600 border-b text-right">Realisasi</th>
                <th className="p-4 font-semibold text-gray-600 border-b text-center w-32">Status (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDashboard.subKegiatanStats.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400 italic">Tidak ada data Sub Kegiatan</td>
                </tr>
              ) : (
                filteredDashboard.subKegiatanStats.map(sk => (
                  <tr key={sk.kode_subkegiatan} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-4 font-mono text-gray-500">{sk.kode_subkegiatan}</td>
                    <td className="p-4 font-medium text-gray-800">{sk.nama_subkegiatan}</td>
                    <td className="p-4 text-right text-gray-600">{formatRupiah(sk.subPagu)}</td>
                    <td className="p-4 text-right font-semibold text-gray-700">{formatRupiah(sk.subRealisasi)}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border tracking-wide whitespace-nowrap ${getBadgeColor(sk.percentage)}`}>
                        {sk.percentage.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}