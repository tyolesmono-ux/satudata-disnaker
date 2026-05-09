import React, { useState, useMemo } from 'react';
import { LayoutDashboard, ShieldCheck, TrendingUp, TrendingDown, Database, Filter, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react';
import { SelectField } from './SharedUI';
import { theme } from '../config/constants';
import { formatRupiah } from '../utils/helpers';
import { useAppStore } from '../store/useAppStore';

// Reusable Summary Card (consistent with Laporan)
const SummaryCard = ({ title, value, icon: Icon, color, subValue, trend, badge }) => {
  const colorMap = {
    navy: { bg: 'bg-gray-900', text: 'text-amber-400', iconBg: 'bg-amber-500/20' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-100' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-700', iconBg: 'bg-emerald-100' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', iconBg: 'bg-orange-100' },
    gray: { bg: 'bg-gray-50', text: 'text-gray-700', iconBg: 'bg-gray-100' }
  };
  const styles = colorMap[color] || colorMap.gray;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-1 group ${color === 'navy' ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${styles.iconBg} transition-all duration-300 group-hover:scale-110`}>
          <Icon size={22} className={color === 'navy' ? 'text-amber-400' : styles.text} />
        </div>
        {badge && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{badge}</span>}
      </div>
      <div>
        <p className={`text-sm font-medium mb-1 font-['Roboto'] ${color === 'navy' ? 'text-gray-300' : 'text-gray-500'}`}>{title}</p>
        <p className={`text-2xl font-black tracking-tight ${color === 'navy' ? 'text-amber-400' : 'text-gray-900'}`}>{value}</p>
        {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
        {trend && <p className="text-xs font-medium text-emerald-600 mt-2">{trend}</p>}
      </div>
    </div>
  );
};

// Status Badge for percentage
const PercentBadge = ({ percent }) => {
  let color = '';
  if (percent <= 35) color = 'bg-rose-100 text-rose-700';
  else if (percent <= 80) color = 'bg-amber-100 text-amber-700';
  else color = 'bg-emerald-100 text-emerald-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>
      {percent.toFixed(2)}%
    </span>
  );
};

// Progress Bar Component
const ProgressBar = ({ pagu, realisasi, isDark = false }) => {
  const percent = pagu > 0 ? (realisasi / pagu) * 100 : 0;
  if (pagu === 0 && realisasi === 0) return null;
  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs font-medium mb-1.5">
        <span className={isDark ? "text-gray-300" : "text-gray-500"}>Realisasi: {formatRupiah(realisasi)}</span>
        <span className={isDark ? "text-white font-bold" : "text-gray-800 font-bold"}>{percent.toFixed(2)}%</span>
      </div>
      <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
        <div className={`h-full transition-all duration-500 ${isDark ? 'bg-amber-400' : 'bg-gray-800'}`} style={{ width: `${Math.min(percent, 100)}%` }}></div>
      </div>
    </div>
  );
};

export default function DashboardView() {
  const { programs, kegiatans, subKegiatans, rekenings, realisasiGU, storageStats, settings } = useAppStore();
  const [dashTahun, setDashTahun] = useState(settings.activeTahun);
  const [dashTahap, setDashTahap] = useState(settings.activeTahap);
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
    }).filter(item => item.subPagu > 0 || item.subRealisasi > 0); // Only show sub-kegiatan with data

    return {
      paguProgram, paguKegiatan, paguSubkegiatan,
      realisasiProgram, realisasiKegiatan, realisasiSubkegiatan,
      availableKegiatans, availableSubkegiatans, subKegiatanStats
    };
  }, [filterProgram, filterKegiatan, filterSubkegiatan, programs, kegiatans, subKegiatans, dashboardStats]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-0">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-lg">
              <LayoutDashboard size={24} className="text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight font-['Roboto']">Dashboard SatuData</h1>
          </div>
          <p className="text-gray-500 text-sm ml-14 font-['Roboto']">Ringkasan anggaran dan realisasi per tahap serta program</p>
        </div>

        {/* Year & Phase Filters + DB Health */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            <div className="w-36">
              <SelectField value={dashTahun} onChange={e => setDashTahun(e.target.value)}>
                {availableTahun.map(y => <option key={y} value={y}>{y}</option>)}
              </SelectField>
            </div>
            <div className="w-44">
              <SelectField value={dashTahap} onChange={e => setDashTahap(e.target.value)}>
                {availableTahap.map(t => <option key={t} value={t}>{t}</option>)}
              </SelectField>
            </div>
          </div>

          {storageStats && (
            <div className="flex items-center gap-4 px-4 py-2 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                <ShieldCheck size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">DB Health</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-md">Excellent</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, storageStats.usage_percentage)}%` }}></div>
                  </div>
                  <span className="text-xs font-bold text-gray-800">{storageStats.usage_percentage}%</span>
                </div>
              </div>
              <div className="h-8 w-px bg-gray-200"></div>
              <div className="hidden sm:block">
                <p className="text-[9px] font-bold text-gray-400 uppercase">Used Cells</p>
                <p className="text-xs font-bold text-gray-800">{storageStats.total_cells_used.toLocaleString()} / 10M</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
        <div className="px-6 py-4 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider font-['Roboto']">Filter Analisis</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SelectField
              label="Program"
              value={filterProgram}
              onChange={e => { setFilterProgram(e.target.value); setFilterKegiatan(''); setFilterSubkegiatan(''); }}
            >
              <option value="">-- Semua Program --</option>
              {programs.map(p => <option key={p.kode_program} value={p.kode_program}>[{p.kode_program}] {p.nama_program}</option>)}
            </SelectField>
            <SelectField
              label="Kegiatan"
              value={filterKegiatan}
              onChange={e => { setFilterKegiatan(e.target.value); setFilterSubkegiatan(''); }}
              disabled={!filterProgram && filteredDashboard.availableKegiatans.length === 0}
            >
              <option value="">-- Semua Kegiatan --</option>
              {filteredDashboard.availableKegiatans.map(k => <option key={k.kode_kegiatan} value={k.kode_kegiatan}>[{k.kode_kegiatan}] {k.nama_kegiatan}</option>)}
            </SelectField>
            <SelectField
              label="Sub Kegiatan"
              value={filterSubkegiatan}
              onChange={e => setFilterSubkegiatan(e.target.value)}
              disabled={!filterKegiatan && filteredDashboard.availableSubkegiatans.length === 0}
            >
              <option value="">-- Semua Sub Kegiatan --</option>
              {filteredDashboard.availableSubkegiatans.map(s => <option key={s.kode_subkegiatan} value={s.kode_subkegiatan}>[{s.kode_subkegiatan}] {s.nama_subkegiatan}</option>)}
            </SelectField>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <SummaryCard
          title={`Pagu Program ${filterProgram ? 'Terpilih' : 'Keseluruhan'}`}
          value={formatRupiah(filteredDashboard.paguProgram)}
          icon={TrendingUp}
          color="navy"
          badge={dashTahap}
        >
          <ProgressBar pagu={filteredDashboard.paguProgram} realisasi={filteredDashboard.realisasiProgram} isDark={true} />
        </SummaryCard>
        <SummaryCard
          title={`Pagu Kegiatan ${filterKegiatan ? 'Terpilih' : '(Belum dipilih)'}`}
          value={filterKegiatan ? formatRupiah(filteredDashboard.paguKegiatan) : '-'}
          icon={BarChart3}
          color="blue"
          badge={filterKegiatan ? 'Terfilter' : 'Inaktif'}
        >
          {filterKegiatan && <ProgressBar pagu={filteredDashboard.paguKegiatan} realisasi={filteredDashboard.realisasiKegiatan} />}
        </SummaryCard>
        <SummaryCard
          title={`Pagu Sub Kegiatan ${filterSubkegiatan ? 'Terpilih' : '(Belum dipilih)'}`}
          value={filterSubkegiatan ? formatRupiah(filteredDashboard.paguSubkegiatan) : '-'}
          icon={Database}
          color="green"
          badge={filterSubkegiatan ? 'Terfilter' : 'Inaktif'}
        >
          {filterSubkegiatan && <ProgressBar pagu={filteredDashboard.paguSubkegiatan} realisasi={filteredDashboard.realisasiSubkegiatan} />}
        </SummaryCard>
      </div>

      {/* Table: Status Realisasi Sub Kegiatan */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="px-6 py-5 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-800 font-['Roboto']">Status Realisasi per Sub Kegiatan</h3>
              <p className="text-sm text-gray-500 mt-0.5">Persentase realisasi berdasarkan filter yang dipilih</p>
            </div>
            <div className="flex gap-2">
              <span className="text-[10px] font-bold px-2 py-1 bg-rose-100 text-rose-700 rounded-full">≤35%</span>
              <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-full">36-80%</span>
              <span className="text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">&gt;80%</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-sm font-['Roboto']">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Kode</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Sub Kegiatan</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Pagu</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Realisasi</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider w-32">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredDashboard.subKegiatanStats.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <AlertCircle size={32} className="mb-2 opacity-50" />
                      <p className="text-sm font-medium">Tidak ada data sub kegiatan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDashboard.subKegiatanStats.map(sk => (
                  <tr key={sk.kode_subkegiatan} className="hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{sk.kode_subkegiatan}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{sk.nama_subkegiatan}</td>
                    <td className="px-6 py-4 text-right text-gray-600 tabular-nums">{formatRupiah(sk.subPagu)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-700 tabular-nums">{formatRupiah(sk.subRealisasi)}</td>
                    <td className="px-6 py-4 text-center">
                      <PercentBadge percent={sk.percentage} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredDashboard.subKegiatanStats.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/30 text-right">
            <p className="text-[10px] text-gray-400">Menampilkan {filteredDashboard.subKegiatanStats.length} sub kegiatan</p>
          </div>
        )}
      </div>
    </div>
  );
}