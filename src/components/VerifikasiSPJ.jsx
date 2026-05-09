import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { InputField, SelectField } from './SharedUI';
import { GAS_URL } from '../config/constants';
import { fetchWithTimeout } from '../utils/api';
import { formatRupiah } from '../utils/helpers';
import { Printer, ShieldCheck, Lock, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function VerifikasiSPJ() {
  const {
    dataSPJ, setDataSPJ, realisasiGU, setRealisasiGU,
    rekenings, subKegiatans, kegiatans, pegawaiASN,
    setPrintData, showToast, user, token
  } = useAppStore();

  const [showPajakModal, setShowPajakModal] = useState(false);
  const [selectedSPJ, setSelectedSPJ] = useState(null);
  const [pajakData, setPajakData] = useState({ tanggal_bayar: new Date().toISOString().split('T')[0] });
  const [isSubmittingPajak, setIsSubmittingPajak] = useState(false);

  const [showModalPejabat, setShowModalPejabat] = useState(false);
  const [pejabat, setPejabat] = useState({ no_bku: '', tanggal_cetak: new Date().toISOString().split('T')[0], pa_nip: '', bendahara_nip: '', pptk_nip: '', ppk_nip: '' });

  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', onConfirm: null });

  const activeSPJs = (Array.isArray(dataSPJ) ? dataSPJ : []).filter(spj => spj?.status_spj === 'Diproses' || spj?.status_spj === 'Valid');

  const handleCetak = (spj) => {
    setSelectedSPJ(spj);
    setShowModalPejabat(true);
  };

  const proceedToPrint = () => {
    if (!pejabat.pa_nip || !pejabat.bendahara_nip || !pejabat.pptk_nip || !pejabat.ppk_nip) {
      return showToast('Harap lengkapi pejabat penandatangan!', 'error');
    }

    const spjIdToFind = String(selectedSPJ.id_spj);
    const realData = Array.isArray(realisasiGU) ? realisasiGU : [];
    const spjNotes = realData.filter(n => String(n.id_spj) === spjIdToFind);
    if (spjNotes.length === 0) {
      const notaWithSpj = realData.filter(n => n.id_spj && String(n.id_spj).trim() !== '');
      return showToast(
        `Tidak ada nota ditemukan untuk SPJ ini (${spjIdToFind}). Nota dengan id_spj: ${notaWithSpj.length}. Pastikan Code.gs sudah di-deploy ulang.`,
        'error'
      );
    }

    const sampleNota = spjNotes[0];
    const rekDet = (rekenings || []).find(r => String(r?.kode_rekening) === String(sampleNota?.kode_rekening)) || {};
    const subDet = (subKegiatans || []).find(s => String(s?.kode_subkegiatan) === String(sampleNota?.kode_subkegiatan)) || {};
    const kegDet = (kegiatans || []).find(k => String(k?.kode_kegiatan) === String(subDet?.kode_kegiatan)) || {};

    const getPegawai = (nip) => (pegawaiASN || []).find(p => String(p?.nip) === String(nip)) || {};

    const filterContext = {
      tahun_anggaran: sampleNota.tahun_anggaran,
      tahap_anggaran: sampleNota.tahap_anggaran,
      bulan_spj: sampleNota.bulan_spj,
      proses_gu: sampleNota.proses_gu,
      kode_subkegiatan: sampleNota.kode_subkegiatan,
      kode_rekening: sampleNota.kode_rekening
    };

    const historisTotal = realData.filter(r =>
      String(r.tahun_anggaran) === String(filterContext.tahun_anggaran) &&
      String(r.tahap_anggaran) === String(filterContext.tahap_anggaran) &&
      String(r.kode_subkegiatan) === String(filterContext.kode_subkegiatan) &&
      String(r.kode_rekening) === String(filterContext.kode_rekening) &&
      String(r.id_spj) !== String(selectedSPJ.id_spj) && r.status_nota === 'Valid'
    ).reduce((sum, r) => sum + Number(r.nominal_nota || 0), 0);

    const printPayload = {
      notes: spjNotes,
      filterContext: filterContext,
      rekeningDetail: rekDet,
      kegiatanDetail: kegDet,
      subkegiatanDetail: subDet,
      pejabat: {
        no_bku: pejabat.no_bku,
        tanggal_cetak: pejabat.tanggal_cetak,
        pa: getPegawai(pejabat.pa_nip),
        bendahara: getPegawai(pejabat.bendahara_nip),
        pptk: getPegawai(pejabat.pptk_nip),
        ppk: getPegawai(pejabat.ppk_nip)
      },
      historisTotal: historisTotal
    };

    setPrintData(printPayload);
    setShowModalPejabat(false);
  };

  const handleInputPajak = (spj) => {
    if (spj.status_spj === 'Valid') {
      return showToast('Data pajak untuk SPJ ini sudah pernah diinput.', 'error');
    }
    setSelectedSPJ(spj);
    setPajakData({ tanggal_bayar: new Date().toISOString().split('T')[0] });
    setShowPajakModal(true);
  };

  const savePajak = async () => {
    if (isSubmittingPajak) return; // Guard double-click
    if (!pajakData.tanggal_bayar) return showToast('Tanggal bayar wajib diisi!', 'error');

    setConfirmDialog({
      show: true,
      title: 'Validasi & Kunci SPJ',
      message: 'Apakah Anda yakin data pajak ini sudah benar? Aksi ini akan mengubah status SPJ menjadi Valid secara permanen dan tidak dapat diubah lagi.',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, show: false });
        await proceedSavePajak();
      }
    });
  };

  const proceedSavePajak = async () => {
    setIsSubmittingPajak(true);
    try {
      const payload = {
        action: 'update_pajak_spj',
        token,
        payload: {
          id_spj: selectedSPJ.id_spj,
          ...pajakData
        }
      };
      const response = await fetchWithTimeout(GAS_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const res = await response.json();
      if (res.status === 'success') {
        showToast('Pajak diupdate dan SPJ menjadi Valid. No Resmi: ' + res.no_spj_resmi, 'success');
        setShowPajakModal(false);

        // Update state lokal tanpa full reload
        setDataSPJ(prev => prev.map(spj =>
          String(spj.id_spj) === String(selectedSPJ.id_spj)
            ? { ...spj, status_spj: 'Valid', no_spj_resmi: res.no_spj_resmi, tanggal_bayar: pajakData.tanggal_bayar, ...pajakData }
            : spj
        ));
        setRealisasiGU(prev => prev.map(n =>
          String(n.id_spj) === String(selectedSPJ.id_spj)
            ? { ...n, status_nota: 'Valid', status_spj: 'Valid' }
            : n
        ));
      } else {
        showToast('Gagal update pajak: ' + res.message, 'error');
      }
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      setIsSubmittingPajak(false);
    }
  };

  const renderPajakInputs = (label, ppnKey) => {
    const colors = {
      ppn: 'border-blue-200 bg-blue-50/30 text-blue-700',
      pph21: 'border-orange-200 bg-orange-50/30 text-orange-700',
      pph22: 'border-purple-200 bg-purple-50/30 text-purple-700',
      pph23: 'border-rose-200 bg-rose-50/30 text-rose-700'
    };
    const colorClass = colors[ppnKey] || 'border-gray-200 bg-gray-50/30';

    return (
      <div className={`p-5 rounded-2xl border-2 transition-all duration-300 hover:shadow-md ${colorClass}`}>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-black text-sm uppercase tracking-wider">{label}</h4>
          <div className="p-1.5 bg-white/50 rounded-lg">
            <ShieldCheck size={16} />
          </div>
        </div>
        <div className="space-y-4">
          <InputField 
            label="Kode Billing (15 Digit)" 
            value={pajakData[`billing_${ppnKey}`] || ''} 
            onChange={e => setPajakData({ ...pajakData, [`billing_${ppnKey}`]: e.target.value.replace(/[^0-9]/g, '').slice(0, 15) })}
            placeholder="000000000000000"
            className="bg-white/80 border-transparent focus:bg-white"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField 
              label="NTPN (16 Digit)" 
              value={pajakData[`ntpn_${ppnKey}`] || ''} 
              onChange={e => setPajakData({ ...pajakData, [`ntpn_${ppnKey}`]: e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 16) })}
              placeholder="ABC123XYZ..."
              className="bg-white/80 border-transparent focus:bg-white"
            />
            <InputField 
              label="NTB (12 Digit)" 
              value={pajakData[`ntb_${ppnKey}`] || ''} 
              onChange={e => setPajakData({ ...pajakData, [`ntb_${ppnKey}`]: e.target.value.replace(/[^0-9]/g, '').slice(0, 12) })}
              placeholder="000000000000"
              className="bg-white/80 border-transparent focus:bg-white"
            />
          </div>
        </div>
      </div>
    );
  };

  const listPA = useMemo(() => {
    const filtered = (pegawaiASN || []).filter(p => p.peran_jabatan === 'PA');
    return filtered.length > 0 ? filtered : (pegawaiASN || []);
  }, [pegawaiASN]);

  const listBendahara = useMemo(() => {
    const filtered = (pegawaiASN || []).filter(p => p.peran_jabatan === 'Bendahara');
    return filtered.length > 0 ? filtered : (pegawaiASN || []);
  }, [pegawaiASN]);

  const listPPTK = useMemo(() => {
    const filtered = (pegawaiASN || []).filter(p => p.peran_jabatan === 'PPTK');
    return filtered.length > 0 ? filtered : (pegawaiASN || []);
  }, [pegawaiASN]);

  const listPPK = useMemo(() => {
    const filtered = (pegawaiASN || []).filter(p => p.peran_jabatan === 'PPK');
    return filtered.length > 0 ? filtered : (pegawaiASN || []);
  }, [pegawaiASN]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6 border-b pb-2">
          <h2 className="text-xl font-bold flex items-center text-[#0A192F]">
            <ShieldCheck className="mr-2 text-[#D4AF37]" size={24} /> Verifikasi & Input Pajak SPJ
          </h2>
        </div>

        {activeSPJs.length === 0 ? (
          <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg italic">Tidak ada SPJ yang perlu diproses/diverifikasi.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border object-contain bg-white">
            <table className="w-full text-sm text-left border-separate border-spacing-0">
              <thead className="bg-[#0A192F] text-white">
                <tr>
                  <th className="p-4 font-semibold border-b border-[#0A192F]/10">ID / No. Resmi</th>
                  <th className="p-4 font-semibold border-b border-[#0A192F]/10">Bidang</th>
                  <th className="p-4 font-semibold border-b border-[#0A192F]/10">Proses GU</th>
                  <th className="p-4 font-semibold border-b border-[#0A192F]/10">Total Belanja (Kotor)</th>
                  <th className="p-4 font-semibold border-b border-[#0A192F]/10">Potongan Pajak</th>
                  <th className="p-4 font-semibold border-b border-[#0A192F]/10">Status</th>
                  <th className="p-4 font-semibold border-b border-[#0A192F]/10 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeSPJs.map((spj, i) => {
                  const isPajakDone = spj.status_spj === 'Valid';
                  return (
                    <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                      <td className="p-4 text-xs font-bold">{spj.no_spj_resmi || spj.id_spj}</td>
                      <td className="p-4 font-bold">{spj.bidang}</td>
                      <td className="p-4">{spj.proses_gu}</td>
                      <td className="p-4 font-bold text-gray-800">{formatRupiah(spj?.total_kotor || 0)}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 min-w-[120px]">
                          {Number(spj?.total_ppn || 0) > 0 && <div className="text-[10px] flex justify-between bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-blue-700 font-bold"><span>PPN</span><span>{formatRupiah(spj?.total_ppn).replace('Rp', '')}</span></div>}
                          {Number(spj?.total_pph21 || 0) > 0 && <div className="text-[10px] flex justify-between bg-orange-50 px-2 py-0.5 rounded border border-orange-100 text-orange-700 font-bold"><span>PPh 21</span><span>{formatRupiah(spj?.total_pph21).replace('Rp', '')}</span></div>}
                          {Number(spj?.total_pph22 || 0) > 0 && <div className="text-[10px] flex justify-between bg-purple-50 px-2 py-0.5 rounded border border-purple-100 text-purple-700 font-bold"><span>PPh 22</span><span>{formatRupiah(spj?.total_pph22).replace('Rp', '')}</span></div>}
                          {Number(spj?.total_pph23 || 0) > 0 && <div className="text-[10px] flex justify-between bg-rose-50 px-2 py-0.5 rounded border border-rose-100 text-rose-700 font-bold"><span>PPh 23</span><span>{formatRupiah(spj?.total_pph23).replace('Rp', '')}</span></div>}
                          {Number(spj?.total_ppn || 0) === 0 && Number(spj?.total_pph21 || 0) === 0 && Number(spj?.total_pph22 || 0) === 0 && Number(spj?.total_pph23 || 0) === 0 && <span className="text-gray-400 italic text-xs">Nihil</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isPajakDone ? 'bg-green-100 text-green-700 border-green-200 shadow-sm shadow-green-100' : 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm shadow-amber-100'} border`}>
                          {spj.status_spj}
                        </span>
                      </td>
                      <td className="p-4 flex gap-2 justify-center">
                        <button onClick={() => handleCetak(spj)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A192F] text-white hover:bg-[#122442] rounded-md transition-all hover-scale text-xs font-bold" title="Cetak SPJ"><Printer size={14} /> Cetak</button>
                        <button
                          onClick={() => handleInputPajak(spj)}
                          disabled={isPajakDone || user?.role === 'kepala_bidang'}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-300 hover-scale text-xs font-bold ${isPajakDone || user?.role === 'kepala_bidang' ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' : 'bg-[#D4AF37] text-white hover:bg-[#b8952b]'}`}
                          title={user?.role === 'kepala_bidang' ? 'Akses Terbatas' : (isPajakDone ? 'Pajak sudah diinput' : 'Update Billing/NTPN Pajak')}
                        >
                          {user?.role === 'kepala_bidang' ? <><Lock size={12} /> View</> : (isPajakDone ? <><Lock size={12} /> Terkunci</> : 'Pajak')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL INPUT PAJAK */}
      {showPajakModal && selectedSPJ && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl animate-in zoom-in-95 fade-in duration-300 my-auto">
            {/* Header - selalu terlihat */}
            <div className="bg-[#0A192F] rounded-t-2xl p-6 text-white flex justify-between items-center border-b border-[#D4AF37]/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#D4AF37] rounded-lg text-[#0A192F]">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-black text-lg">Input Data Pajak & Validasi SPJ</h3>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{selectedSPJ.id_spj}</p>
                </div>
              </div>
              <button onClick={() => setShowPajakModal(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                <AlertCircle size={22} />
              </button>
            </div>

            {/* Body - semua konten */}
            <div className="p-8">
              {/* Info SPJ */}
              <div className="bg-gray-50 border border-gray-200 p-5 rounded-2xl mb-8 flex flex-col md:flex-row gap-6 items-stretch">
                <div className="flex-1">
                  <InputField
                    label="📅 Tanggal Bayar / Validasi SPJ"
                    type="date"
                    value={pajakData.tanggal_bayar}
                    onChange={e => setPajakData({ ...pajakData, tanggal_bayar: e.target.value })}
                    required
                  />
                </div>
                <div className="flex-1 p-4 bg-[#0A192F] rounded-xl text-white">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Bidang & Total Bruto</p>
                  <p className="font-black text-base text-[#D4AF37] truncate">{selectedSPJ?.bidang}</p>
                  <p className="text-lg font-mono font-bold">{formatRupiah(selectedSPJ?.total_kotor || 0)}</p>
                </div>
              </div>

              {/* Grid Input Pajak - dinamis 1 atau 2 kolom */}
              <div className={`grid gap-6 mb-8 ${
                [
                  Number(selectedSPJ.total_ppn),
                  Number(selectedSPJ.total_pph21),
                  Number(selectedSPJ.total_pph22),
                  Number(selectedSPJ.total_pph23)
                ].filter(v => v > 0).length > 1 ? 'md:grid-cols-2' : 'grid-cols-1'
              }`}>
                {Number(selectedSPJ.total_ppn) > 0 && renderPajakInputs(`PPN (${formatRupiah(selectedSPJ.total_ppn)})`, 'ppn')}
                {Number(selectedSPJ.total_pph21) > 0 && renderPajakInputs(`PPh 21 (${formatRupiah(selectedSPJ.total_pph21)})`, 'pph21')}
                {Number(selectedSPJ.total_pph22) > 0 && renderPajakInputs(`PPh 22 (${formatRupiah(selectedSPJ.total_pph22)})`, 'pph22')}
                {Number(selectedSPJ.total_pph23) > 0 && renderPajakInputs(`PPh 23 (${formatRupiah(selectedSPJ.total_pph23)})`, 'pph23')}
                {Number(selectedSPJ.total_ppn) === 0 && Number(selectedSPJ.total_pph21) === 0 && Number(selectedSPJ.total_pph22) === 0 && Number(selectedSPJ.total_pph23) === 0 && (
                  <div className="p-10 text-center text-gray-500 italic bg-gray-50 border-2 border-dashed rounded-2xl">
                    <ShieldCheck size={40} className="mx-auto mb-3 text-gray-300" />
                    SPJ ini tidak memiliki potongan pajak.<br/>Anda dapat langsung menyimpan validasinya.
                  </div>
                )}
              </div>

              {/* Tombol Aksi */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  disabled={isSubmittingPajak}
                  onClick={() => setShowPajakModal(false)}
                  className="px-8 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-bold text-gray-600 active:scale-95 disabled:opacity-50"
                >
                  Batal
                </button>
                {user?.role !== 'kepala_bidang' && (
                  <button
                    type="button"
                    disabled={isSubmittingPajak}
                    onClick={savePajak}
                    className="flex items-center justify-center gap-2 px-10 py-3 bg-[#0A192F] text-[#D4AF37] rounded-xl font-black shadow-lg hover:bg-[#122442] hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSubmittingPajak ? (
                      <><span className="w-5 h-5 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin"></span> Menyimpan...</>
                    ) : (
                      <><Save size={18} /> Simpan & Validasi SPJ</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* MODAL PEJABAT CETAK */}
      {showModalPejabat && selectedSPJ && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-300 my-auto">
            {/* Header */}
            <div className="bg-[#0A192F] rounded-t-2xl p-6 text-white flex justify-between items-center border-b border-[#D4AF37]/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#D4AF37] rounded-lg text-[#0A192F]">
                  <Printer size={20} />
                </div>
                <div>
                  <h3 className="font-black text-lg">Cetak Dokumen SPJ</h3>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Konfigurasi Penandatangan</p>
                </div>
              </div>
              <button onClick={() => setShowModalPejabat(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                <AlertCircle size={22} />
              </button>
            </div>

            {/* Body */}
            <div className="p-8">
              <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl mb-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField label="📝 Nomor BKU (Opsional)" value={pejabat.no_bku} onChange={e => setPejabat({ ...pejabat, no_bku: e.target.value })} placeholder="Kosongi jika tulis manual" />
                <InputField label="📅 Tanggal Cetak" type="date" value={pejabat.tanggal_cetak} onChange={e => setPejabat({ ...pejabat, tanggal_cetak: e.target.value })} required />
              </div>

              <div className="space-y-5 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Pejabat Penandatangan</p>
                <SelectField label="Pengguna Anggaran (PA)" value={pejabat.pa_nip} onChange={e => setPejabat({ ...pejabat, pa_nip: e.target.value })}>
                  <option value="">-- Pilih Pejabat --</option>
                  {listPA.map(p => <option key={p?.nip} value={p?.nip}>{p?.nama}</option>)}
                </SelectField>
                <SelectField label="Bendahara Pengeluaran" value={pejabat.bendahara_nip} onChange={e => setPejabat({ ...pejabat, bendahara_nip: e.target.value })}>
                  <option value="">-- Pilih Pejabat --</option>
                  {listBendahara.map(p => <option key={p?.nip} value={p?.nip}>{p?.nama}</option>)}
                </SelectField>
                <SelectField label="Pejabat Pelaksana Teknis (PPTK)" value={pejabat.pptk_nip} onChange={e => setPejabat({ ...pejabat, pptk_nip: e.target.value })}>
                  <option value="">-- Pilih Pejabat --</option>
                  {listPPTK.map(p => <option key={p?.nip} value={p?.nip}>{p?.nama}</option>)}
                </SelectField>
                <SelectField label="Sekretaris selaku PPK" value={pejabat.ppk_nip} onChange={e => setPejabat({ ...pejabat, ppk_nip: e.target.value })}>
                  <option value="">-- Pilih Pejabat --</option>
                  {listPPK.map(p => <option key={p?.nip} value={p?.nip}>{p?.nama}</option>)}
                </SelectField>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
                <button onClick={() => setShowModalPejabat(false)} className="px-8 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-bold text-gray-600 active:scale-95">Batal</button>
                <button onClick={proceedToPrint} className="flex items-center justify-center gap-2 px-10 py-3 bg-[#0A192F] text-white rounded-xl font-black shadow-lg hover:bg-[#122442] hover:-translate-y-0.5 active:scale-95 transition-all">
                  <Printer size={18} className="text-[#D4AF37]" /> Preview Dokumen
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* PREMIUM CONFIRM DIALOG */}
      {confirmDialog.show && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-amber-100/50">
                <AlertCircle size={40} className="text-[#D4AF37] animate-bounce" />
              </div>
              <h3 className="text-2xl font-black text-[#0A192F] mb-3">{confirmDialog.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-8 px-4">{confirmDialog.message}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setConfirmDialog({ ...confirmDialog, show: false })}
                  className="px-6 py-3.5 border-2 border-gray-100 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all active:scale-95"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmDialog.onConfirm}
                  className="px-6 py-3.5 bg-[#0A192F] text-[#D4AF37] rounded-xl font-black shadow-lg shadow-[#0A192F]/20 hover:bg-[#122442] hover:-translate-y-1 transition-all active:scale-95"
                >
                  Ya, Lanjutkan
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
