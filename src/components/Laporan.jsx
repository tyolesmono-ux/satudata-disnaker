import React, { useState, useMemo, useRef } from 'react';
import { Download, Filter, ReceiptText, ShieldCheck, FileText, TrendingUp, CreditCard, Wallet, Calendar, Eye, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SelectField } from './SharedUI';
import { formatRupiah, formatTanggal } from '../utils/helpers';
import { useAppStore } from '../store/useAppStore';

// Enhanced CSV Export with proper escaping
const exportToCSV = (filename, rows) => {
  const escapeCSV = (cell) => {
    if (cell === null || cell === undefined) return '';
    const str = String(cell);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = rows.map(row => row.map(escapeCSV).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Modern Summary Card Komponen
const SummaryCard = ({ title, value, icon: Icon, color, subValue, trend, badge }) => {
  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', iconBg: 'bg-blue-100', border: 'hover:border-blue-200' },
    red: { bg: 'bg-red-50', text: 'text-red-600', iconBg: 'bg-red-100', border: 'hover:border-red-200' },
    green: { bg: 'bg-green-50', text: 'text-green-600', iconBg: 'bg-green-100', border: 'hover:border-green-200' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', iconBg: 'bg-purple-100', border: 'hover:border-purple-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', iconBg: 'bg-orange-100', border: 'hover:border-orange-200' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-600', iconBg: 'bg-teal-100', border: 'hover:border-teal-200' },
  };

  const styles = colorMap[color] || colorMap.blue;

  return (
    <div className={`relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 ${styles.border} transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-3 rounded-xl ${styles.iconBg} transition-all duration-300 group-hover:scale-110`}>
            <Icon size={22} className={styles.text} />
          </div>
          {badge && (
            <span className="px-2 py-1 text-[10px] font-bold bg-gray-100 text-gray-600 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1 tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
          {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
          {trend && <p className="text-xs font-medium text-green-600 mt-2">{trend}</p>}
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 w-full h-1 ${styles.text.replace('text-', 'bg-')} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    </div>
  );
};

// Komponen Filter Modern
const FilterSection = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
    <div className="px-6 py-4 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white rounded-t-2xl">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-gray-400" />
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</h3>
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

// Komponen Tabel Modern
const ModernTable = ({ headers, data, renderRow, emptyMessage, totalRow }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
      <div className="overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
              {headers.map((header, idx) => (
                <th key={idx} className={`px-5 py-4 font-bold uppercase tracking-wider text-[11px] ${idx === headers.length - 1 ? 'text-right pr-8' : 'text-left'}`}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Database size={32} className="mb-2 opacity-50" />
                    <p className="text-sm font-medium">{emptyMessage || "Tidak ada data"}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, idx) => renderRow(item, idx))
            )}
          </tbody>
          {totalRow && data.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50/80 font-bold border-t-2 border-gray-200">
                {totalRow}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export const LaporanRekapGU = () => {
  const { realisasiGU, rekenings } = useAppStore();
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString());
  const [filterTahap, setFilterTahap] = useState('APBD');
  const [filterGU, setFilterGU] = useState('GU-01');
  const tableRef = useRef(null);

  const guOptions = Array.from({ length: 24 }, (_, i) => `GU-${String(i + 1).padStart(2, '0')}`);
  guOptions.push('GU-Nihil');

  const reportData = useMemo(() => {
    const dataRealisasi = Array.isArray(realisasiGU) ? realisasiGU : [];
    const filtered = dataRealisasi.filter(r =>
      String(r.tahun_anggaran) === filterTahun &&
      String(r.tahap_anggaran) === filterTahap &&
      r.proses_gu === filterGU &&
      r.status_nota !== 'Ditolak'
    );

    const isPph21 = (n) => Number(n.pph21) > 0 || String(n.kop_pajak || '').startsWith('21-');
    const result = [];
    const pph21Groups = {};

    filtered.forEach(n => {
      if (isPph21(n)) {
        const key = `${n.tanggal_nota}|||${n.keterangan_nota}`;
        if (!pph21Groups[key]) {
          pph21Groups[key] = { ...n, nominal_nota: 0, ppn: 0, pph21: 0, pph22: 0, pph23: 0, _count: 0 };
        }
        pph21Groups[key].nominal_nota += Number(n.nominal_nota);
        pph21Groups[key].ppn += Number(n.ppn);
        pph21Groups[key].pph21 += Number(n.pph21);
        pph21Groups[key].pph22 += Number(n.pph22);
        pph21Groups[key].pph23 += Number(n.pph23);
        pph21Groups[key]._count += 1;
      } else {
        result.push(n);
      }
    });

    Object.values(pph21Groups).forEach(group => {
      result.push({ ...group, keterangan_nota: `${group.keterangan_nota} (${group._count} Penerima)` });
    });

    return result.sort((a, b) => String(a.tanggal_nota).localeCompare(String(b.tanggal_nota)));
  }, [realisasiGU, filterTahun, filterTahap, filterGU]);

  const totals = reportData.reduce((acc, curr) => {
    acc.bruto += Number(curr.nominal_nota || 0);
    acc.ppn += Number(curr.ppn || 0);
    acc.pph21 += Number(curr.pph21 || 0);
    acc.pph22 += Number(curr.pph22 || 0);
    acc.pph23 += Number(curr.pph23 || 0);
    return acc;
  }, { bruto: 0, ppn: 0, pph21: 0, pph22: 0, pph23: 0 });

  const totalPotongan = totals.ppn + totals.pph21 + totals.pph22 + totals.pph23;
  const totalBersih = totals.bruto - totalPotongan;

  const handleViewReport = () => {
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleExport = () => {
    const headers = ["Tanggal", "Uraian", "Bruto (Rp)", "Potongan (Rp)", "Bersih (Rp)"];
    const rows = [headers, ...reportData.map(r => [
      formatTanggal(r.tanggal_nota),
      r.keterangan_nota,
      r.nominal_nota,
      (Number(r.ppn) + Number(r.pph21) + Number(r.pph22) + Number(r.pph23)),
      Number(r.nominal_nota) - (Number(r.ppn) + Number(r.pph21) + Number(r.pph22) + Number(r.pph23))
    ])];
    exportToCSV(`Rekap_GU_${filterGU}_${filterTahun}_${filterTahap}.csv`, rows);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-lg">
              <ReceiptText size={24} className="text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Rekapitulasi Proses GU</h1>
          </div>
          <p className="text-gray-500 text-sm ml-14">Laporan perincian pengeluaran dan potongan pajak per tahap anggaran</p>
        </div>
        <div className="flex gap-3 self-start md:self-center">
          <button
            onClick={handleViewReport}
            className="px-5 py-2.5 text-sm font-bold bg-white border border-gray-200 text-gray-700 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 flex items-center gap-2"
          >
            <Eye size={16} /> Lihat Laporan
          </button>
          <button
            onClick={handleExport}
            disabled={reportData.length === 0}
            className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <SummaryCard
          title="Total Bruto"
          value={formatRupiah(totals.bruto)}
          icon={TrendingUp}
          color="blue"
          subValue={`Dari ${reportData.length} transaksi`}
          badge="Kotor"
        />
        <SummaryCard
          title="Total Potongan"
          value={formatRupiah(totalPotongan)}
          icon={CreditCard}
          color="red"
          subValue={`PPN: ${formatRupiah(totals.ppn)} | PPh: ${formatRupiah(totals.pph21 + totals.pph22 + totals.pph23)}`}
          badge="Pajak"
        />
        <SummaryCard
          title="Total Bersih"
          value={formatRupiah(totalBersih)}
          icon={Wallet}
          color="green"
          subValue="Setelah potongan pajak"
          badge="Netto"
        />
      </div>

      {/* Filter Section */}
      <FilterSection title="Filter Laporan" icon={Filter}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SelectField label="Tahun Anggaran" value={filterTahun} onChange={e => setFilterTahun(e.target.value)}>
            {Array.from(new Set((Array.isArray(rekenings) ? rekenings : []).map(r => String(r.tahun_anggaran)))).sort((a, b) => b - a).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </SelectField>
          <SelectField label="Tahap Anggaran" value={filterTahap} onChange={e => setFilterTahap(e.target.value)}>
            <option value="APBD">APBD Utama</option>
            <option value="Pergeseran 1">Pergeseran 1</option>
            <option value="Pergeseran 2">Pergeseran 2</option>
            <option value="Perubahan">Perubahan (PAK)</option>
          </SelectField>
          <SelectField label="Nomor Proses GU" value={filterGU} onChange={e => setFilterGU(e.target.value)}>
            {guOptions.map(gu => <option key={gu} value={gu}>{gu}</option>)}
          </SelectField>
        </div>
      </FilterSection>

      {/* Data Table Section */}
      <div ref={tableRef}>
        <ModernTable
          headers={["Tanggal", "Uraian Aktivitas / BPU", "Bruto", "Potongan", "Bersih"]}
          data={reportData}
          renderRow={(n, i) => {
            const pot = Number(n.ppn) + Number(n.pph21) + Number(n.pph22) + Number(n.pph23);
            const bersih = Number(n.nominal_nota) - pot;
            const hasPajak = pot > 0;

            return (
              <tr key={i} className="hover:bg-gray-50/80 transition-colors duration-150 group">
                <td className="px-5 py-4 text-gray-500 whitespace-nowrap font-mono text-xs">
                  {formatTanggal(n.tanggal_nota)}
                </td>
                <td className="px-5 py-4">
                  <div className="font-semibold text-gray-800 mb-1">{n.keterangan_nota}</div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Number(n.pph21) > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md text-[9px] font-bold uppercase tracking-wide">
                        <AlertCircle size={8} /> PPh 21
                      </span>
                    )}
                    {Number(n.ppn) > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[9px] font-bold uppercase tracking-wide">
                        <CheckCircle2 size={8} /> PPN
                      </span>
                    )}
                    {Number(n.pph22) > 0 && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md text-[9px] font-bold uppercase">PPh 22</span>
                    )}
                    {Number(n.pph23) > 0 && (
                      <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded-md text-[9px] font-bold uppercase">PPh 23</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 text-right font-semibold text-gray-800">{formatRupiah(n.nominal_nota)}</td>
                <td className={`px-5 py-4 text-right ${hasPajak ? 'text-red-500 font-semibold' : 'text-gray-300'}`}>
                  {hasPajak ? `-${formatRupiah(pot).replace('Rp', '').trim()}` : '-'}
                </td>
                <td className="px-5 py-4 text-right font-bold text-gray-900 pr-8">{formatRupiah(bersih)}</td>
              </tr>
            );
          }}
          emptyMessage="Belum ada data realisasi untuk filter yang dipilih"
          totalRow={
            <>
              <td colSpan="2" className="px-6 py-4 text-sm text-gray-700 font-semibold">Total Keseluruhan</td>
              <td className="px-6 py-4 text-right text-gray-800 font-bold">{formatRupiah(totals.bruto)}</td>
              <td className="px-6 py-4 text-right text-red-600 font-bold">-{formatRupiah(totalPotongan).replace('Rp', '').trim()}</td>
              <td className="px-6 py-4 text-right text-gray-900 font-bold text-lg pr-8">{formatRupiah(totalBersih)}</td>
            </>
          }
        />
      </div>
    </div>
  );
};

export const LaporanCoreTax = () => {
  const { realisasiGU } = useAppStore();
  const [jenisPajak, setJenisPajak] = useState('BPU');
  const tableRef = useRef(null);

  const filteredData = useMemo(() => {
    const dataRealisasi = Array.isArray(realisasiGU) ? realisasiGU : [];
    return dataRealisasi.filter(r => {
      if (r.status_nota === 'Ditolak') return false;
      if (jenisPajak === 'BPU') return Number(r.pph22) > 0 || Number(r.pph23) > 0;
      if (jenisPajak === 'BP21') return Number(r.pph21) > 0;
      if (jenisPajak === 'PPN') return Number(r.ppn) > 0;
      return false;
    });
  }, [realisasiGU, jenisPajak]);

  const totalPotongan = useMemo(() => {
    return filteredData.reduce((sum, r) => {
      return sum + Number(r.pph21) + Number(r.pph22) + Number(r.pph23) + Number(r.ppn);
    }, 0);
  }, [filteredData]);

  const handleExport = () => {
    const headers = ["Tanggal", "Penyedia/Vendor", "NPWP/NIK", "Nominal Bruto", "KOP", "KAP", "KJS", "Potongan Pajak"];
    const rows = [headers, ...filteredData.map(r => [
      formatTanggal(r.tanggal_nota),
      r.nama_vendor,
      r.nik_vendor,
      r.nominal_nota,
      r.kop_pajak || '-',
      r.kap_pajak || '-',
      r.kjs_pajak || '-',
      (Number(r.pph21) + Number(r.pph22) + Number(r.pph23) + Number(r.ppn))
    ])];
    exportToCSV(`Laporan_CoreTax_${jenisPajak}_${new Date().getTime()}.csv`, rows);
  };

  const handleViewReport = () => {
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getJenisLabel = () => {
    switch (jenisPajak) {
      case 'BPU': return { title: 'BPU (PPh 22 & PPh 23)', color: 'purple', icon: ShieldCheck };
      case 'BP21': return { title: 'BP21 (PPh 21)', color: 'orange', icon: ShieldCheck };
      case 'PPN': return { title: 'PPN', color: 'blue', icon: ShieldCheck };
      default: return { title: 'Perpajakan', color: 'gray', icon: ShieldCheck };
    }
  };

  const jenisInfo = getJenisLabel();

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-red-500 to-red-700 rounded-xl shadow-lg">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Laporan Perpajakan (CoreTax)</h1>
          </div>
          <p className="text-gray-500 text-sm ml-14">Validasi data perpajakan untuk sinkronisasi sistem CoreTax DJP</p>
        </div>
        <div className="flex gap-3 self-start md:self-center">
          <button
            onClick={handleViewReport}
            className="px-5 py-2.5 text-sm font-bold bg-white border border-gray-200 text-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
          >
            <Eye size={16} /> Lihat Laporan
          </button>
          <button
            onClick={handleExport}
            disabled={filteredData.length === 0}
            className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <SummaryCard
          title={`Total Potongan ${jenisInfo.title}`}
          value={formatRupiah(totalPotongan)}
          icon={jenisInfo.icon}
          color={jenisInfo.color}
          subValue={`Dari ${filteredData.length} transaksi`}
          badge="Pajak"
        />
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Status Validasi CoreTax</p>
            <p className="text-lg font-bold text-gray-900">Siap Sinkronisasi</p>
          </div>
          <div className="p-3 bg-green-100 rounded-xl">
            <CheckCircle2 size={24} className="text-green-600" />
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <FilterSection title="Filter Data Pajak" icon={Filter}>
        <div className="max-w-md">
          <SelectField label="Kategori Potongan" value={jenisPajak} onChange={e => setJenisPajak(e.target.value)}>
            <option value="BPU">BPU (PPh 22 & PPh 23)</option>
            <option value="BP21">BP21 (PPh 21)</option>
            <option value="PPN">PPN</option>
          </SelectField>
        </div>
      </FilterSection>

      {/* Data Table Section */}
      <div ref={tableRef}>
        <ModernTable
          headers={["Tanggal", "Vendor / Penerima", "KOP / KAP / KJS", "Potongan Pajak"]}
          data={filteredData}
          renderRow={(r, i) => {
            const pot = Number(r.pph21) + Number(r.pph22) + Number(r.pph23) + Number(r.ppn);
            return (
              <tr key={i} className="hover:bg-red-50/30 transition-colors duration-150">
                <td className="px-5 py-4 text-gray-500 whitespace-nowrap font-mono text-xs">
                  {formatTanggal(r.tanggal_nota)}
                </td>
                <td className="px-5 py-4">
                  <div className="font-bold text-gray-900">{r.nama_vendor}</div>
                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">{r.nik_vendor}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-1 bg-gray-100 rounded-md text-[10px] font-bold text-gray-700 font-mono">{r.kop_pajak || '-'}</span>
                    <span className="px-2 py-1 bg-gray-100 rounded-md text-[10px] font-bold text-gray-700 font-mono">{r.kap_pajak || '-'}</span>
                    <span className="px-2 py-1 bg-gray-100 rounded-md text-[10px] font-bold text-gray-700 font-mono">{r.kjs_pajak || '-'}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-right font-bold text-red-600 pr-8">{formatRupiah(pot)}</td>
              </tr>
            );
          }}
          emptyMessage="Data perpajakan tidak ditemukan untuk kategori ini"
          totalRow={
            filteredData.length > 0 && (
              <>
                <td colSpan="3" className="px-6 py-4 text-sm font-semibold text-gray-700">Total Potongan Keseluruhan</td>
                <td className="px-6 py-4 text-right font-bold text-red-600 text-lg pr-8">{formatRupiah(totalPotongan)}</td>
              </>
            )
          }
        />
      </div>
    </div>
  );
};

export const LaporanSIMDTH = () => {
  const { dataSPJ } = useAppStore();
  const tableRef = useRef(null);

  const tableData = useMemo(() => {
    const list = [];
    const validSPJs = (Array.isArray(dataSPJ) ? dataSPJ : []).filter(s => s.status_spj === 'Valid');
    validSPJs.forEach(spj => {
      const extractTax = (jenis, totalStr) => {
        const nominal = Number(totalStr);
        if (nominal > 0) {
          list.push({
            id_spj: spj.id_spj,
            no_resmi: spj.no_spj_resmi,
            bidang: spj.bidang,
            jenis_pajak: jenis,
            nilai_setoran: nominal,
            tanggal_bayar: spj.tanggal_bayar,
            kode_billing: spj[`billing_${jenis.toLowerCase()}`] || '-',
            ntpn: spj[`ntpn_${jenis.toLowerCase()}`] || '-',
            ntb: spj[`ntb_${jenis.toLowerCase()}`] || '-'
          });
        }
      };
      extractTax('PPN', spj.total_ppn);
      extractTax('PPh21', spj.total_pph21);
      extractTax('PPh22', spj.total_pph22);
      extractTax('PPh23', spj.total_pph23);
    });
    return list.sort((a, b) => new Date(b.tanggal_bayar) - new Date(a.tanggal_bayar));
  }, [dataSPJ]);

  const totalSetoran = useMemo(() => {
    return tableData.reduce((sum, item) => sum + item.nilai_setoran, 0);
  }, [tableData]);

  const handleExport = () => {
    const headers = ["No SPJ", "Bidang", "Jenis Pajak", "Kode Billing", "NTPN", "NTB", "Nilai Setoran", "Tanggal Bayar"];
    const rows = [headers, ...tableData.map(r => [
      r.no_resmi, r.bidang, r.jenis_pajak, r.kode_billing, r.ntpn, r.ntb, r.nilai_setoran, formatTanggal(r.tanggal_bayar)
    ])];
    exportToCSV(`SIMDTH_Setoran_Pajak_${new Date().getTime()}.csv`, rows);
  };

  const handleViewReport = () => {
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg">
              <Calendar size={24} className="text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Setoran Pajak (SIMDTH)</h1>
          </div>
          <p className="text-gray-500 text-sm ml-14">Laporan bukti setoran pajak (NTPN/NTB) yang sudah divalidasi</p>
        </div>
        <div className="flex gap-3 self-start md:self-center">
          <button
            onClick={handleViewReport}
            className="px-5 py-2.5 text-sm font-bold bg-white border border-gray-200 text-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
          >
            <Eye size={16} /> Lihat Laporan
          </button>
          <button
            onClick={handleExport}
            disabled={tableData.length === 0}
            className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
          >
            <Download size={16} /> Download CSV
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <SummaryCard
          title="Total Nilai Setoran Pajak"
          value={formatRupiah(totalSetoran)}
          icon={Wallet}
          color="teal"
          subValue={`Dari ${tableData.length} bukti setor`}
          badge="Tervalidasi"
        />
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Status Sinkronisasi DJP</p>
            <p className="text-lg font-bold text-gray-900">NTPN/NTB Tervalidasi</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-xl">
            <CheckCircle2 size={24} className="text-blue-600" />
          </div>
        </div>
      </div>

      {/* Data Table Section */}
      <div ref={tableRef}>
        <ModernTable
          headers={["No SPJ / Bidang", "Jenis & Billing", "Bukti Setor (NTPN/NTB)", "Nilai Setoran"]}
          data={tableData}
          renderRow={(r, i) => (
            <tr key={i} className="hover:bg-blue-50/30 transition-colors duration-150">
              <td className="px-5 py-4">
                <div className="font-bold text-gray-900 text-sm mb-0.5">{r.no_resmi}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">{r.bidang}</div>
              </td>
              <td className="px-5 py-4">
                <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 rounded-md font-bold text-[10px] mb-1">
                  {r.jenis_pajak}
                </span>
                <div className="text-[10px] font-mono text-gray-500 mt-1">{r.kode_billing}</div>
              </td>
              <td className="px-5 py-4">
                <div className="font-bold text-gray-900 font-mono text-xs">{r.ntpn}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{r.ntb}</div>
              </td>
              <td className="px-5 py-4 text-right font-bold text-gray-900 pr-8">
                {formatRupiah(r.nilai_setoran)}
                <div className="text-[10px] font-normal text-gray-400 mt-0.5">{formatTanggal(r.tanggal_bayar)}</div>
              </td>
            </tr>
          )}
          emptyMessage="Belum ada setoran pajak yang divalidasi"
          totalRow={
            tableData.length > 0 && (
              <>
                <td colSpan="3" className="px-6 py-4 text-sm font-semibold text-gray-700">Total Seluruh Setoran</td>
                <td className="px-6 py-4 text-right font-bold text-gray-900 text-lg pr-8">{formatRupiah(totalSetoran)}</td>
              </>
            )
          }
        />
      </div>
    </div>
  );
};