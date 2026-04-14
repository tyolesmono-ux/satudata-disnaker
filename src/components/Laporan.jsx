import React, { useState, useMemo } from 'react';
import { Download, Filter, ReceiptText, ShieldCheck, FileText } from 'lucide-react';
import { SelectField } from './SharedUI';
import { formatRupiah, formatTanggal } from '../utils/helpers';

// Helper Export CSV
const exportToCSV = (filename, rows) => {
  const csvContent = rows.map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const LaporanRekapGU = ({ realisasiGU, rekenings, subKegiatans }) => {
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString());
  const [filterTahap, setFilterTahap] = useState('APBD');
  const [filterGU, setFilterGU] = useState('GU-01');

  const guOptions = Array.from({ length: 24 }, (_, i) => `GU-${String(i + 1).padStart(2, '0')}`);
  guOptions.push('GU-Nihil');

  const reportData = useMemo(() => {
    const filtered = realisasiGU.filter(r => 
      String(r.tahun_anggaran) === filterTahun && 
      String(r.tahap_anggaran) === filterTahap && 
      r.proses_gu === filterGU && 
      r.status_nota !== 'Ditolak'
    );

    // Grouping PPh21: Sama seperti di PrintLayout
    const isPph21 = (n) => Number(n.pph21) > 0 || String(n.kop_pajak || '').startsWith('21-');
    const result = [];
    const pph21Groups = {};

    filtered.forEach(n => {
      if (isPph21(n)) {
        const key = `${n.tanggal_nota}|||${n.keterangan_nota}`;
        if (!pph21Groups[key]) {
          pph21Groups[key] = {
            ...n,
            nominal_nota: 0,
            ppn: 0, pph21: 0, pph22: 0, pph23: 0,
            _count: 0
          };
        }
        pph21Groups[key].nominal_nota = Number(pph21Groups[key].nominal_nota) + Number(n.nominal_nota);
        pph21Groups[key].ppn = Number(pph21Groups[key].ppn) + Number(n.ppn);
        pph21Groups[key].pph21 = Number(pph21Groups[key].pph21) + Number(n.pph21);
        pph21Groups[key].pph22 = Number(pph21Groups[key].pph22) + Number(n.pph22);
        pph21Groups[key].pph23 = Number(pph21Groups[key].pph23) + Number(n.pph23);
        pph21Groups[key]._count += 1;
      } else {
        result.push(n);
      }
    });

    Object.values(pph21Groups).forEach(group => {
      result.push({
        ...group,
        keterangan_nota: `${group.keterangan_nota} (Daftar Terlampir: ${group._count} Orang)`
      });
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

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 animate-in fade-in">
      <h2 className="text-xl font-bold mb-6 pb-2 border-b flex items-center text-[#0A192F]"><ReceiptText size={20} className="mr-2 text-[#D4AF37]" /> Rekapitulasi Proses GU</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border">
        <SelectField label="Tahun" value={filterTahun} onChange={e => setFilterTahun(e.target.value)}>
          {Array.from(new Set(rekenings.map(r => String(r.tahun_anggaran)))).sort((a,b) => b-a).map(y => <option key={y} value={y}>{y}</option>)}
        </SelectField>
        <SelectField label="Tahap" value={filterTahap} onChange={e => setFilterTahap(e.target.value)}>
          <option value="APBD">APBD</option><option value="Pergeseran 1">Pergeseran 1</option><option value="Pergeseran 2">Pergeseran 2</option><option value="Perubahan">Perubahan (PAK)</option>
        </SelectField>
        <SelectField label="Proses GU" value={filterGU} onChange={e => setFilterGU(e.target.value)}>
          {guOptions.map(gu => <option key={gu} value={gu}>{gu}</option>)}
        </SelectField>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#0A192F] text-white">
            <tr>
              <th className="p-3 border-b">Tanggal</th>
              <th className="p-3 border-b">Uraian / BPU</th>
              <th className="p-3 border-b text-right">Bruto (Rp)</th>
              <th className="p-3 border-b text-right">PPN</th>
              <th className="p-3 border-b text-right">PPh 21</th>
              <th className="p-3 border-b text-right">PPh 22</th>
              <th className="p-3 border-b text-right">PPh 23</th>
              <th className="p-3 border-b text-right">Bersih (Rp)</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {reportData.length === 0 ? (
              <tr><td colSpan="8" className="p-6 text-center text-gray-500 italic">Tidak ada data untuk kombinasi filter ini.</td></tr>
            ) : (
              reportData.map((n, i) => {
                const subTotPotongan = Number(n.ppn) + Number(n.pph21) + Number(n.pph22) + Number(n.pph23);
                const bersih = Number(n.nominal_nota) - subTotPotongan;
                const isPph21 = Number(n.pph21) > 0;
                
                return (
                  <tr key={i} className={`hover:bg-gray-50 transition-colors ${isPph21 ? 'bg-orange-50/30' : ''}`}>
                    <td className="p-3">{formatTanggal(n.tanggal_nota)}</td>
                    <td className="p-3 font-medium">
                      {n.keterangan_nota}
                      {isPph21 && <span className="ml-2 text-[10px] bg-orange-100 text-orange-700 px-1 rounded uppercase font-bold">PPh21</span>}
                    </td>
                    <td className="p-3 text-right font-semibold">{formatRupiah(n.nominal_nota)}</td>
                    <td className="p-3 text-right text-gray-400">{Number(n.ppn) > 0 ? formatRupiah(n.ppn) : '-'}</td>
                    <td className="p-3 text-right font-bold text-orange-700">{Number(n.pph21) > 0 ? formatRupiah(n.pph21) : '-'}</td>
                    <td className="p-3 text-right text-gray-400">{Number(n.pph22) > 0 ? formatRupiah(n.pph22) : '-'}</td>
                    <td className="p-3 text-right text-gray-400">{Number(n.pph23) > 0 ? formatRupiah(n.pph23) : '-'}</td>
                    <td className="p-3 text-right font-bold text-[#0A192F]">{formatRupiah(bersih)}</td>
                  </tr>
                );
              })
            )}
            {reportData.length > 0 && (
              <tr className="bg-blue-50 font-bold text-[#0A192F] border-t-2 border-[#0A192F]">
                <td colSpan="2" className="p-4 text-center tracking-wide">TOTAL KESELURUHAN</td>
                <td className="p-4 text-right text-black">{formatRupiah(totals.bruto)}</td>
                <td className="p-4 text-right">{formatRupiah(totals.ppn)}</td>
                <td className="p-4 text-right">{formatRupiah(totals.pph21)}</td>
                <td className="p-4 text-right">{formatRupiah(totals.pph22)}</td>
                <td className="p-4 text-right">{formatRupiah(totals.pph23)}</td>
                <td className="p-4 text-right text-lg text-green-700">{formatRupiah(totalBersih)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const LaporanCoreTax = ({ realisasiGU }) => {
  const [jenisPajak, setJenisPajak] = useState('BPU'); // BPU, BP21, PPN

  const filteredData = useMemo(() => {
    return realisasiGU.filter(r => {
      if (r.status_nota === 'Ditolak') return false;
      if (jenisPajak === 'BPU') return Number(r.pph22) > 0 || Number(r.pph23) > 0;
      if (jenisPajak === 'BP21') return Number(r.pph21) > 0;
      if (jenisPajak === 'PPN') return Number(r.ppn) > 0;
      return false;
    });
  }, [realisasiGU, jenisPajak]);

  const handleExport = () => {
    const headers = ["Tanggal", "Penyedia/Vendor", "NPWP/NIK", "Nominal Bruto", "KOP", "KAP", "KJS", "Potongan Pajak"];
    const rows = [headers];
    filteredData.forEach(r => {
      let potongan = 0;
      if (jenisPajak === 'BPU') potongan = Number(r.pph22) + Number(r.pph23);
      if (jenisPajak === 'BP21') potongan = Number(r.pph21);
      if (jenisPajak === 'PPN') potongan = Number(r.ppn);
      
      rows.push([
        r.tanggal_nota,
        `"${r.nama_vendor}"`,
        `'${r.nik_vendor}'`, // Quote to prevent scientific notation in excel
        r.nominal_nota,
        r.kop_pajak || '-',
        r.kap_pajak || '-',
        r.kjs_pajak || '-',
        potongan
      ]);
    });
    exportToCSV(`Laporan_CoreTax_${jenisPajak}_${new Date().getTime()}.csv`, rows);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 animate-in fade-in">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-xl font-bold flex items-center text-[#0A192F]">
          <ShieldCheck size={20} className="mr-2 text-[#D4AF37]" /> Laporan Perpajakan (CoreTax)
        </h2>
        <button onClick={handleExport} disabled={filteredData.length === 0} className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#b8952b] text-[#0A192F] font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="w-full md:w-1/3 mb-6">
        <SelectField label="Jenis Potongan Pajak" value={jenisPajak} onChange={e => setJenisPajak(e.target.value)}>
          <option value="BPU">BPU (PPh 22 & PPh 23)</option>
          <option value="BP21">BP21 (PPh 21)</option>
          <option value="PPN">PPN</option>
        </SelectField>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#0A192F] text-white">
            <tr>
              <th className="p-3 border-b">Tanggal</th>
              <th className="p-3 border-b">Vendor / Penerima</th>
              <th className="p-3 border-b">NPWP / NIK</th>
              <th className="p-3 border-b text-right">Nominal Bruto</th>
              <th className="p-3 border-b text-center">KOP</th>
              <th className="p-3 border-b text-center">KAP</th>
              <th className="p-3 border-b text-center">KJS</th>
              <th className="p-3 border-b text-right">Potongan Pajak</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredData.length === 0 ? (
              <tr><td colSpan="8" className="p-6 text-center text-gray-500 italic">Tidak ada rekam pajak untuk jenis ini.</td></tr>
            ) : (
              filteredData.map((r, i) => {
                let pot = 0;
                if (jenisPajak === 'BPU') pot = Number(r.pph22) + Number(r.pph23);
                if (jenisPajak === 'BP21') pot = Number(r.pph21);
                if (jenisPajak === 'PPN') pot = Number(r.ppn);

                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-3 whitespace-nowrap">{formatTanggal(r.tanggal_nota)}</td>
                    <td className="p-3">{r.nama_vendor}</td>
                    <td className="p-3 font-mono text-xs">{r.nik_vendor}</td>
                    <td className="p-3 text-right">{formatRupiah(r.nominal_nota)}</td>
                    <td className="p-3 text-center font-mono">{r.kop_pajak || '-'}</td>
                    <td className="p-3 text-center font-mono">{r.kap_pajak || '-'}</td>
                    <td className="p-3 text-center font-mono">{r.kjs_pajak || '-'}</td>
                    <td className="p-3 text-right font-bold text-red-600">{formatRupiah(pot)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const LaporanSIMDTH = ({ dataSPJ }) => {
  const tableData = useMemo(() => {
    const list = [];
    const validSPJs = dataSPJ.filter(s => s.status_spj === 'Valid');
    
    validSPJs.forEach(spj => {
      // Parse array tax from valid SPJ
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

    return list.sort((a,b) => new Date(b.tanggal_bayar) - new Date(a.tanggal_bayar));
  }, [dataSPJ]);

  const handleExport = () => {
    const headers = ["ID SPJ", "No Resmi", "Bidang", "Jenis Pajak", "Kode Billing", "NTPN", "NTB", "Nilai Setoran", "Tanggal Setor"];
    const rows = [headers];
    tableData.forEach(r => {
      rows.push([
        r.id_spj, r.no_resmi, `"${r.bidang}"`, r.jenis_pajak,
        `'${r.kode_billing}'`, `'${r.ntpn}'`, `'${r.ntb}'`,
        r.nilai_setoran, r.tanggal_bayar
      ]);
    });
    exportToCSV(`Laporan_eBilling_SIMDTH_${new Date().getTime()}.csv`, rows);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 animate-in fade-in">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-xl font-bold flex items-center text-[#0A192F]">
          <FileText size={20} className="mr-2 text-[#D4AF37]" /> Laporan Setoran Pajak (SIMDTH)
        </h2>
        <button onClick={handleExport} disabled={tableData.length === 0} className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#b8952b] text-[#0A192F] font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#0A192F] text-white">
            <tr>
              <th className="p-3 border-b">SPJ Ref</th>
              <th className="p-3 border-b">Bidang</th>
              <th className="p-3 border-b text-center">Jenis</th>
              <th className="p-3 border-b text-center">Kode Billing</th>
              <th className="p-3 border-b text-center">NTPN</th>
              <th className="p-3 border-b text-center">NTB</th>
              <th className="p-3 border-b text-right">Nilai Setoran</th>
              <th className="p-3 border-b text-center">Tgl Setor</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tableData.length === 0 ? (
              <tr><td colSpan="8" className="p-6 text-center text-gray-500 italic">Tidak ada data setoran pajak SPJ valid.</td></tr>
            ) : (
              tableData.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-bold text-xs">{r.no_resmi}</div>
                    <div className="text-[10px] text-gray-500 font-mono">{r.id_spj}</div>
                  </td>
                  <td className="p-3">{r.bidang}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-bold text-xs">{r.jenis_pajak}</span>
                  </td>
                  <td className="p-3 text-center font-mono max-w-[120px] truncate" title={r.kode_billing}>{r.kode_billing}</td>
                  <td className="p-3 text-center font-mono font-bold text-[#0A192F]">{r.ntpn}</td>
                  <td className="p-3 text-center font-mono text-gray-500">{r.ntb}</td>
                  <td className="p-3 text-right font-bold">{formatRupiah(r.nilai_setoran)}</td>
                  <td className="p-3 text-center whitespace-nowrap">{formatTanggal(r.tanggal_bayar)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
