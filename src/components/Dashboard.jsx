// File: src/components/Dashboard.jsx

import React, { useState, useMemo } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { SelectField } from './SharedUI';
import { theme } from '../config/constants';
import { formatRupiah } from '../utils/helpers';

export default function DashboardView({ programs, kegiatans, subKegiatans, rekenings }) {
  const [dashTahun, setDashTahun] = useState(new Date().getFullYear().toString());
  const [dashTahap, setDashTahap] = useState('Induk');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterKegiatan, setFilterKegiatan] = useState('');
  const [filterSubkegiatan, setFilterSubkegiatan] = useState('');

  const dashboardStats = useMemo(() => {
    const activeRekenings = rekenings.filter(r => String(r.tahun_anggaran) === String(dashTahun) && String(r.tahap_anggaran) === String(dashTahap));
    const totalPagu = activeRekenings.reduce((sum, item) => sum + Number(item.pagu || 0), 0);
    const paguPerProgram = programs.map(prog => {
      const relatedKeg = kegiatans.filter(k => k.kode_program === prog.kode_program).map(k => k.kode_kegiatan);
      const relatedSub = subKegiatans.filter(sk => relatedKeg.includes(sk.kode_kegiatan)).map(sk => sk.kode_subkegiatan);
      const total = activeRekenings.filter(rek => relatedSub.includes(rek.kode_subkegiatan)).reduce((sum, rek) => sum + Number(rek.pagu || 0), 0);
      return { ...prog, total_pagu: total };
    });
    return { totalPagu, paguPerProgram, activeRekenings };
  }, [programs, kegiatans, subKegiatans, rekenings, dashTahun, dashTahap]);

  const filteredDashboard = useMemo(() => {
    const { activeRekenings, totalPagu } = dashboardStats;
    let paguProgram = 0, paguKegiatan = 0, paguSubkegiatan = 0;

    if (filterProgram) {
      const relKeg = kegiatans.filter(k => k.kode_program === filterProgram).map(k => k.kode_kegiatan);
      const relSub = subKegiatans.filter(sk => relKeg.includes(sk.kode_kegiatan)).map(sk => sk.kode_subkegiatan);
      paguProgram = activeRekenings.filter(r => relSub.includes(r.kode_subkegiatan)).reduce((sum, r) => sum + Number(r.pagu || 0), 0);
    } else paguProgram = totalPagu;

    if (filterKegiatan) {
      const relSub = subKegiatans.filter(sk => sk.kode_kegiatan === filterKegiatan).map(sk => sk.kode_subkegiatan);
      paguKegiatan = activeRekenings.filter(r => relSub.includes(r.kode_subkegiatan)).reduce((sum, r) => sum + Number(r.pagu || 0), 0);
    }

    if (filterSubkegiatan) paguSubkegiatan = activeRekenings.filter(r => r.kode_subkegiatan === filterSubkegiatan).reduce((sum, r) => sum + Number(r.pagu || 0), 0);

    const availableKegiatans = filterProgram ? kegiatans.filter(k => k.kode_program === filterProgram) : kegiatans;
    const availableSubkegiatans = filterKegiatan ? subKegiatans.filter(sk => sk.kode_kegiatan === filterKegiatan) : 
                                 (filterProgram ? subKegiatans.filter(sk => availableKegiatans.some(ak => ak.kode_kegiatan === sk.kode_kegiatan)) : subKegiatans);
    let filteredTable = filterProgram ? dashboardStats.paguPerProgram.filter(p => p.kode_program === filterProgram) : dashboardStats.paguPerProgram;

    return { paguProgram, paguKegiatan, paguSubkegiatan, availableKegiatans, availableSubkegiatans, filteredTable };
  }, [filterProgram, filterKegiatan, filterSubkegiatan, programs, kegiatans, subKegiatans, rekenings, dashboardStats]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold" style={{ color: theme.navy }}>Dashboard Anggaran</h2>
        <div className="flex gap-2 bg-white p-2 rounded-lg border shadow-sm">
          <select value={dashTahun} onChange={e => setDashTahun(e.target.value)} className="px-3 py-1.5 border-r focus:ring-0 outline-none text-sm font-semibold text-gray-700 cursor-pointer bg-transparent">
            <option value="2025">Tahun 2025</option><option value="2026">Tahun 2026</option><option value="2027">Tahun 2027</option>
          </select>
          <select value={dashTahap} onChange={e => setDashTahap(e.target.value)} className="px-3 py-1.5 focus:ring-0 outline-none text-sm font-semibold text-gray-700 cursor-pointer bg-transparent">
            <option value="Induk">Induk (Murni)</option><option value="Pergeseran 1">Pergeseran 1</option><option value="Perubahan">Perubahan (PAK)</option>
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
        </div>
        <div className="p-6 rounded-xl shadow-sm border bg-white">
          <p className="text-sm font-medium text-gray-500">Pagu Kegiatan {filterKegiatan ? 'Terpilih' : '(Belum dipilih)'}</p>
          <p className={`text-3xl font-bold mt-2 truncate ${filterKegiatan ? 'text-[#0A192F]' : 'text-gray-300'}`}>{filterKegiatan ? formatRupiah(filteredDashboard.paguKegiatan) : '-'}</p>
        </div>
        <div className="p-6 rounded-xl shadow-sm border bg-white">
          <p className="text-sm font-medium text-gray-500">Pagu Sub Kegiatan {filterSubkegiatan ? 'Terpilih' : '(Belum dipilih)'}</p>
          <p className={`text-3xl font-bold mt-2 truncate ${filterSubkegiatan ? 'text-[#0A192F]' : 'text-gray-300'}`}>{filterSubkegiatan ? formatRupiah(filteredDashboard.paguSubkegiatan) : '-'}</p>
        </div>
      </div>
    </div>
  );
}