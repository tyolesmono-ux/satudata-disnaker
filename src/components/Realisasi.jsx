import React, { useState, useMemo } from 'react';
import { Printer, FileText, ArrowLeft, CheckSquare } from 'lucide-react';
import { FormContainer, InputField, SelectField, SearchableSelect } from './SharedUI';
import { theme, GAS_URL } from '../config/constants';
import { formatRupiah, formatTanggal, terbilang } from '../utils/helpers';
import logoSurakarta from '../assets/logo-surakarta.png';

export const FormRealisasiGU = ({ onSave, isLoading, subKegiatans, rekenings, realisasiGU, setRealisasiGU, pegawaiASN, wpPribadi, wpPihakKetiga, showToast, kop21, kopUNI }) => {
  const [formData, setFormData] = useState({
    tahun_anggaran: new Date().getFullYear().toString(), tahap_anggaran: 'APBD', bulan_spj: '', proses_gu: 'GU-01',
    kode_subkegiatan: '', kode_rekening: '', tanggal_nota: '', keterangan_nota: '', nik_vendor: '', nama_vendor: '', punya_npwp: false,
    tipe_vendor: '', golongan_vendor: '', kategori_pajak: '', kop_pajak: '', nominal_nota: '', ppn: 0, pph21: 0, pph22: 0, pph23: 0
  });

  // Helper: parse Kode Objek Pajak menjadi KOP, KAP, KJS, NOP
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

  // Mass input states
  const [inputMode, setInputMode] = useState('satuan');
  const [masalTab, setMasalTab] = useState('transport');
  const [masalSearch, setMasalSearch] = useState('');
  const [masalChecked, setMasalChecked] = useState(new Set());
  const [masalNominal, setMasalNominal] = useState('');
  const [masalNominals, setMasalNominals] = useState({});
  const [isMasalSubmitting, setIsMasalSubmitting] = useState(false);

  const guOptions = Array.from({ length: 24 }, (_, i) => `GU-${String(i + 1).padStart(2, '0')}`);
  guOptions.push('GU-Nihil');

  // Fix WP Pribadi: stringify semua value agar autocomplete dan filter konsisten
  const masterVendor = useMemo(() => {
    const all = [];
    (pegawaiASN || []).forEach(p => all.push({ nik: String(p.nik || '').replace(/^'/, ''), nip: String(p.nip || '').replace(/^'/, ''), nama: String(p.nama || ''), npwp: String(p.npwp || '').replace(/^'/, ''), tipe: 'ASN', golongan: String(p.golongan || ''), kategori_pegawai: String(p.kategori_pegawai || '') }));
    (wpPribadi || []).forEach(p => all.push({ nik: String(p.nik || '').replace(/^'/, ''), nama: String(p.nama || ''), npwp: String(p.npwp || '').replace(/^'/, ''), tipe: 'Pribadi' }));
    (wpPihakKetiga || []).forEach(p => all.push({ nik: String(p.nik || '').replace(/^'/, ''), nama: String(p.nama_usaha || p.nama_pemilik || ''), npwp: String(p.npwp || '').replace(/^'/, ''), tipe: 'Badan' }));
    return all;
  }, [pegawaiASN, wpPribadi, wpPihakKetiga]);

  const handleSelectVendor = (vendor) => {
    const npwpStr = String(vendor.npwp || '');
    const hasNpwp = npwpStr.length > 0 && npwpStr !== '-' && npwpStr !== '0' && npwpStr !== '';
    let newFormData = { ...formData, nik_vendor: vendor.nik, nama_vendor: vendor.nama, punya_npwp: hasNpwp, tipe_vendor: vendor.tipe, golongan_vendor: vendor.golongan || '' };
    setFormData(calculateTaxes(newFormData.nominal_nota, newFormData.kategori_pajak, newFormData));
  };

  const calculateTaxes = (nominal, kategori, dataState) => {
    const nom = Number(nominal) || 0;
    let calcPpn = 0, calcPph21 = 0, calcPph22 = 0, calcPph23 = 0;
    if (kategori === 'PPh21') {
      if (dataState.tipe_vendor === 'ASN') {
        if (dataState.golongan_vendor === 'III') calcPph21 = Math.round(nom * 0.05);
        else if (dataState.golongan_vendor === 'IV') calcPph21 = Math.round(nom * 0.15);
      } else calcPph21 = dataState.punya_npwp ? Math.round(nom * 0.03) : Math.round(nom * 0.06);
    }
    else if (kategori === 'PPh22 + PPN') {
      if (nom > 2000000) { calcPpn = Math.round(nom * 0.11); calcPph22 = dataState.punya_npwp ? Math.round(nom * 0.015) : Math.round(nom * 0.03); }
    }
    else if (kategori === 'PPh23') calcPph23 = dataState.punya_npwp ? Math.round(nom * 0.02) : Math.round(nom * 0.04);
    return { ...dataState, nominal_nota: nom, kategori_pajak: kategori, ppn: calcPpn, pph21: calcPph21, pph22: calcPph22, pph23: calcPph23 };
  };

  const handleSelectSub = (sub) => {
    setFormData({ ...formData, kode_subkegiatan: sub.kode_subkegiatan, kode_rekening: '' });
  };

  const availableRekenings = useMemo(() => {
    return (rekenings || []).filter(r => String(r.tahun_anggaran) === String(formData.tahun_anggaran) && String(r.tahap_anggaran) === String(formData.tahap_anggaran) && String(r.kode_subkegiatan) === String(formData.kode_subkegiatan));
  }, [rekenings, formData.tahun_anggaran, formData.tahap_anggaran, formData.kode_subkegiatan]);

  const handleSelectRek = (rek) => {
    setFormData({ ...formData, kode_rekening: rek.kode_rekening });
  };

  const { paguTotal, paguTersedia } = useMemo(() => {
    const rek = availableRekenings.find(r => String(r.kode_rekening) === String(formData.kode_rekening));
    const total = rek ? Number(rek.pagu) : 0;
    const terpakai = (realisasiGU || []).filter(r => String(r.tahun_anggaran) === String(formData.tahun_anggaran) && String(r.tahap_anggaran) === String(formData.tahap_anggaran) && String(r.kode_rekening) === String(formData.kode_rekening)).reduce((sum, r) => sum + Number(r.nominal_nota || 0), 0);
    return { paguTotal: total, paguTersedia: total - terpakai };
  }, [availableRekenings, formData.kode_rekening, formData.tahun_anggaran, formData.tahap_anggaran, realisasiGU]);

  const handleKategoriChange = (newKategori) => {
    const newData = calculateTaxes(formData.nominal_nota, newKategori, { ...formData, kop_pajak: '' });
    setFormData(newData);
    if (newKategori !== 'PPh21') setInputMode('satuan');
    setMasalChecked(new Set()); setMasalNominal(''); setMasalNominals({}); setMasalSearch('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.kode_subkegiatan || !formData.kode_rekening || !formData.nik_vendor) return showToast('Pastikan Sub Kegiatan, Rekening, dan Vendor sudah dipilih!', 'error');
    if (!formData.keterangan_nota) return showToast('Harap isi Keterangan/Aktivitas Nota!', 'error');
    if (!formData.kategori_pajak) return showToast('Harap pilih Kategori Pajak!', 'error');
    if ((formData.kategori_pajak === 'PPh21' || formData.kategori_pajak === 'PPh23') && !formData.kop_pajak) return showToast('Harap pilih Referensi Kode Objek Pajak (KOP)!', 'error');
    if (Number(formData.nominal_nota) > paguTersedia) return showToast(`Nominal melebihi sisa pagu (${formatRupiah(paguTersedia)})!`, 'error');

    const kopData = parseKOP(formData.kategori_pajak, formData.kop_pajak);
    const success = await onSave('RealisasiGU', { ...formData, ...kopData });
    if (success) {
      setFormData(prev => ({
        ...prev, nik_vendor: '', nama_vendor: '', nominal_nota: '',
        keterangan_nota: '', ppn: 0, pph21: 0, pph22: 0, pph23: 0
      }));
    }
  };

  // ============================================================
  // MASS INPUT PPh21 LOGIC
  // ============================================================
  const masalPersons = useMemo(() => {
    // Isolasi sumber data secara absolut berdasarkan tab
    const source = masalTab === 'transport' ? (wpPribadi || []) : (pegawaiASN || []);
    
    const seen = new Set();
    const list = [];
    
    (source || []).forEach((p, idx) => {
      const rawNip = String(p.nip || p.NIP || p.Nip || '').replace(/^'/, '').trim();
      const rawNik = String(p.nik || p.NIK || p.Nik || '').replace(/^'/, '').trim();
      
      const primaryId = masalTab === 'transport' ? rawNik : rawNip;
      // Gunakan prefix tab + fallback index jika NIP/NIK benar-benar kosong di sheet 
      // sehingga React akan unmount baris secara paksa setiap pindah tab dan mencegah bug layout "tertarik"
      const uniqueId = primaryId ? `${masalTab}-${primaryId}` : `${masalTab}-kosong-${idx}`;
      
      if (!seen.has(uniqueId)) {
        seen.add(uniqueId);
        list.push({
          id: uniqueId,
          baseId: primaryId, // Id asli untuk logika penyimpanan
          nik: rawNik,
          nip: masalTab === 'honor' ? rawNip : '',
          nama: String(p.nama || p.Nama || '').trim(),
          npwp: String(p.npwp || p.NPWP || '').replace(/^'/, '').trim(),
          golongan: masalTab === 'honor' ? String(p.golongan || p.Golongan || '').trim() : '',
          tipe: masalTab === 'transport' ? 'Pribadi' : 'ASN',
          kategori_pegawai: String(p.kategori_pegawai || p.Kategori_Pegawai || '').trim()
        });
      }
    });

    if (!masalSearch) return list;
    const kw = masalSearch.toLowerCase();
    return list.filter(p => 
      p.nama.toLowerCase().includes(kw) || 
      p.nik.toLowerCase().includes(kw) || 
      (p.nip && p.nip.toLowerCase().includes(kw))
    );
  }, [masalTab, masalSearch, wpPribadi, pegawaiASN]);

  const handleMasalToggle = (personId) => {
    setMasalChecked(prev => {
      const next = new Set(prev);
      if (next.has(personId)) next.delete(personId); else next.add(personId);
      return next;
    });
  };

  const handleMasalSelectAll = () => {
    if (masalPersons.every(p => masalChecked.has(p.id))) {
      setMasalChecked(new Set());
    } else {
      setMasalChecked(new Set(masalPersons.map(p => p.id)));
    }
  };

  const calcMasalPph21 = (person, nominal) => {
    const nom = Number(nominal) || 0;
    const npwpStr = String(person.npwp || '');
    const hasNpwp = npwpStr.length > 0 && npwpStr !== '-' && npwpStr !== '0';
    if (person.tipe === 'ASN') {
      if (person.golongan === 'III') return Math.round(nom * 0.05);
      if (person.golongan === 'IV') return Math.round(nom * 0.15);
      return 0;
    }
    return hasNpwp ? Math.round(nom * 0.03) : Math.round(nom * 0.06);
  };

  const masalSummary = useMemo(() => {
    const checkedList = masalPersons.filter(p => masalChecked.has(p.id));
    let totalNominal = 0, totalPph21 = 0;
    checkedList.forEach(p => {
      const nom = masalTab === 'transport' ? Number(masalNominal) || 0 : Number(masalNominals[p.id]) || 0;
      totalNominal += nom;
      totalPph21 += calcMasalPph21(p, nom);
    });
    return { count: checkedList.length, totalNominal, totalPph21 };
  }, [masalChecked, masalPersons, masalTab, masalNominal, masalNominals]);

  const handleMasalSubmit = async () => {
    if (isMasalSubmitting) return;
    if (!formData.tanggal_nota) return showToast('Tanggal Nota wajib diisi!', 'error');
    if (!formData.keterangan_nota) return showToast('Keterangan/Aktivitas wajib diisi!', 'error');
    if (!formData.kop_pajak) return showToast('Harap pilih Referensi Kode Objek Pajak (KOP)!', 'error');
    if (masalChecked.size === 0) return showToast('Pilih minimal 1 orang!', 'error');

    const checkedList = masalPersons.filter(p => masalChecked.has(p.id));
    for (const p of checkedList) {
      const nom = masalTab === 'transport' ? Number(masalNominal) || 0 : Number(masalNominals[p.id]) || 0;
      if (nom <= 0) return showToast(`Nominal untuk ${p.nama} belum diisi!`, 'error');
    }
    if (masalSummary.totalNominal > paguTersedia) return showToast(`Total (${formatRupiah(masalSummary.totalNominal)}) melebihi sisa pagu (${formatRupiah(paguTersedia)})!`, 'error');

    const kopData = parseKOP('PPh21', formData.kop_pajak);
    setIsMasalSubmitting(true);
    const items = checkedList.map(p => {
      const nom = masalTab === 'transport' ? Number(masalNominal) : Number(masalNominals[p.id]) || 0;
      return {
        tahun_anggaran: formData.tahun_anggaran, tahap_anggaran: formData.tahap_anggaran,
        bulan_spj: formData.bulan_spj, proses_gu: formData.proses_gu,
        kode_subkegiatan: formData.kode_subkegiatan, kode_rekening: formData.kode_rekening,
        tanggal_nota: formData.tanggal_nota, nik_vendor: p.nik, nama_vendor: p.nama,
        nominal_nota: nom, ppn: 0, pph21: calcMasalPph21(p, nom), pph22: 0, pph23: 0,
        keterangan_nota: formData.keterangan_nota,
        ...kopData
      };
    });

    try {
      const response = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'batch_insert_realisasi', payload: { items } }) });
      const result = await response.json();
      if (result.status === 'success') {
        showToast(`${items.length} nota PPh21 berhasil disimpan!`, 'success');
        const newEntries = items.map((item, idx) => ({ ...item, id_nota: result.results[idx].id_nota, timestamp: result.results[idx].timestamp, status_nota: 'Draft', status_spj: 'Draft', id_spj: '' }));
        setRealisasiGU(prev => [...prev, ...newEntries]);
        setMasalChecked(new Set()); setMasalNominal(''); setMasalNominals({}); setMasalSearch('');
        setFormData(prev => ({ ...prev, keterangan_nota: '', tanggal_nota: '' }));
      } else { showToast('Gagal: ' + result.message, 'error'); }
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
    finally { setIsMasalSubmitting(false); }
  };

  // ============================================================
  // RENDER
  // ============================================================
  const isPph21 = formData.kategori_pajak === 'PPh21';
  const showMasalPanel = isPph21 && inputMode === 'masal' && formData.kode_rekening;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border p-6 animate-in fade-in">
      <h2 className="text-xl font-bold mb-6 pb-2 border-b flex items-center"><FileText size={20} className="mr-2" /> Input SPJ (Ganti Uang)</h2>

      {/* === SECTION 1: FILTER HEADER === */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 p-4 rounded-lg bg-blue-50 border border-blue-100">
        <SelectField label="Tahun" value={formData.tahun_anggaran} onChange={e => setFormData({ ...formData, tahun_anggaran: e.target.value })} required>
          {Array.from(new Set(rekenings.map(r => String(r.tahun_anggaran)))).sort((a,b) => b-a).map(y => <option key={y} value={y}>{y}</option>)}
        </SelectField>
        <SelectField label="Tahap" value={formData.tahap_anggaran} onChange={e => setFormData({ ...formData, tahap_anggaran: e.target.value })} required>
          <option value="APBD">APBD</option><option value="Pergeseran 1">Pergeseran 1</option><option value="Pergeseran 2">Pergeseran 2</option><option value="Perubahan">Perubahan (PAK)</option>
        </SelectField>
        <SelectField label="Bulan SPJ" value={formData.bulan_spj} onChange={e => setFormData({ ...formData, bulan_spj: e.target.value })} required><option value="">-- Bulan --</option>{['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(b => <option key={b} value={b}>{b}</option>)}</SelectField>
        <SelectField label="Proses GU" value={formData.proses_gu} onChange={e => setFormData({ ...formData, proses_gu: e.target.value })} required>{guOptions.map(gu => <option key={gu} value={gu}>{gu}</option>)}</SelectField>
      </div>

      {/* === SECTION 2: SUB KEGIATAN & REKENING === */}
      <div className="space-y-4 mb-4">
        <SearchableSelect
          label="Cari Sub Kegiatan"
          placeholder="Ketik Kode/Nama Sub Kegiatan..."
          value={formData.kode_subkegiatan}
          onChange={(val) => {
            const sub = (subKegiatans || []).find(s => s.kode_subkegiatan === val);
            if (sub) handleSelectSub(sub);
            else setFormData({ ...formData, kode_subkegiatan: '', kode_rekening: '' });
          }}
          options={(subKegiatans || []).map(s => ({ value: s.kode_subkegiatan, label: `[${s.kode_subkegiatan}] ${s.nama_subkegiatan}` }))}
        />
        <SearchableSelect
          label="Cari Rekening Belanja"
          placeholder="Ketik Kode/Nama Rekening..."
          value={formData.kode_rekening}
          onChange={(val) => {
            const rek = (availableRekenings || []).find(r => r.kode_rekening === val);
            if (rek) handleSelectRek(rek);
            else setFormData({ ...formData, kode_rekening: '' });
          }}
          options={(availableRekenings || []).map(r => ({ value: r.kode_rekening, label: `[${r.kode_rekening}] ${r.nama_rekening}` }))}
        />
        {formData.kode_rekening && (<div className="flex justify-between text-sm bg-gray-50 p-3 rounded border"><div className="text-gray-600">Pagu Total: {formatRupiah(paguTotal)}</div><div className="font-bold">Sisa Pagu: <span className={paguTersedia > 0 ? "text-green-700" : "text-red-600"}>{formatRupiah(paguTersedia)}</span></div></div>)}
      </div>

      {/* === SECTION 3: KATEGORI PAJAK (DIPINDAH KE ATAS) === */}
      {formData.kode_rekening && (
        <div className="mb-4 p-4 rounded-lg bg-gray-50 border">
          <SelectField label="Kategori Pemotongan Pajak" value={formData.kategori_pajak} onChange={e => handleKategoriChange(e.target.value)} required>
            <option value="">-- Pilih Jenis Pajak --</option><option value="Tanpa Pajak">Tanpa Pajak</option><option value="PPh21">PPh 21</option><option value="PPh23">PPh 23</option><option value="PPh22 + PPN">PPh 22 + PPN</option>
          </SelectField>

          {/* Referensi KOP dinamis berdasarkan kategori pajak */}
          {formData.kategori_pajak === 'PPh22 + PPN' && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <span className="font-bold">ℹ️ KOP & KAP Otomatis:</span> PPN → 411211-920-01 &nbsp;|&nbsp; PPh 22 → 411122-910-01
            </div>
          )}
          {formData.kategori_pajak === 'PPh21' && (
            <div className="mt-3">
              <SearchableSelect
                label="Referensi KOP 21"
                placeholder="Pilih Kode Objek Pajak..."
                value={formData.kop_pajak}
                onChange={val => setFormData({ ...formData, kop_pajak: val })}
                options={(kop21 || []).map(k => ({ value: k.kode_objek_pajak, label: `${k.kode_objek_pajak} — ${k.nama_objek_pajak}` }))}
              />
            </div>
          )}
          {formData.kategori_pajak === 'PPh23' && (
            <div className="mt-3">
              <SearchableSelect
                label="Referensi KOP UNI"
                placeholder="Pilih Kode Objek Pajak..."
                value={formData.kop_pajak}
                onChange={val => setFormData({ ...formData, kop_pajak: val })}
                options={(kopUNI || []).map(k => ({ value: k.kode_objek_pajak, label: `${k.kode_objek_pajak} — ${k.nama_objek_pajak} (${k.tarif})` }))}
              />
            </div>
          )}

          {/* Toggle masal untuk PPh21 */}
          {isPph21 && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">Mode Input PPh21:</span>
              <div className="flex bg-white rounded-lg border overflow-hidden">
                <button type="button" onClick={() => setInputMode('satuan')} className={`px-4 py-2 text-sm font-bold transition-all ${inputMode === 'satuan' ? 'bg-[#0A192F] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>📝 Satuan</button>
                <button type="button" onClick={() => setInputMode('masal')} className={`px-4 py-2 text-sm font-bold transition-all ${inputMode === 'masal' ? 'bg-[#0A192F] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>👥 Masal</button>
              </div>
            </div>
          )}
        </div>
      )}

      {formData.kategori_pajak && !showMasalPanel && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={isLoading}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div className="space-y-4">
                <InputField label="Tanggal Nota / Tanda Terima" type="date" value={formData.tanggal_nota} onChange={e => setFormData({ ...formData, tanggal_nota: e.target.value })} required />
                <InputField label="Keterangan / Aktivitas Nota" value={formData.keterangan_nota} onChange={e => setFormData({ ...formData, keterangan_nota: e.target.value })} placeholder="Contoh: Makan Minum Rapat Evaluasi..." required />
                <SearchableSelect
                  label="Pencarian Vendor / WP / Penerima"
                  placeholder="Ketik NIK atau Nama..."
                  value={formData.nik_vendor}
                  onChange={(val) => {
                    const vendor = (masterVendor || []).find(v => v.nik === val);
                    if (vendor) handleSelectVendor(vendor);
                    else setFormData({ ...formData, nik_vendor: '', nama_vendor: '', tipe_vendor: '' });
                  }}
                  options={(masterVendor || []).map(v => ({ value: v.nik, label: `${v.nama} (${v.tipe}) - ${v.nik}` }))}
                />
                <InputField label="Nominal Bruto (Rp)" type="number" value={formData.nominal_nota || ''} onChange={e => setFormData(calculateTaxes(e.target.value, formData.kategori_pajak, formData))} required />
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-bold text-gray-700 mb-2">Potongan Pajak</h3>
                <div className="space-y-2 mt-2">
                  {(formData.kategori_pajak === 'PPh22 + PPN' || formData.ppn > 0) && (<div className="flex gap-2"><label className="w-20 text-sm">PPN</label><input type="number" value={formData.ppn} onChange={e => setFormData({ ...formData, ppn: Number(e.target.value) })} className="flex-1 border px-2 py-1 rounded" /></div>)}
                  {(formData.kategori_pajak === 'PPh21' || formData.pph21 > 0) && (<div className="flex gap-2"><label className="w-20 text-sm">PPh 21</label><input type="number" value={formData.pph21} onChange={e => setFormData({ ...formData, pph21: Number(e.target.value) })} className="flex-1 border px-2 py-1 rounded" /></div>)}
                  {(formData.kategori_pajak === 'PPh22 + PPN' || formData.pph22 > 0) && (<div className="flex gap-2"><label className="w-20 text-sm">PPh 22</label><input type="number" value={formData.pph22} onChange={e => setFormData({ ...formData, pph22: Number(e.target.value) })} className="flex-1 border px-2 py-1 rounded" /></div>)}
                  {(formData.kategori_pajak === 'PPh23' || formData.pph23 > 0) && (<div className="flex gap-2"><label className="w-20 text-sm">PPh 23</label><input type="number" value={formData.pph23} onChange={e => setFormData({ ...formData, pph23: Number(e.target.value) })} className="flex-1 border px-2 py-1 rounded" /></div>)}
                  {formData.kategori_pajak === 'Tanpa Pajak' && <p className="text-sm text-gray-400 italic">Tidak ada potongan pajak.</p>}
                </div>
              </div>
            </div>
            <button type="submit" className="w-full mt-6 py-3 bg-[#0A192F] flex items-center justify-center text-white font-bold rounded-xl hover:bg-[#122442] shadow-lg transition-all disabled:opacity-50">
              {isLoading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> Menyimpan...</> : 'Simpan Data'}
            </button>
          </fieldset>
        </form>
      )}

      {/* === SECTION 4B: PANEL MASAL PPh21 === */}
      {showMasalPanel && (
        <div className="pt-4 border-t space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Tanggal Nota / Tanda Terima" type="date" value={formData.tanggal_nota} onChange={e => setFormData({ ...formData, tanggal_nota: e.target.value })} required />
            <InputField label="Keterangan / Aktivitas Nota (untuk semua orang)" value={formData.keterangan_nota} onChange={e => setFormData({ ...formData, keterangan_nota: e.target.value })} placeholder="Contoh: Transport Rapat Koordinasi..." required />
          </div>

          {/* Tab Transport / Honor */}
          <div className="flex gap-0 border-b">
            <button type="button" onClick={() => { setMasalTab('transport'); setMasalChecked(new Set()); setMasalSearch(''); }} className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-all ${masalTab === 'transport' ? 'border-[#D4AF37] text-[#0A192F]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
              🚗 Transport (WP Pribadi)
            </button>
            <button type="button" onClick={() => { setMasalTab('honor'); setMasalChecked(new Set()); setMasalSearch(''); }} className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-all ${masalTab === 'honor' ? 'border-[#D4AF37] text-[#0A192F]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
              🏅 Honor (Pegawai ASN)
            </button>
          </div>

          {/* Nominal seragam (hanya untuk Transport) */}
          {masalTab === 'transport' && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <InputField label="Nominal Per Orang (sama untuk semua)" type="number" value={masalNominal} onChange={e => setMasalNominal(e.target.value)} placeholder="Contoh: 150000" required />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => {
                  const internal = masalPersons.filter(p => p.kategori_pegawai === 'Internal');
                  setMasalChecked(prev => new Set([...prev, ...internal.map(i => i.id)]));
                }} className="px-4 py-2 text-[10px] font-black bg-white border border-gray-200 hover:bg-blue-50 rounded-lg transition-all uppercase tracking-tighter">Pilih Semua Internal</button>
                <button type="button" onClick={() => {
                  const eksternal = masalPersons.filter(p => p.kategori_pegawai === 'Eksternal');
                  setMasalChecked(prev => new Set([...prev, ...eksternal.map(i => i.id)]));
                }} className="px-4 py-2 text-[10px] font-black bg-white border border-gray-200 hover:bg-red-50 rounded-lg transition-all uppercase tracking-tighter">Pilih Semua Eksternal</button>
              </div>
            </div>
          )}

          {masalTab === 'honor' && (
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => {
                const internal = masalPersons.filter(p => p.kategori_pegawai === 'Internal');
                setMasalChecked(prev => new Set([...prev, ...internal.map(i => i.id)]));
              }} className="px-4 py-2 text-[10px] font-black border border-gray-200 hover:bg-blue-50 rounded-lg transition-all uppercase tracking-tighter">Pilih Semua Internal</button>
              <button type="button" onClick={() => {
                const eksternal = masalPersons.filter(p => p.kategori_pegawai === 'Eksternal');
                setMasalChecked(prev => new Set([...prev, ...eksternal.map(i => i.id)]));
              }} className="px-4 py-2 text-[10px] font-black border border-gray-200 hover:bg-red-50 rounded-lg transition-all uppercase tracking-tighter">Pilih Semua Eksternal</button>
            </div>
          )}

          {/* Search & Select All */}
          <div className="flex items-center gap-2">
            <input type="text" value={masalSearch} onChange={e => setMasalSearch(e.target.value)} placeholder="🔍 Cari nama atau NIK..." className="flex-1 border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none" />
            <div className="flex gap-2">
              <button type="button" onClick={handleMasalSelectAll} className="px-4 py-2 text-xs font-bold border rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
                {masalPersons.length > 0 && masalPersons.every(p => masalChecked.has(p.id)) ? '☐ Batal Semua' : '☑ Pilih Semua'}
              </button>
              {masalChecked.size > 0 && (
                <button type="button" onClick={() => setMasalChecked(new Set())} className="px-4 py-2 text-xs font-bold border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1">
                  🗑️ Hapus Semua
                </button>
              )}
            </div>
          </div>

          {/* Tabel Checklist */}
          <div className="overflow-x-auto rounded-xl border bg-white max-h-80 overflow-y-auto">
            <table className="w-full text-sm text-left border-separate border-spacing-0">
              <thead className="bg-[#0A192F] text-white sticky top-0 z-10">
                <tr>
                  <th className="p-3 w-10"><CheckSquare size={16} /></th>
                  {masalTab === 'honor' && <th className="p-3">NIP</th>}
                  <th className="p-3">NIK</th>
                  <th className="p-3">Nama</th>
                  {masalTab === 'honor' && <th className="p-3">Golongan</th>}
                  {masalTab === 'honor' && <th className="p-3 w-40">Nominal (Rp)</th>}
                  <th className="p-3 w-28 text-right">PPh 21</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {masalPersons.length === 0 ? (
                  <tr><td colSpan={masalTab === 'honor' ? 7 : 4} className="p-6 text-center text-gray-400 italic">Tidak ada data ditemukan.</td></tr>
                ) : masalPersons.map(p => {
                  const isChecked = masalChecked.has(p.id);
                  const nom = masalTab === 'transport' ? Number(masalNominal) || 0 : Number(masalNominals[p.id]) || 0;
                  const pph = isChecked ? calcMasalPph21(p, nom) : 0;
                  // Konstanta lokal untuk memastikan konsistensi render per baris
                  const isHonorTab = masalTab === 'honor';
                  
                  return (
                    <tr key={p.id} onClick={() => handleMasalToggle(p.id)} className={`cursor-pointer transition-colors ${isChecked ? 'bg-blue-50/70' : 'hover:bg-gray-50'}`}>
                      <td className="p-3"><input type="checkbox" checked={isChecked} readOnly className="w-4 h-4 accent-[#D4AF37]" /></td>
                      {isHonorTab && <td className="p-3 text-xs">{p.nip}</td>}
                      <td className="p-3 text-xs">{p.nik}</td>
                      <td className="p-3 font-bold">{p.nama}</td>
                      {isHonorTab && (
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-semibold">
                            Gol. {p.golongan}
                          </span>
                        </td>
                      )}
                      {isHonorTab && (
                        <td className="p-3" onClick={e => e.stopPropagation()}>
                          <input 
                            type="number" 
                            value={masalNominals[p.id] || ''} 
                            onChange={e => setMasalNominals(prev => ({ ...prev, [p.id]: e.target.value }))} 
                            placeholder="0" 
                            className="w-full border rounded px-2 py-1 text-sm text-right" 
                            disabled={!isChecked} 
                          />
                        </td>
                      )}
                      <td className="p-3 text-right font-semibold text-red-600">
                        {isChecked && nom > 0 ? formatRupiah(pph) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Ringkasan & Submit */}
          {masalChecked.size > 0 && (
            <div className="bg-[#0A192F] text-white p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm text-gray-300">Dipilih: <span className="font-bold text-[#D4AF37]">{masalSummary.count} orang</span></div>
                <div className="text-sm text-gray-300">Total Bruto: <span className="font-bold text-white">{formatRupiah(masalSummary.totalNominal)}</span></div>
                <div className="text-sm text-gray-300">Total PPh 21: <span className="font-bold text-red-400">{formatRupiah(masalSummary.totalPph21)}</span></div>
              </div>
              <button type="button" disabled={isMasalSubmitting} onClick={handleMasalSubmit} className="px-8 py-3 bg-[#D4AF37] text-[#0A192F] font-black rounded-xl shadow-lg hover:bg-[#e6c34a] transition-all disabled:opacity-50">
                {isMasalSubmitting ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-[#0A192F]/30 border-t-[#0A192F] rounded-full animate-spin"></span> Menyimpan {masalSummary.count} nota...</span>
                ) : `Simpan ${masalSummary.count} Nota Sekaligus`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const FormCetakSPJ = ({ rekenings, subKegiatans, kegiatans, realisasiGU, setRealisasiGU, dataSPJ, setDataSPJ, pegawaiASN, setPrintData, printedNotes, setPrintedNotes, onUpdate, isLoading, showToast }) => {
  const [filter, setFilter] = useState({ tahun_anggaran: new Date().getFullYear().toString(), tahap_anggaran: 'APBD', bulan_spj: '', proses_gu: 'GU-01', kode_subkegiatan: '', kode_rekening: '' });
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [showModalBidang, setShowModalBidang] = useState(false);
  const [inputBidang, setInputBidang] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const guOptions = Array.from({ length: 24 }, (_, i) => `GU-${String(i + 1).padStart(2, '0')}`);
  guOptions.push('GU-Nihil');

  const availableRekenings = useMemo(() => (rekenings || []).filter(r => String(r.tahun_anggaran) === String(filter.tahun_anggaran) && String(r.tahap_anggaran) === String(filter.tahap_anggaran) && String(r.kode_subkegiatan) === String(filter.kode_subkegiatan)), [rekenings, filter]);

  const availableNotes = useMemo(() => {
    if (!filter.kode_rekening) return [];
    return (realisasiGU || []).filter(r =>
      String(r.tahun_anggaran) === String(filter.tahun_anggaran) &&
      String(r.tahap_anggaran) === String(filter.tahap_anggaran) &&
      String(r.bulan_spj) === String(filter.bulan_spj) &&
      String(r.proses_gu) === String(filter.proses_gu) &&
      String(r.kode_rekening) === String(filter.kode_rekening) &&
      (!r.status_nota || String(r.status_nota) === '' || String(r.status_nota) === 'Draft')
    );
  }, [realisasiGU, filter]);

  const handleCheckbox = (noteTimestamp) => {
    if (selectedNotes.includes(noteTimestamp)) setSelectedNotes(selectedNotes.filter(ts => ts !== noteTimestamp));
    else setSelectedNotes([...selectedNotes, noteTimestamp]);
  };

  const handleCetakClick = () => {
    if (selectedNotes.length === 0) return showToast('Pilih minimal 1 nota untuk dikumpulkan!', 'error');
    setShowModalBidang(true);
  };

  const proceedBuatSPJ = async () => {
    if (!inputBidang) return showToast('Harap pilih Nama Bidang!', 'error');
    setIsSubmitting(true);
    const temporaryIdSpj = `DRAFT-${Date.now()}`;

    const selectedNotaData = availableNotes.filter(n => selectedNotes.includes(n.timestamp));
    const totalKotor = selectedNotaData.reduce((sum, n) => sum + Number(n.nominal_nota || 0), 0);
    const totalPpn = selectedNotaData.reduce((sum, n) => sum + Number(n.ppn || 0), 0);
    const totalPph21 = selectedNotaData.reduce((sum, n) => sum + Number(n.pph21 || 0), 0);
    const totalPph22 = selectedNotaData.reduce((sum, n) => sum + Number(n.pph22 || 0), 0);
    const totalPph23 = selectedNotaData.reduce((sum, n) => sum + Number(n.pph23 || 0), 0);

    const payloadData = {
      action: 'buat_spj_bundle',
      payload: {
        id_spj: temporaryIdSpj,
        bidang: inputBidang,
        tanggal_bayar: '',
        proses_gu: filter.proses_gu,
        total_kotor: totalKotor,
        total_ppn: totalPpn,
        total_pph21: totalPph21,
        total_pph22: totalPph22,
        total_pph23: totalPph23,
        id_nota: selectedNotaData.map(n => n.id_nota)
      }
    };

    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify(payloadData),
      });
      const result = await response.json();
      if (result.status === 'success') {
        showToast('Berhasil membuat bundle SPJ!', 'success');
        setShowModalBidang(false);
        setSelectedNotes([]);
        setInputBidang('');

        // Update state lokal — nota yang dipilih jadi 'Diproses'
        const selectedIdNotas = selectedNotaData.map(n => String(n.id_nota));
        setRealisasiGU(prev => prev.map(n =>
          selectedIdNotas.includes(String(n.id_nota))
            ? { ...n, status_nota: 'Diproses', status_spj: 'Diproses', id_spj: temporaryIdSpj }
            : n
        ));

        // Tambahkan SPJ baru ke dataSPJ
        setDataSPJ(prev => [...prev, {
          id_spj: temporaryIdSpj,
          no_spj_resmi: '',
          bidang: inputBidang,
          tanggal_bayar: '',
          proses_gu: filter.proses_gu,
          total_kotor: totalKotor,
          total_ppn: totalPpn,
          total_pph21: totalPph21,
          total_pph22: totalPph22,
          total_pph23: totalPph23,
          status_spj: 'Diproses'
        }]);
      } else {
        showToast('Gagal: ' + result.message, 'error');
      }
    } catch (e) {
      showToast('Terjadi kesalahan: ' + e.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border p-6 animate-in fade-in">
      <h2 className="text-xl font-bold mb-6 pb-2 border-b flex items-center"><Printer size={20} className="mr-2" /> Pengajuan SPJ</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 bg-gray-50 p-4 rounded border">
        <SelectField label="Tahun" value={filter.tahun_anggaran} onChange={e => setFilter({ ...filter, tahun_anggaran: e.target.value })}>
          {Array.from(new Set(rekenings.map(r => String(r.tahun_anggaran)))).sort((a,b) => b-a).map(y => <option key={y} value={y}>{y}</option>)}
        </SelectField>
        <SelectField label="Tahap" value={filter.tahap_anggaran} onChange={e => setFilter({ ...filter, tahap_anggaran: e.target.value })}>
          <option value="APBD">APBD</option><option value="Pergeseran 1">Pergeseran 1</option><option value="Pergeseran 2">Pergeseran 2</option><option value="Perubahan">Perubahan (PAK)</option>
        </SelectField>
        <SelectField label="Bulan SPJ" value={filter.bulan_spj} onChange={e => setFilter({ ...filter, bulan_spj: e.target.value })}><option value="">-- Pilih Bulan --</option>{['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(b => <option key={b} value={b}>{b}</option>)}</SelectField>
        <SelectField label="Proses GU" value={filter.proses_gu} onChange={e => setFilter({ ...filter, proses_gu: e.target.value })}>{guOptions.map(gu => <option key={gu} value={gu}>{gu}</option>)}</SelectField>
        <div className="md:col-span-2"><SelectField label="Sub Kegiatan" value={filter.kode_subkegiatan} onChange={e => setFilter({ ...filter, kode_subkegiatan: e.target.value, kode_rekening: '' })}><option value="">-- Pilih Sub Kegiatan --</option>{(subKegiatans || []).map(s => <option key={s.kode_subkegiatan} value={s.kode_subkegiatan}>[{s.kode_subkegiatan}] {s.nama_subkegiatan}</option>)}</SelectField></div>
        <div className="md:col-span-2"><SelectField label="Rekening Belanja" value={filter.kode_rekening} onChange={e => setFilter({ ...filter, kode_rekening: e.target.value })} disabled={!filter.kode_subkegiatan}><option value="">-- Pilih Rekening --</option>{(availableRekenings || []).map(r => <option key={r.kode_rekening} value={r.kode_rekening}>[{r.kode_rekening}] {r.nama_rekening}</option>)}</SelectField></div>
      </div>

      {filter.kode_rekening && (
        <div className="relative border rounded-2xl overflow-hidden mt-8 shadow-sm bg-white">
          <div className="max-h-[500px] overflow-y-auto overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left border-separate border-spacing-0">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#0A192F]/95 backdrop-blur-md text-white">
                  <th className="p-4 w-12 text-center border-b border-[#0A192F]/10">
                    <label className="flex items-center justify-center cursor-pointer group">
                      <input
                        type="checkbox"
                        className="sr-only"
                        onChange={e => setSelectedNotes(e.target.checked ? availableNotes.map(n => n.timestamp) : [])}
                        checked={selectedNotes.length === availableNotes.length && availableNotes.length > 0}
                      />
                      <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${selectedNotes.length === availableNotes.length && availableNotes.length > 0 ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-white/30 group-hover:border-white/60'}`}>
                        {selectedNotes.length === availableNotes.length && availableNotes.length > 0 && <CheckSquare size={14} className="text-[#0A192F]" />}
                      </div>
                    </label>
                  </th>
                  <th className="p-4 font-semibold border-b border-[#0A192F]/10">Tanggal</th>
                  <th className="p-4 font-semibold border-b border-[#0A192F]/10">Keterangan Aktivitas</th>
                  <th className="p-4 font-semibold border-b border-[#0A192F]/10">Vendor / Penerima</th>
                  <th className="p-4 font-semibold border-b border-[#0A192F]/10">Status</th>
                  <th className="p-4 font-semibold text-right border-b border-[#0A192F]/10 pr-6">Nominal Bruto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {availableNotes.length === 0 ? (
                  <tr><td colSpan="6" className="p-10 text-center text-gray-400 italic">Tidak ditemukan data nota pada filter ini.</td></tr>
                ) : null}
                {availableNotes.map((nota, idx) => {
                  const isPrinted = printedNotes.includes(nota.timestamp);
                  const isSelected = selectedNotes.includes(nota.timestamp);
                  return (
                    <tr
                      key={idx}
                      className={`group transition-all duration-200 cursor-pointer ${isPrinted ? 'bg-gray-50/50 text-gray-400' : isSelected ? 'bg-blue-50/40' : 'hover:bg-gray-50'}`}
                      onClick={() => handleCheckbox(nota.timestamp)}
                    >
                      <td className="p-4 text-center">
                        <label className="flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={isSelected}
                            onChange={() => { }}
                          />
                          <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${isSelected ? 'bg-[#0A192F] border-[#0A192F]' : 'border-gray-300 group-hover:border-[#0A192F]/40'}`}>
                            {isSelected && <CheckSquare size={14} className="text-white" />}
                          </div>
                        </label>
                      </td>
                      <td className="p-4 whitespace-nowrap font-medium">{formatTanggal(nota.tanggal_nota)}</td>
                      <td className="p-4 text-xs italic leading-relaxed max-w-xs">{nota.keterangan_nota || '-'}</td>
                      <td className="p-4">
                        <div className="font-semibold text-[#0A192F]">{nota.nama_vendor}</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">{nota.tipe_vendor || 'Vendor'}</div>
                      </td>
                      <td className="p-4">
                        {isPrinted ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
                            <CheckSquare size={10} className="mr-1" /> DICETAK
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100 uppercase">
                            Siap SPJ
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-right pr-6 whitespace-nowrap text-[#0A192F]">
                        {formatRupiah(nota.nominal_nota)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {availableNotes.length > 0 && (
            <div className="bg-gray-50/50 backdrop-blur-sm p-6 border-t flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm border">
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-widest block mb-0.5">Terpilih</span>
                  <span className="text-lg font-black text-[#0A192F]">{selectedNotes.length} <span className="text-xs font-normal text-gray-400">Nota</span></span>
                </div>
                <div className="p-3 bg-white rounded-xl shadow-sm border">
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-widest block mb-0.5">Total Akumulasi</span>
                  <span className="text-lg font-black text-[#D4AF37]">{formatRupiah(availableNotes.filter(n => selectedNotes.includes(n.timestamp)).reduce((sum, n) => sum + Number(n.nominal_nota), 0))}</span>
                </div>
              </div>
              <button
                onClick={handleCetakClick}
                className="px-8 py-3 bg-[#0A192F] text-white font-bold rounded-xl shadow-lg shadow-[#0A192F]/20 hover:bg-[#122442] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 group"
              >
                <FileText size={20} className="text-[#D4AF37] group-hover:scale-110 transition-transform" />
                Buat SPJ
              </button>
            </div>
          )}
        </div>
      )}

      {showModalBidang && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 border-b pb-2">Buat SPJ Baru</h3>
            <fieldset disabled={isSubmitting}>
              <div className="space-y-4 mb-6">
                <SelectField label="Nama Bidang" value={inputBidang} onChange={e => setInputBidang(e.target.value)} required>
                  <option value="">-- Pilih Bidang --</option>
                  <option value="Sekretariat">Sekretariat</option>
                  <option value="Bidang PPTK">Bidang PPTK</option>
                  <option value="Bidang HI">Bidang HI</option>
                </SelectField>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModalBidang(false)} className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50">Batal</button>
                <button type="button" onClick={proceedBuatSPJ} className={`px-6 py-2 bg-[#0A192F] text-white rounded hover:bg-[#122442] transition-all flex items-center disabled:opacity-50 ${isSubmitting ? 'cursor-not-allowed' : ''}`}>
                  {isSubmitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> Memproses...</> : 'Ajukan SPJ'}
                </button>
              </div>
            </fieldset>
          </div>
        </div>
      )}
    </div>
  );
};

export const PrintLayout = ({ data, onBack }) => {
  const totalKotor = data.notes.reduce((sum, n) => sum + Number(n.nominal_nota), 0);
  const totalPPN = data.notes.reduce((sum, n) => sum + Number(n.ppn), 0);
  const totalPPh21 = data.notes.reduce((sum, n) => sum + Number(n.pph21), 0);
  const totalPPh22 = data.notes.reduce((sum, n) => sum + Number(n.pph22), 0);
  const totalPPh23 = data.notes.reduce((sum, n) => sum + Number(n.pph23), 0);
  const totalPotongan = totalPPN + totalPPh21 + totalPPh22 + totalPPh23;
  const totalBersih = totalKotor - totalPotongan;

  const jumlahSDBulanLalu = data.historisTotal;
  const jumlahSDBulanIni = jumlahSDBulanLalu + totalKotor;

  const tglCetakFormat = formatTanggal(data.pejabat.tanggal_cetak);
  const bulanFormat = data.filterContext.bulan_spj.toUpperCase();
  const cleanNIP = (nip) => nip ? nip.replace(/'/g, '') : '';

  // Grouping: PPh21 notes dengan tanggal+keterangan sama digabung jadi 1 baris
  const groupedNotes = useMemo(() => {
    const isPph21 = (n) => Number(n.pph21) > 0 || String(n.kop_pajak || '').startsWith('21-');
    const result = [];
    const pph21Groups = {};

    data.notes.forEach(n => {
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
        nama_vendor: 'Dinas Tenaga Kerja Kota Surakarta',
        keterangan_nota: `${group.keterangan_nota} (Daftar Penerima Terlampir: ${group._count} Orang)`
      });
    });

    // Urutkan berdasarkan tanggal_nota agar kronologis
    result.sort((a, b) => String(a.tanggal_nota).localeCompare(String(b.tanggal_nota)));
    return result;
  }, [data.notes]);

  return (
    <div className="bg-gray-200 print:bg-white min-h-screen pb-12 font-sans">
      <div className="sticky top-0 bg-[#0A192F] text-white p-4 shadow-md flex justify-between items-center z-50 print:hidden">
        <button onClick={onBack} className="flex items-center px-4 py-2 bg-white/10 rounded hover:bg-white/20"><ArrowLeft size={18} className="mr-2" /> Kembali</button>
        <div className="font-bold text-[#D4AF37]">Print Preview SPJ</div>
        <button onClick={() => window.print()} className="flex items-center px-6 py-2 bg-[#D4AF37] text-[#0A192F] rounded font-bold hover:opacity-90"><Printer size={18} className="mr-2" /> Simpan PDF / Cetak</button>
      </div>

      <div className="print:w-full print:m-0 print:p-0 mx-auto my-8">
        <style dangerouslySetInnerHTML={{
          __html: `
		  @media print {
			@page { size: 215mm 330mm; margin: 0; }
			body { background: white !important; margin: 0; padding: 0; }
			.page-break { page-break-after: always; break-after: page; display: block; }
			.f4-page { box-shadow: none !important; margin: 0 !important; padding: 20mm !important; width: 215mm !important; height: 330mm !important; overflow: hidden; box-sizing: border-box; position: relative; }
			.print-hidden { display: none !important; }
		  }

		  .f4-page { width: 215mm; min-height: 330mm; background: white; margin: 2rem auto; padding: 20mm; box-shadow: 0 4px 10px rgba(0,0,0,0.15); box-sizing: border-box; position: relative; }
		  
          /* SETINGAN FONT DASAR: Arial, 9pt, Line Spacing 1 */
          .f4-page, .f4-page table, .f4-page p, .f4-page td, .f4-page th, .f4-page div {
            font-family: Arial, Helvetica, sans-serif !important;
            font-size: 9pt !important;
            line-height: 1.15 !important; 
            color: black !important;
          }

          .text-xs { font-size: 7.5pt !important; }
          .text-sm { font-size: 8pt !important; }
          .text-lg { font-size: 11pt !important; }
          .text-xl { font-size: 13pt !important; }
          .text-2xl { font-size: 15pt !important; }

		  table { width: 100% !important; break-inside: auto; }
		  tr { break-inside: avoid; break-after: auto; }
		  .signature-section { break-inside: avoid; page-break-inside: avoid; margin-top: 20px; }

          /* Solusi agar nama muat murni dari font-size asli (tanpa fake width transform) */
          .nowrap-name {
            white-space: nowrap !important;
            font-size: 7pt !important; /* Dikecilkan murni dari font agar layout box ikut kecil */
            letter-spacing: -0.2px !important; 
          }
		`}} />

        {/* HALAMAN 1 : BKU */}
        <div className="f4-page page-break mb-8">
          <div className="flex border-b-4 border-black pb-4 mb-4">
            <div className="w-24 h-28 flex items-center justify-center p-2 mr-4">
              <img src={logoSurakarta} alt="Logo Pemkot Surakarta" className="max-w-full max-h-full object-contain" />
            </div>
            <div className="flex-1 text-center flex flex-col justify-center">
              <h1 className="text-xl font-bold uppercase">PEMERINTAH KOTA SURAKARTA</h1>
              <h2 className="text-2xl font-black uppercase tracking-wider">DINAS TENAGA KERJA</h2>
              <p className="text-sm">Jln. Slamet Riyadi No. 306 Telp. (0271) 714800-719825</p>
              <p className="text-sm">Email : disnakersurakarta@gmail.com, disnaker@surakarta.go.id</p>
              <p className="text-sm font-bold">SURAKARTA</p>
              <p className="text-sm font-bold">57141</p>
            </div>
          </div>
          <table className="w-full text-left mb-6 font-bold">
            <tbody>
              <tr><td className="w-40 py-1">OPD</td><td className="w-4">:</td><td>Dinas Tenaga Kerja</td></tr>
              <tr><td className="py-1">Kode Rekening</td><td>:</td><td>{data.filterContext.kode_subkegiatan}.{data.filterContext.kode_rekening}</td></tr>
              <tr><td className="py-1">Kegiatan</td><td>:</td><td>{data.kegiatanDetail?.nama_kegiatan}</td></tr>
              <tr><td className="py-1">Kredit APBD</td><td>:</td><td>{formatRupiah(data.rekeningDetail?.pagu)}</td></tr>
              <tr><td className="py-1">Tahun Anggaran</td><td>:</td><td>{data.filterContext.tahun_anggaran}</td></tr>
              <tr><td className="py-1">Bulan</td><td>:</td><td>{data.filterContext.bulan_spj}</td></tr>
              <tr><td className="py-1">GU</td><td>:</td><td>{data.filterContext.proses_gu.replace('GU-', '')}</td></tr>
            </tbody>
          </table>
          <table className="w-full border-collapse border border-black text-center mb-8">
            <thead>
              <tr><th className="border border-black p-2 w-1/2" rowSpan="2">NOMOR BKU</th><th className="border border-black p-2" colSpan="3">PENGELUARAN</th></tr>
              <tr><th className="border border-black p-2 w-1/6">LS</th><th className="border border-black p-2 w-1/6">UP/GU/TU</th><th className="border border-black p-2 w-1/6">JUMLAH</th></tr>
              <tr className="bg-gray-100 text-xs"><td className="border border-black p-1">1</td><td className="border border-black p-1">2</td><td className="border border-black p-1">3</td><td className="border border-black p-1">4</td></tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-4 text-left align-top h-64">
                  <div className="font-bold">{data.pejabat.no_bku}</div>
                  <div className="mt-2">{data.rekeningDetail?.nama_rekening}</div>
                  <div>Tahun Anggaran {data.filterContext.tahun_anggaran}</div>
                </td>
                <td className="border border-black p-4 align-top">0</td>
                <td className="border border-black p-4 align-top text-right">{formatRupiah(totalKotor).replace('Rp', '').trim()}</td>
                <td className="border border-black p-4 align-top text-right">{formatRupiah(totalKotor).replace('Rp', '').trim()}</td>
              </tr>
              <tr className="font-bold">
                <td className="border border-black p-2 text-left">Jumlah bulan ini</td><td className="border border-black p-2">0</td>
                <td className="border border-black p-2 text-right">{formatRupiah(totalKotor).replace('Rp', '').trim()}</td><td className="border border-black p-2 text-right">{formatRupiah(totalKotor).replace('Rp', '').trim()}</td>
              </tr>
              <tr className="font-bold">
                <td className="border border-black p-2 text-left">Jumlah sampai dengan bulan lalu</td><td className="border border-black p-2">0</td>
                <td className="border border-black p-2 text-right">{formatRupiah(jumlahSDBulanLalu).replace('Rp', '').trim()}</td><td className="border border-black p-2 text-right">{formatRupiah(jumlahSDBulanLalu).replace('Rp', '').trim()}</td>
              </tr>
              <tr className="font-bold">
                <td className="border border-black p-2 text-left">Jumlah sampai dengan bulan ini</td><td className="border border-black p-2">0</td>
                <td className="border border-black p-2 text-right">{formatRupiah(jumlahSDBulanIni).replace('Rp', '').trim()}</td><td className="border border-black p-2 text-right">{formatRupiah(jumlahSDBulanIni).replace('Rp', '').trim()}</td>
              </tr>
            </tbody>
          </table>

          {/* PERBAIKAN TANDA TANGAN HALAMAN 1 (RATA BAWAH) */}
          <div className="signature-section flex justify-between mt-12 text-center">
            <div className="w-1/2 flex flex-col justify-between h-[120px]">
              <div>
                <p>Mengetahui</p>
                <p>Pengguna Anggaran</p>
              </div>
              <div>
                <div className="font-bold underline uppercase nowrap-name">{data.pejabat.pa?.nama}</div>
                <div className="nowrap-name">NIP. {cleanNIP(data.pejabat.pa?.nip)}</div>
              </div>
            </div>
            <div className="w-1/2 flex flex-col justify-between h-[120px]">
              <div>
                <p>Surakarta, {tglCetakFormat}</p>
                <p>Bendahara Pengeluaran</p>
              </div>
              <div>
                <div className="font-bold underline uppercase nowrap-name">{data.pejabat.bendahara?.nama}</div>
                <div className="nowrap-name">NIP. {cleanNIP(data.pejabat.bendahara?.nip)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* HALAMAN 2 : KWITANSI */}
        <div className="f4-page page-break mb-8 relative">
          <table className="w-full mb-6 font-bold">
            <tbody>
              <tr>
                <td className="w-28 align-top">
                  <div className="w-20 h-24 flex items-center justify-center">
                    <img src={logoSurakarta} alt="Logo Pemkot Surakarta" className="max-w-full max-h-full object-contain" />
                  </div>
                </td>
                <td className="align-top pt-2">
                  <div className="text-lg">PEMERINTAH KOTA SURAKARTA</div>
                  <div className="flex mt-2"><div className="w-40">TAHUN ANGGARAN</div><div>: {data.filterContext.tahun_anggaran}</div></div>
                  <div className="flex"><div className="w-40">DINAS/ LEMBAGA</div><div>: DISNAKER</div></div>
                </td>
                <td className="align-top pt-2 w-1/3">
                  <table className="ml-auto">
                    <tbody>
                      <tr>
                        <td className="align-top text-left pr-2 w-28 font-normal">Kode rekening</td>
                        <td className="align-top text-left pr-2 font-normal">:</td>
                        <td className="align-top text-left font-bold tracking-tight text-[0.8rem] leading-tight">
                          {data.filterContext.kode_subkegiatan}.<br />{data.filterContext.kode_rekening}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="border-t-2 border-black w-full mb-6"></div>

          <div className="flex">
            <div className="w-2/3 pr-4">
              <h3 className="text-center font-bold underline text-lg mb-6">TANDA BUKTI PENGELUARAN</h3>
              <table className="w-full">
                <tbody>
                  {/* PERBAIKAN ALIGNMENT TITIK DUA (SAMA RATA ATAS) */}
                  <tr>
                    <td className="w-40 py-2 align-top">Sudah terima dari</td>
                    <td className="w-4 py-2 align-top text-center">:</td>
                    <td className="py-2 align-top">Bendahara Disnaker<br />Kota Surakarta</td>
                  </tr>
                  <tr>
                    <td className="py-2 align-top">Uang sejumlah</td>
                    <td className="py-2 align-top text-center">:</td>
                    <td className="py-2 align-top font-bold">{formatRupiah(totalKotor)}<br /><span className="italic text-sm font-normal">({terbilang(totalKotor)} Rupiah)</span></td>
                  </tr>
                  <tr>
                    <td className="py-2 align-top">Yaitu untuk pembayaran</td>
                    <td className="py-2 align-top text-center">:</td>
                    <td className="py-2 align-top">{data.rekeningDetail?.nama_rekening}</td>
                  </tr>
                  <tr>
                    <td className="py-2 align-top">Untuk pekerjaan /<br />Sub kegiatan</td>
                    <td className="py-2 align-top text-center">:</td>
                    <td className="py-2 align-top">{data.subkegiatanDetail?.nama_subkegiatan}</td>
                  </tr>
                  <tr>
                    <td className="py-2 align-top">Sumber Dana</td>
                    <td className="py-2 align-top text-center">:</td>
                    <td className="py-2 align-top">APBD Kota Surakarta</td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="py-4 text-xs">Catatan :<br />Kwitansi/ Nota dari Toko/ Ybs. Terlampir</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="w-1/3 border-l-2 border-black pl-4 flex flex-col justify-between">
              <div>
                <p className="text-sm mb-4">Barang-barang termaksud telah dibukukan ke buku persediaan/ inventaris pada tanggal : .......................</p>
                <table className="w-full font-bold mb-4">
                  <tbody>
                    <tr><td>Jumlah Kotor</td><td>Rp.</td><td className="text-right">{formatRupiah(totalKotor).replace('Rp', '').trim()}</td></tr>
                    <tr><td>Potongan</td><td>Rp.</td><td className="text-right border-b border-black">{formatRupiah(totalPotongan).replace('Rp', '').trim()}</td></tr>
                    <tr><td>dibayarkan</td><td>Rp.</td><td className="text-right">{formatRupiah(totalBersih).replace('Rp', '').trim()}</td></tr>
                  </tbody>
                </table>
                <p className="text-sm font-bold">Perincian potongan</p>
                <table className="w-full text-sm">
                  <tbody>
                    <tr><td className="w-6">1.</td><td>PPh.23</td><td>Rp.</td><td className="text-right">{formatRupiah(totalPPh23).replace('Rp', '').trim()}</td></tr>
                    <tr><td>2.</td><td>PPN.</td><td>Rp.</td><td className="text-right">{formatRupiah(totalPPN).replace('Rp', '').trim()}</td></tr>
                    <tr><td>3.</td><td>PPh 21</td><td>Rp.</td><td className="text-right">{formatRupiah(totalPPh21).replace('Rp', '').trim()}</td></tr>
                    <tr><td>4.</td><td>PPh 22</td><td>Rp.</td><td className="text-right">{formatRupiah(totalPPh22).replace('Rp', '').trim()}</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-8 text-sm">

                {/* PERBAIKAN ALIGNMENT CENTER UNTUK TANGGAL & PENERIMA */}
                <div className="text-center mb-12">
                  <p>Surakarta, {tglCetakFormat}</p>
                  <p>Yang menerima/berhak</p>
                </div>
                <table className="w-full text-left">
                  <tbody>
                    <tr><td className="w-24 align-top">Tanda tangan</td><td className="w-4 align-top text-center">:</td><td className="align-top">................................</td></tr>
                    <tr><td className="align-top">Nama</td><td className="align-top text-center">:</td><td className="font-bold align-top">TERLAMPIR</td></tr>
                    <tr><td className="align-top">Alamat</td><td className="align-top text-center">:</td><td className="align-top">................................</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="signature-section">
            <div className="border-t-2 border-black w-full mt-4 mb-4"></div>

            {/* PERBAIKAN TANDA TANGAN HALAMAN 2 (RATA BAWAH SEMPURNA) */}
            <div className="flex justify-between text-center mb-6">
              <div className="flex-1 px-1 flex flex-col justify-between h-[120px]">
                <div>
                  <p>Setuju dibayarkan</p><p>Pengguna Anggaran</p>
                </div>
                <div>
                  <div className="nowrap-name font-bold underline uppercase">{data.pejabat.pa?.nama}</div>
                  <div className="nowrap-name">NIP. {cleanNIP(data.pejabat.pa?.nip)}</div>
                </div>
              </div>
              <div className="flex-1 px-1 flex flex-col justify-between h-[120px]">
                <div className="mt-4">
                  <p>Bendahara Pengeluaran</p>
                </div>
                <div>
                  <div className="nowrap-name font-bold underline uppercase">{data.pejabat.bendahara?.nama}</div>
                  <div className="nowrap-name">NIP. {cleanNIP(data.pejabat.bendahara?.nip)}</div>
                </div>
              </div>
              <div className="flex-1 px-1 flex flex-col justify-between h-[120px]">
                <div className="mt-4">
                  <p>PPTK</p>
                </div>
                <div>
                  <div className="nowrap-name font-bold underline uppercase">{data.pejabat.pptk?.nama}</div>
                  <div className="nowrap-name">NIP. {cleanNIP(data.pejabat.pptk?.nip)}</div>
                </div>
              </div>
            </div>

            <div className="text-center font-bold mt-4 flex flex-col justify-between items-center h-[120px]">
              <div>
                <p>Telah diverifikasi</p>
                <p>Sekretaris Disnaker Kota Surakarta</p>
                <p>Selaku PPK</p>
              </div>
              <div>
                <div className="nowrap-name underline uppercase">{data.pejabat.ppk?.nama}</div>
                <div className="nowrap-name font-normal">NIP. {cleanNIP(data.pejabat.ppk?.nip)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* HALAMAN 3 : REKAPITULASI */}
        <div className="f4-page">
          <div className="font-bold mb-6 text-lg">
            <div>REKAPITULASI PENGADAAN BARANG / JASA / MODAL BULAN : {bulanFormat} {data.filterContext.tahun_anggaran}</div>
            <div>OPD : DINAS TENAGA KERJA KOTA SURAKARTA</div>
          </div>

          <table className="w-full border-collapse border-2 border-black text-center mb-12">
            <thead className="font-bold">
              <tr>
                <th className="border border-black p-2 w-10">NO</th>
                <th className="border border-black p-2">TANGGAL NOTA</th>
                <th className="border border-black p-2">JENIS BELANJA</th>
                <th className="border border-black p-2">PENYEDIA BARANG / JASA</th>
                <th className="border border-black p-2">JUMLAH</th>
                <th className="border border-black p-2">NO. REKENING BELANJA</th>
              </tr>
            </thead>
            <tbody>
              {groupedNotes.map((n, idx) => (
                <tr key={idx}>
                  <td className="border border-black p-2 align-top">{idx + 1}</td>
                  <td className="border border-black p-2 align-top whitespace-nowrap">{formatTanggal(n.tanggal_nota)}</td>

                  <td className="border border-black p-2 align-top text-left">
                    {data.rekeningDetail?.nama_rekening}<br />
                    Tahun Anggaran {data.filterContext.tahun_anggaran}<br />
                    {n.keterangan_nota && <span className="font-normal italic mt-2 block text-xs">{n.keterangan_nota}</span>}
                  </td>

                  <td className="border border-black p-2 align-top text-left">{n.nama_vendor}</td>
                  <td className="border border-black p-2 align-top text-right whitespace-nowrap">{formatRupiah(n.nominal_nota)}</td>
                  {idx === 0 && (
                    <td className="border border-black p-2 align-top whitespace-nowrap text-xs font-semibold tracking-tight" rowSpan={groupedNotes.length}>
                      {data.filterContext.kode_subkegiatan}.<br />{data.filterContext.kode_rekening}
                    </td>
                  )}
                </tr>
              ))}
              <tr className="font-bold bg-gray-50 print:bg-white">
                <td className="border border-black p-2 text-center uppercase" colSpan="4">JUMLAH</td>
                <td className="border border-black p-2 text-right">{formatRupiah(totalKotor)}</td>
                <td className="border border-black p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};