import React, { useState, useMemo } from 'react';
import { FileText, Printer, CheckSquare, Search } from 'lucide-react';
import { InputField, SelectField, SearchableSelect, ConfirmDialog } from '../SharedUI';
import { theme, GAS_URL } from '../../config/constants';
import { formatRupiah, formatTanggal } from '../../utils/helpers';
import { useAppStore } from '../../store/useAppStore';
import { guOptions } from './RealisasiUtils';

export const FormCetakSPJ = () => {
  const {
    rekenings, subKegiatans, realisasiGU, setRealisasiGU,
    dataSPJ, setDataSPJ, setPrintData,
    printedNotes, setPrintedNotes, buatSPJBundle, modal, showToast, settings
  } = useAppStore();

  const [filter, setFilter] = useState({ 
    tahun_anggaran: settings.activeTahun, 
    tahap_anggaran: settings.activeTahap, 
    bulan_spj: '', proses_gu: 'GU-01', kode_subkegiatan: '', selectedGroupKey: '' 
  });
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [showModalBidang, setShowModalBidang] = useState(false);
  const [inputBidang, setInputBidang] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', onConfirm: null });

  const availableRekenings = useMemo(() => (rekenings || []).filter(r => 
    String(r.tahun_anggaran) === String(filter.tahun_anggaran) && 
    String(r.tahap_anggaran) === String(filter.tahap_anggaran) && 
    String(r.kode_subkegiatan) === String(filter.kode_subkegiatan)
  ), [rekenings, filter.tahun_anggaran, filter.tahap_anggaran, filter.kode_subkegiatan]);

  // Grouping rekenings by code and package (same logic as input)
  const accountGroups = useMemo(() => {
    const groups = new Map();
    availableRekenings.forEach(r => {
      const key = `${r.kode_rekening}-${r.paket_belanja || ''}`;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          kode_rekening: r.kode_rekening,
          nama_rekening: r.nama_rekening,
          paket_belanja: r.paket_belanja,
          itemTimestamps: []
        });
      }
      groups.get(key).itemTimestamps.push(r.timestamp);
    });
    return Array.from(groups.values());
  }, [availableRekenings]);

  const selectedGroup = useMemo(() => 
    accountGroups.find(g => g.key === filter.selectedGroupKey),
  [accountGroups, filter.selectedGroupKey]);

  const availableNotes = useMemo(() => {
    if (!selectedGroup) return [];
    const realData = Array.isArray(realisasiGU) ? realisasiGU : [];
    // Filter based on the selected group's account/package
    return realData.filter(r =>
      String(r.tahun_anggaran) === String(filter.tahun_anggaran) &&
      String(r.tahap_anggaran) === String(filter.tahap_anggaran) &&
      (filter.bulan_spj ? String(r.bulan_spj) === String(filter.bulan_spj) : true) &&
      String(r.proses_gu) === String(filter.proses_gu) &&
      selectedGroup.itemTimestamps.includes(r.rekening_id) &&
      (!r.status_nota || r.status_nota === 'Draft')
    );
  }, [realisasiGU, filter, selectedGroup]);

  const handleCheckbox = (noteTimestamp) => {
    if (selectedNotes.includes(noteTimestamp)) setSelectedNotes(selectedNotes.filter(ts => ts !== noteTimestamp));
    else setSelectedNotes([...selectedNotes, noteTimestamp]);
  };

  const handleCetakClick = () => {
    if (selectedNotes.length === 0) return showToast('Pilih minimal 1 nota!', 'error');
    setShowModalBidang(true);
  };

  const proceedBuatSPJ = async () => {
    if (!inputBidang) return showToast('Pilih Nama Bidang!', 'error');
    if (!selectedGroup) return showToast('Pilih Rekening Belanja!', 'error');
    
    setIsSubmitting(true);
    
    const selectedData = availableNotes.filter(n => selectedNotes.includes(n.id_nota || n.timestamp));
    const total_kotor = selectedData.reduce((sum, n) => sum + Number(n.nominal_nota || 0), 0);
    const total_ppn = selectedData.reduce((sum, n) => sum + Number(n.ppn || 0), 0);
    const total_pph21 = selectedData.reduce((sum, n) => sum + Number(n.pph21 || 0), 0);
    const total_pph22 = selectedData.reduce((sum, n) => sum + Number(n.pph22 || 0), 0);
    const total_pph23 = selectedData.reduce((sum, n) => sum + Number(n.pph23 || 0), 0);

    const tsNow = new Date().getTime();
    const id_spj = `SPJ-${tsNow}${Math.random().toString().slice(2, 6)}`;
    
    // Pass the actual id_nota values for the backend to match against
    const notesIds = selectedData.map(n => n.id_nota || n.timestamp);

    const success = await buatSPJBundle({
      bidang: inputBidang,
      id_spj: id_spj,
      notes: notesIds,
      proses_gu: filter.proses_gu,
      total_kotor,
      total_ppn,
      total_pph21,
      total_pph22,
      total_pph23
    });
    
    if (success) {
      setSelectedNotes([]);
      setShowModalBidang(false);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center"><Printer className="mr-2" /> Pengajuan & Bundling SPJ</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-xl border">
          <SelectField label="Tahun" value={filter.tahun_anggaran} disabled onChange={() => {}}>
            <option value={settings.activeTahun}>{settings.activeTahun}</option>
          </SelectField>
          <SelectField label="Tahap" value={filter.tahap_anggaran} disabled onChange={() => {}}>
            <option value={settings.activeTahap}>{settings.activeTahap}</option>
          </SelectField>
          <SelectField label="Bulan SPJ" value={filter.bulan_spj} onChange={e => setFilter({ ...filter, bulan_spj: e.target.value })}>
            <option value="">-- Semua Bulan --</option>
            {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(b => <option key={b} value={b}>{b}</option>)}
          </SelectField>
          <SelectField label="Proses (GU/LS)" value={filter.proses_gu} onChange={e => setFilter({ ...filter, proses_gu: e.target.value })}>
            {guOptions.map(gu => <option key={gu} value={gu}>{gu}</option>)}
          </SelectField>
          <div className="md:col-span-2">
            <SearchableSelect
              label="Sub Kegiatan"
              value={filter.kode_subkegiatan}
              onChange={val => setFilter({ ...filter, kode_subkegiatan: val, selectedGroupKey: '' })}
              options={(subKegiatans || []).map(s => ({ value: s.kode_subkegiatan, label: `[${s.kode_subkegiatan}] ${s.nama_subkegiatan}` }))}
            />
          </div>
          <div className="md:col-span-2">
            <SearchableSelect
              label="Rekening Belanja"
              value={filter.selectedGroupKey}
              onChange={val => setFilter({ ...filter, selectedGroupKey: val })}
              options={accountGroups.map(g => ({ 
                value: g.key, 
                label: `[${g.kode_rekening}] ${g.nama_rekening}`, 
                sublabel: g.paket_belanja ? `📦 Paket: ${g.paket_belanja}` : '📂 Tanpa Paket' 
              }))}
            />
          </div>
        </div>

        {filter.proses_gu === 'LS' && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg mb-6">
            ℹ️ Informasi: Pencairan LS tidak perlu dicetak fisik dokumen SPJ-nya karena sudah disediakan Bapenda. 
          </div>
        )}

        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0A192F] text-white">
              <tr>
                <th className="p-4 w-10"><CheckSquare size={16} /></th>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Rincian Barang / Vendor</th>
                <th className="p-4 text-right">Volume</th>
                <th className="p-4 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody>
              {availableNotes.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-gray-400 italic">Data tidak ditemukan.</td></tr>
              ) : availableNotes.map(n => {
                const rek = rekenings.find(r => String(r.timestamp) === String(n.rekening_id));
                const itemKey = n.id_nota || n.timestamp;
                const isSelected = selectedNotes.includes(itemKey);
                
                return (
                  <tr key={itemKey} onClick={() => handleCheckbox(itemKey)} className={`cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                    <td className="p-4"><input type="checkbox" checked={isSelected} readOnly /></td>
                    <td className="p-4">{formatTanggal(n.tanggal_nota)}</td>
                    <td className="p-4">
                      <div className="font-bold text-[#0A192F]">{rek?.uraian_barang || rek?.nama_rekening || 'Tanpa Nama'}</div>
                      <div className="text-[11px] text-gray-500 uppercase tracking-tighter">🏢 {n.nama_vendor}</div>
                    </td>
                    <td className="p-4 text-right font-medium">
                      {n.volume_nota || '-'} <span className="text-[10px] text-gray-400">{n.satuan_nota || rek?.satuan}</span>
                    </td>
                    <td className="p-4 text-right font-black text-[#0A192F]">{formatRupiah(n.nominal_nota)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {selectedNotes.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button onClick={handleCetakClick} className="px-8 py-3 bg-[#0A192F] text-white font-bold rounded-xl shadow-lg">
              Buat SPJ ({selectedNotes.length} Nota)
            </button>
          </div>
        )}
      </div>

      {showModalBidang && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Pilih Bidang Pengaju</h3>
            <SelectField label="Nama Bidang" value={inputBidang} onChange={e => setInputBidang(e.target.value)}>
              <option value="">-- Pilih --</option>
              <option value="Sekretariat">Sekretariat</option>
              <option value="Bidang PPTK">Bidang PPTK</option>
              <option value="Bidang HI">Bidang HI</option>
            </SelectField>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModalBidang(false)} className="px-4 py-2 border rounded">Batal</button>
              <button onClick={proceedBuatSPJ} disabled={isSubmitting} className="px-6 py-2 bg-[#0A192F] text-white rounded font-bold">
                {isSubmitting ? 'Memproses...' : 'Ajukan SPJ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
