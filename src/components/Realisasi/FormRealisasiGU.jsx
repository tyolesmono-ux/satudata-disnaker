import React, { useState, useMemo, useEffect } from 'react';
import { FileText, CheckSquare, Save, PlusCircle, ArrowRightCircle, ListChecks, Calculator, Search } from 'lucide-react';
import { InputField, SelectField, SearchableSelect, ConfirmDialog } from '../SharedUI';
import { theme, GAS_URL } from '../../config/constants';
import { formatRupiah, formatTanggal } from '../../utils/helpers';
import { useAppStore } from '../../store/useAppStore';
import { guOptions, calculateRemaining, getResetData, calcMasalPph21 } from './RealisasiUtils';

export const FormRealisasiGU = () => {
  const {
    subKegiatans, rekenings, realisasiGU, setRealisasiGU,
    pegawaiASN, wpPribadi, wpPihakKetiga, showToast, kop21, kopUNI,
    handleSaveData, batchInsertRealisasi, modal, token,
    settings
  } = useAppStore();

  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', onConfirm: null });
  const [saveMode, setSaveMode] = useState('selesai');

  const isLoading = modal.show && modal.status === 'loading';
  const [formData, setFormData] = useState({
    tahun_anggaran: settings.activeTahun,
    tahap_anggaran: settings.activeTahap,
    bulan_spj: '', proses_gu: 'GU-01',
    kode_subkegiatan: '',
    selectedGroupKey: '', // Key for account group
    tanggal_nota: '', keterangan_nota: '',
    nik_vendor: '', nama_vendor: '', punya_npwp: false,
    tipe_vendor: '', golongan_vendor: '',
    kategori_pajak: '', kop_pajak: '',
    ppn: 0, pph21: 0, pph22: 0, pph23: 0
  });

  // Grid states
  const [gridVolumes, setGridVolumes] = useState({});
  const [gridSearch, setGridSearch] = useState('');

  // Mode Input masal PPh21
  const [inputMode, setInputMode] = useState('satuan');
  const [masalTab, setMasalTab] = useState('transport');
  const [masalSearch, setMasalSearch] = useState('');
  const [masalChecked, setMasalChecked] = useState(new Set());
  const [masalNominal, setMasalNominal] = useState('');
  const [masalNominals, setMasalNominals] = useState({});
  const [isMasalSubmitting, setIsMasalSubmitting] = useState(false);
  
  useEffect(() => {
    setFormData(prev => ({ ...prev, tahun_anggaran: settings.activeTahun, tahap_anggaran: settings.activeTahap }));
  }, [settings]);

  const masterVendor = useMemo(() => {
    const list = formData.kategori_pajak && formData.kategori_pajak !== 'PPh21'
      ? (wpPihakKetiga || [])
      : [
        ...(pegawaiASN || []).map(p => ({ ...p, tipe: 'ASN' })),
        ...(wpPribadi || []).map(p => ({ ...p, tipe: 'Pribadi' })),
        ...(wpPihakKetiga || []).map(p => ({ ...p, tipe: 'Pihak Ketiga' }))
      ];

    return list.map(p => ({
      ...p,
      tipe: p.tipe || 'Pihak Ketiga',
      nama: p.nama_usaha || p.nama || p.nama_pemilik || 'Tanpa Nama'
    }));
  }, [pegawaiASN, wpPribadi, wpPihakKetiga, formData.kategori_pajak]);

  const availableRekenings = useMemo(() => (rekenings || []).filter(r =>
    String(r.tahun_anggaran) === String(formData.tahun_anggaran) &&
    String(r.tahap_anggaran) === String(formData.tahap_anggaran) &&
    String(r.kode_subkegiatan) === String(formData.kode_subkegiatan)
  ), [rekenings, formData.tahun_anggaran, formData.tahap_anggaran, formData.kode_subkegiatan]);

  // Grouping rekenings by code and package
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
          items: []
        });
      }
      groups.get(key).items.push(r);
    });
    return Array.from(groups.values());
  }, [availableRekenings]);

  const selectedGroup = useMemo(() =>
    accountGroups.find(g => g.key === formData.selectedGroupKey),
    [accountGroups, formData.selectedGroupKey]);

  // Items with their calculated stats
  const gridItems = useMemo(() => {
    if (!selectedGroup) return [];
    let items = selectedGroup.items.map(item => {
      const stats = calculateRemaining(item.timestamp, rekenings, realisasiGU);
      return { ...item, stats };
    });
    if (gridSearch) {
      const kw = gridSearch.toLowerCase();
      items = items.filter(i => i.uraian_barang.toLowerCase().includes(kw));
    }
    return items;
  }, [selectedGroup, rekenings, realisasiGU, gridSearch]);

  // Calculate total bruto for the entire grid
  const totalBrutoGrid = useMemo(() => {
    // We calculate based on ALL volumes entered, even if hidden by search
    return Object.keys(gridVolumes).reduce((sum, tid) => {
      const item = availableRekenings.find(r => r.timestamp === tid);
      if (!item) return sum;
      const stats = calculateRemaining(tid, rekenings, realisasiGU);
      const vol = Number(gridVolumes[tid] || 0);
      return sum + (vol * stats.hargaSatuan);
    }, 0);
  }, [gridVolumes, availableRekenings, rekenings, realisasiGU]);

  const groupStats = useMemo(() => {
    if (!selectedGroup) return { totalPagu: 0, sisaPagu: 0 };
    let totalPagu = 0;
    let paguTerpakai = 0;
    selectedGroup.items.forEach(item => {
      const stats = calculateRemaining(item.timestamp, rekenings, realisasiGU);
      totalPagu += stats.paguTotal;
      paguTerpakai += stats.paguTerpakai;
    });
    return { totalPagu, sisaPagu: totalPagu - paguTerpakai };
  }, [selectedGroup, rekenings, realisasiGU]);

  const handleSelectVendor = (v) => {
    const npwpStr = String(v.npwp || v.NPWP || '');
    const hasNpwp = npwpStr.length > 0 && npwpStr !== '-' && npwpStr !== '0';
    setFormData({
      ...formData,
      nik_vendor: v.nik || v.NIK || '',
      nama_vendor: v.nama,
      punya_npwp: hasNpwp,
      tipe_vendor: v.tipe,
      golongan_vendor: v.golongan || ''
    });
  };

  const parseKOP = (kategori, kopVal) => {
    if (kategori === 'PPh22 + PPN') {
      return { kop_pajak: 'PPN-920-01 | 22-910-01', kap_pajak: '411211 | 411122', kjs_pajak: '920 | 910', nop_pajak: '01 | 01' };
    }
    if (!kopVal) return { kop_pajak: '', kap_pajak: '', kjs_pajak: '', nop_pajak: '' };
    const parts = kopVal.split('-');
    const prefix = parts[0] || '';
    const kjs = parts[1] || '';
    const nop = parts[2] || '';
    let kap = '';
    if (prefix === '21') kap = '411121';
    else if (prefix === '24') kap = '411124';
    return { kop_pajak: kopVal, kap_pajak: kap, kjs_pajak: kjs, nop_pajak: nop };
  };

  const calculateTaxes = (nominal, kategori, dataState) => {
    const nom = Number(nominal) || 0;
    let calcPpn = 0, calcPph21 = 0, calcPph22 = 0, calcPph23 = 0;
    
    if (kategori === 'PPh21') {
      if (dataState.tipe_vendor === 'ASN') {
        if (dataState.golongan_vendor === 'III') calcPph21 = Math.round(nom * 0.05);
        else if (dataState.golongan_vendor === 'IV') calcPph21 = Math.round(nom * 0.15);
      } else {
        calcPph21 = dataState.punya_npwp ? Math.round(nom * 0.03) : Math.round(nom * 0.06);
      }
    }
    else if (kategori === 'PPh22 + PPN') {
      if (nom > 2000000) { 
        calcPpn = Math.round(nom * 0.11); 
        calcPph22 = dataState.punya_npwp ? Math.round(nom * 0.015) : Math.round(nom * 0.03); 
      }
    }
    else if (kategori === 'PPh23') {
      calcPph23 = dataState.punya_npwp ? Math.round(nom * 0.02) : Math.round(nom * 0.04);
    }
    
    return { ppn: calcPpn, pph21: calcPph21, pph22: calcPph22, pph23: calcPph23 };
  };

  // Auto-calculate taxes when total bruto changes
  useEffect(() => {
    if (!formData.kategori_pajak || totalBrutoGrid <= 0) {
      setFormData(prev => ({ ...prev, ppn: 0, pph21: 0, pph22: 0, pph23: 0 }));
      return;
    }
    const taxes = calculateTaxes(totalBrutoGrid, formData.kategori_pajak, formData);
    setFormData(prev => ({ ...prev, ...taxes }));
  }, [totalBrutoGrid, formData.kategori_pajak, formData.tipe_vendor, formData.golongan_vendor, formData.punya_npwp]);

  const handleKategoriChange = (val) => {
    const parsed = parseKOP(val, '');
    setFormData(prev => ({ 
      ...prev, 
      kategori_pajak: val, 
      ...parsed,
      ppn: 0, pph21: 0, pph22: 0, pph23: 0 
    }));
  };

  const handleSubmitGrid = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // Find all items in the store that have a volume entered in gridVolumes
    const activeItems = availableRekenings.filter(r => Number(gridVolumes[r.timestamp]) > 0);

    if (activeItems.length === 0) return showToast('Harap isi volume minimal 1 rincian belanja!', 'error');

    // Check volume limits
    for (const item of activeItems) {
      const stats = calculateRemaining(item.timestamp, rekenings, realisasiGU);
      if (Number(gridVolumes[item.timestamp]) > stats.volumeSisa) {
        return showToast(`Volume "${item.uraian_barang}" melebihi sisa anggaran!`, 'error');
      }
    }

    setConfirmDialog({
      show: true,
      title: 'Konfirmasi Simpan Realisasi',
      message: `Anda akan menyimpan ${activeItems.length} rincian belanja dengan total bruto ${formatRupiah(totalBrutoGrid)}. Lanjutkan?`,
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, show: false }));
        proceedSaveGrid(activeItems);
      }
    });
  };

  const proceedSaveGrid = async (activeItems) => {
    // Check if total qualifies for PPh 22 threshold (> 2jt)
    const isPPh22Qualified = formData.kategori_pajak === 'PPh22 + PPN' && totalBrutoGrid > 2000000;

    const itemsToSave = activeItems.map(item => {
      const stats = calculateRemaining(item.timestamp, rekenings, realisasiGU);
      const nominal = Number(gridVolumes[item.timestamp]) * stats.hargaSatuan;
      
      // Calculate tax for THIS specific item
      let itemPpn = 0, itemPph21 = 0, itemPph22 = 0, itemPph23 = 0;
      
      if (formData.kategori_pajak === 'PPh21') {
        if (formData.tipe_vendor === 'ASN') {
          if (formData.golongan_vendor === 'III') itemPph21 = Math.round(nominal * 0.05);
          else if (formData.golongan_vendor === 'IV') itemPph21 = Math.round(nominal * 0.15);
        } else {
          itemPph21 = formData.punya_npwp ? Math.round(nominal * 0.03) : Math.round(nominal * 0.06);
        }
      } else if (formData.kategori_pajak === 'PPh22 + PPN' && isPPh22Qualified) {
        itemPpn = Math.round(nominal * 0.11);
        itemPph22 = formData.punya_npwp ? Math.round(nominal * 0.015) : Math.round(nominal * 0.03);
      } else if (formData.kategori_pajak === 'PPh23') {
        itemPph23 = formData.punya_npwp ? Math.round(nominal * 0.02) : Math.round(nominal * 0.04);
      }

      const { selectedGroupKey, ...cleanFormData } = formData;
      return {
        ...cleanFormData,
        kode_rekening: item.kode_rekening,
        rekening_id: item.timestamp,
        volume_nota: Number(gridVolumes[item.timestamp]),
        satuan_nota: item.satuan,
        nominal_nota: nominal,
        ppn: itemPpn,
        pph21: itemPph21,
        pph22: itemPph22,
        pph23: itemPph23
      };
    });

    const success = await batchInsertRealisasi(itemsToSave);
    if (success) {
      setGridVolumes({});
      setGridSearch('');
      setFormData(getResetData('selesai', formData, settings));
    }
  };

  const masalPersons = useMemo(() => {
    const source = masalTab === 'transport' ? (wpPribadi || []) : (pegawaiASN || []);
    return (source || []).map((p, idx) => ({
      id: `${masalTab}-${p.nik || p.nip || idx}`,
      nik: String(p.nik || '').replace(/^'/, ''),
      nip: masalTab === 'honor' ? String(p.nip || '').replace(/^'/, '') : '',
      nama: p.nama,
      npwp: p.npwp,
      golongan: p.golongan,
      tipe: masalTab === 'transport' ? 'Pribadi' : 'ASN'
    }));
  }, [masalTab, wpPribadi, pegawaiASN]);

  const handleMasalSubmit = async () => {
    const checked = masalPersons.filter(p => masalChecked.has(p.id));
    const items = checked.map(p => ({
      ...formData,
      nik_vendor: p.nik,
      nama_vendor: p.nama,
      nominal_nota: masalTab === 'transport' ? Number(masalNominal) : Number(masalNominals[p.id]) || 0,
      volume_nota: 1,
      satuan_nota: 'Orang',
      tipe_vendor: p.tipe,
      golongan_vendor: p.golongan
    }));
    const success = await batchInsertRealisasi(items);
    if (success) {
      setMasalChecked(new Set());
      setFormData(getResetData('selesai', formData, settings));
    }
  };

  const isPph21 = formData.kategori_pajak === 'PPh21';
  const showMasalPanel = isPph21 && inputMode === 'masal' && formData.selectedGroupKey;

  const masalSummary = useMemo(() => {
    const checked = masalPersons.filter(p => masalChecked.has(p.id));
    let totalNominal = 0, totalPph21 = 0;
    checked.forEach(p => {
      const nom = masalTab === 'transport' ? Number(masalNominal) || 0 : Number(masalNominals[p.id]) || 0;
      totalNominal += nom;
      totalPph21 += calcMasalPph21(p, nom);
    });
    return { count: checked.length, totalNominal, totalPph21 };
  }, [masalChecked, masalPersons, masalTab, masalNominal, masalNominals]);

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 animate-in fade-in zoom-in duration-300">
      <div className="bg-[#0A192F] p-6 text-white flex justify-between items-center">
        <h2 className="text-xl font-black flex items-center gap-3"><FileText className="text-[#D4AF37]" /> INPUT REALISASI SPJ</h2>
        <div className="px-4 py-1.5 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest">{formData.proses_gu}</div>
      </div>

      <div className="p-8 space-y-8">
        {/* STEP 1: HEADER & CONTEXT */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-gray-50/80 border border-gray-100">
          <SelectField label="Tahun" value={formData.tahun_anggaran} disabled onChange={() => { }}>
            <option value={settings.activeTahun}>{settings.activeTahun}</option>
          </SelectField>
          <SelectField label="Tahap" value={formData.tahap_anggaran} disabled onChange={() => { }}>
            <option value={settings.activeTahap}>{settings.activeTahap}</option>
          </SelectField>
          <SelectField label="Bulan SPJ" value={formData.bulan_spj} onChange={e => setFormData({ ...formData, bulan_spj: e.target.value })} required>
            <option value="">-- Pilih Bulan --</option>
            {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(b => <option key={b} value={b}>{b}</option>)}
          </SelectField>
          <SelectField label="Proses (GU/LS)" value={formData.proses_gu} onChange={e => setFormData({ ...formData, proses_gu: e.target.value })} required>
            {guOptions.map(gu => <option key={gu} value={gu}>{gu}</option>)}
          </SelectField>
        </div>

        {/* STEP 2: ACCOUNT SELECTION */}
        <div className="space-y-4">
          <SearchableSelect
            label="Cari Sub Kegiatan"
            value={formData.kode_subkegiatan}
            onChange={val => {
              setFormData({ ...formData, kode_subkegiatan: val, selectedGroupKey: '' });
              setGridVolumes({});
            }}
            options={(subKegiatans || []).map(s => ({ value: s.kode_subkegiatan, label: `[${s.kode_subkegiatan}] ${s.nama_subkegiatan}` }))}
          />
          <SearchableSelect
            label="Cari Rincian Belanja (Grup Rekening)"
            value={formData.selectedGroupKey}
            onChange={val => {
              setFormData({ ...formData, selectedGroupKey: val });
              setGridVolumes({});
            }}
            options={accountGroups.map(g => ({
              value: g.key,
              label: `[${g.kode_rekening}] ${g.nama_rekening}`,
              sublabel: g.paket_belanja ? `📦 Paket: ${g.paket_belanja}` : '📂 Tanpa Paket'
            }))}
            disabled={!formData.kode_subkegiatan}
          />

          {formData.selectedGroupKey && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white rounded-2xl border-2 border-gray-100 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
                  <Calculator size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Pagu Total</p>
                  <p className="text-sm font-black text-gray-700">{formatRupiah(groupStats.totalPagu)}</p>
                </div>
              </div>
              <div className="h-8 w-px bg-gray-100 hidden sm:block"></div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Sisa Pagu</p>
                <p className="text-sm font-black text-emerald-600">{formatRupiah(groupStats.sisaPagu)}</p>
              </div>
            </div>
          )}
        </div>

        {formData.selectedGroupKey && (
          <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
            {/* STEP 3: VENDOR & TAX INFO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-[#0A192F]/5 border border-[#0A192F]/10">
              <div className="space-y-4">
                <InputField label="Tanggal Nota / Kuitansi" type="date" value={formData.tanggal_nota} onChange={e => setFormData({ ...formData, tanggal_nota: e.target.value })} required />
                <SelectField label="Kategori Pajak" value={formData.kategori_pajak} onChange={e => handleKategoriChange(e.target.value)} required>
                  <option value="">-- Pilih Jenis Pajak --</option>
                  <option value="Tanpa Pajak">Tanpa Pajak</option>
                  <option value="PPh21">PPh 21</option>
                  <option value="PPh23">PPh 23</option>
                  <option value="PPh22 + PPN">PPh 22 + PPN</option>
                </SelectField>
                {(formData.kategori_pajak === 'PPh21' || formData.kategori_pajak === 'PPh23') && (
                  <div className="md:col-span-2">
                    <SearchableSelect
                      label={formData.kategori_pajak === 'PPh21' ? "Referensi KOP PPh 21" : "Referensi KOP PPh 23"}
                      value={formData.kop_pajak}
                      onChange={val => {
                        const parsed = parseKOP(formData.kategori_pajak, val);
                        setFormData({ ...formData, ...parsed });
                      }}
                      options={(formData.kategori_pajak === 'PPh21' ? kop21 : kopUNI).map(k => ({ 
                        value: k.kode_objek_pajak, 
                        label: `${k.kode_objek_pajak} — ${k.nama_objek_pajak}` 
                      }))}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <InputField label="Uraian Aktivitas (Global)" value={formData.keterangan_nota} onChange={e => setFormData({ ...formData, keterangan_nota: e.target.value })} placeholder="Misal: Pembelian ATK Sekretariat..." required />
                <SearchableSelect
                  label="Cari Vendor / Penerima"
                  value={formData.nik_vendor}
                  onChange={val => {
                    const v = masterVendor.find(v => (v.nik || v.NIK) === val);
                    if (v) handleSelectVendor(v);
                  }}
                  options={masterVendor.map(v => ({ value: v.nik || v.NIK, label: v.nama, sublabel: v.tipe }))}
                />
                {isPph21 && (
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700">Mode Input:</span>
                    <div className="flex bg-white rounded-lg border overflow-hidden">
                      <button type="button" onClick={() => setInputMode('satuan')} className={`px-4 py-2 text-sm font-bold ${inputMode === 'satuan' ? 'bg-[#0A192F] text-white' : 'text-gray-600'}`}>📝 Grid Items</button>
                      <button type="button" onClick={() => setInputMode('masal')} className={`px-4 py-2 text-sm font-bold ${inputMode === 'masal' ? 'bg-[#0A192F] text-white' : 'text-gray-600'}`}>👥 Masal</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 4: GRID INPUT (THE CORE) */}
            {!showMasalPanel && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-[#0A192F] pb-4 gap-4">
                  <div className="space-y-1 flex-1">
                    <h3 className="font-black text-[#0A192F] flex items-center gap-2 uppercase tracking-tight"><ListChecks size={20} /> Daftar Barang</h3>
                    <div className="relative max-w-md">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={gridSearch}
                        onChange={e => setGridSearch(e.target.value)}
                        placeholder="Cari uraian barang di grup ini..."
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0A192F]/20 focus:border-[#0A192F] outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="text-right bg-[#0A192F] text-white px-6 py-3 rounded-2xl shadow-lg">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total Bruto Nota</p>
                    <p className="text-2xl font-black tracking-tighter leading-none">{formatRupiah(totalBrutoGrid)}</p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-white">
                  <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="p-4 font-bold border-b">Uraian Rincian Belanja</th>
                          <th className="p-4 font-bold text-center border-b">Satuan</th>
                          <th className="p-4 font-bold text-right border-b">Harga</th>
                          <th className="p-4 font-bold text-right border-b">Sisa Vol.</th>
                          <th className="p-4 font-bold w-32 border-b text-center">Input Vol.</th>
                          <th className="p-4 font-bold text-right border-b">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {gridItems.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="p-12 text-center text-gray-400 italic">
                              {gridSearch ? `Tidak ada barang yang cocok dengan "${gridSearch}"` : 'Memuat rincian belanja...'}
                            </td>
                          </tr>
                        ) : gridItems.map(item => {
                          const inputVol = Number(gridVolumes[item.timestamp] || 0);
                          const subtotal = inputVol * item.stats.hargaSatuan;
                          const isOver = inputVol > item.stats.volumeSisa;

                          return (
                            <tr key={item.timestamp} className={`transition-colors ${inputVol > 0 ? 'bg-blue-50/40' : 'hover:bg-gray-50/50'}`}>
                              <td className="p-4">
                                <div className="font-bold text-gray-800 leading-tight mb-1">{item.uraian_barang}</div>
                                <div className="text-[9px] text-gray-400 font-mono tracking-tighter uppercase">{item.timestamp}</div>
                              </td>
                              <td className="p-4 text-center">
                                <span className="px-2 py-1 bg-gray-100 rounded-lg text-[10px] font-bold text-gray-500">{item.satuan}</span>
                              </td>
                              <td className="p-4 text-right text-gray-500 text-xs">{formatRupiah(item.stats.hargaSatuan)}</td>
                              <td className="p-4 text-right font-bold text-gray-400">{item.stats.volumeSisa}</td>
                              <td className="p-4">
                                <input
                                  type="number"
                                  value={gridVolumes[item.timestamp] || ''}
                                  onChange={e => setGridVolumes({ ...gridVolumes, [item.timestamp]: e.target.value })}
                                  className={`w-full px-3 py-2.5 rounded-xl border-2 transition-all outline-none text-center font-black text-base shadow-inner ${inputVol > 0 ? (isOver ? 'border-red-500 bg-red-50 text-red-700' : 'border-[#0A192F] bg-white text-[#0A192F]') : 'border-gray-100 focus:border-blue-400'}`}
                                  placeholder="0"
                                />
                              </td>
                              <td className="p-4 text-right font-black text-[#0A192F]">
                                {subtotal > 0 ? formatRupiah(subtotal) : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TAX DETAILS */}
                {(formData.ppn > 0 || formData.pph21 > 0 || formData.pph22 > 0 || formData.pph23 > 0) && (
                  <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 grid grid-cols-2 md:grid-cols-4 gap-4 shadow-inner">
                    {formData.ppn > 0 && <InputField label="PPN" type="number" value={formData.ppn} onChange={e => setFormData({ ...formData, ppn: Number(e.target.value) })} />}
                    {formData.pph21 > 0 && <InputField label="PPh 21" type="number" value={formData.pph21} onChange={e => setFormData({ ...formData, pph21: Number(e.target.value) })} />}
                    {formData.pph22 > 0 && <InputField label="PPh 22" type="number" value={formData.pph22} onChange={e => setFormData({ ...formData, pph22: Number(e.target.value) })} />}
                    {formData.pph23 > 0 && <InputField label="PPh 23" type="number" value={formData.pph23} onChange={e => setFormData({ ...formData, pph23: Number(e.target.value) })} />}
                  </div>
                )}

                <div className="pt-4">
                  <button type="button" onClick={handleSubmitGrid} className="w-full py-5 bg-[#0A192F] text-[#D4AF37] font-black rounded-2xl hover:bg-[#122442] hover:scale-[1.01] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-[#0A192F]/20 uppercase tracking-widest text-lg">
                    <Save size={24} /> Simpan Realisasi SPJ
                  </button>
                  <p className="text-center text-gray-400 text-[10px] mt-4 uppercase font-bold tracking-widest">Pastikan data vendor dan nominal sudah benar sebelum menyimpan.</p>
                </div>
              </div>
            )}

            {showMasalPanel && (
              <div className="space-y-4 p-6 bg-amber-50 rounded-2xl border border-amber-100 animate-in slide-in-from-bottom-4">
                <p className="text-sm font-bold text-amber-800 flex items-center gap-2"><Calculator size={16} /> PANEL INPUT MASAL PPh 21 AKTIF</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setMasalTab('transport')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${masalTab === 'transport' ? 'bg-[#0A192F] text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>🚗 TRANSPORT (WP PRIBADI)</button>
                  <button type="button" onClick={() => setMasalTab('honor')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${masalTab === 'honor' ? 'bg-[#0A192F] text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>🏅 HONOR (PEGAWAI ASN)</button>
                </div>

                <div className="flex items-center gap-2">
                  <input type="text" value={masalSearch} onChange={e => setMasalSearch(e.target.value)} placeholder="🔍 Cari nama atau NIK..." className="flex-1 border rounded-xl px-4 py-2 text-sm outline-none" />
                </div>

                <div className="overflow-x-auto rounded-xl border bg-white max-h-80 overflow-y-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#0A192F] text-white sticky top-0">
                      <tr>
                        <th className="p-3 w-10"><CheckSquare size={16} /></th>
                        <th className="p-3">Nama / NIK</th>
                        {masalTab === 'honor' && <th className="p-3 w-32">Nominal</th>}
                        <th className="p-3 w-28 text-right">PPh 21</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {masalPersons.map(p => {
                        const isChecked = masalChecked.has(p.id);
                        const nom = masalTab === 'transport' ? Number(masalNominal) || 0 : Number(masalNominals[p.id]) || 0;
                        const pph = isChecked ? calcMasalPph21(p, nom) : 0;
                        return (
                          <tr key={p.id} onClick={() => {
                            const next = new Set(masalChecked);
                            if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                            setMasalChecked(next);
                          }} className={`cursor-pointer ${isChecked ? 'bg-blue-50' : ''}`}>
                            <td className="p-3"><input type="checkbox" checked={isChecked} readOnly /></td>
                            <td className="p-3">
                              <div className="font-bold">{p.nama}</div>
                              <div className="text-[10px] text-gray-400">{p.nik || p.nip}</div>
                            </td>
                            {masalTab === 'honor' && (
                              <td className="p-3" onClick={e => e.stopPropagation()}>
                                <input type="number" value={masalNominals[p.id] || ''} onChange={e => setMasalNominals(prev => ({ ...prev, [p.id]: e.target.value }))} className="w-full border rounded px-2 py-1" />
                              </td>
                            )}
                            <td className="p-3 text-right font-bold text-red-600">{pph > 0 ? formatRupiah(pph) : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <button onClick={handleMasalSubmit} className="w-full py-4 bg-[#D4AF37] text-[#0A192F] font-black rounded-2xl hover:shadow-xl transition-all uppercase tracking-widest">
                  {isMasalSubmitting ? 'Memproses...' : `Simpan ${masalSummary.count} Nota PPh 21`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        show={confirmDialog.show}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
};
