import React, { useState, useMemo } from 'react';
import { InputField, SelectField } from './SharedUI';
import { GAS_URL } from '../config/constants';
import { formatRupiah } from '../utils/helpers';
import { Printer, ShieldCheck, Lock } from 'lucide-react';

export default function VerifikasiSPJ({ dataSPJ, setDataSPJ, realisasiGU, setRealisasiGU, rekenings, subKegiatans, kegiatans, pegawaiASN, setPrintData, showToast }) {
  const [showPajakModal, setShowPajakModal] = useState(false);
  const [selectedSPJ, setSelectedSPJ] = useState(null);
  const [pajakData, setPajakData] = useState({ tanggal_bayar: new Date().toISOString().split('T')[0] });
  const [isSubmittingPajak, setIsSubmittingPajak] = useState(false);

  const [showModalPejabat, setShowModalPejabat] = useState(false);
  const [pejabat, setPejabat] = useState({ no_bku: '', tanggal_cetak: new Date().toISOString().split('T')[0], pa_nip: '', bendahara_nip: '', pptk_nip: '', ppk_nip: '' });

  const activeSPJs = (dataSPJ || []).filter(spj => spj?.status_spj === 'Diproses' || spj?.status_spj === 'Valid');

  const handleCetak = (spj) => {
    setSelectedSPJ(spj);
    setShowModalPejabat(true);
  };

  const proceedToPrint = () => {
    if (!pejabat.pa_nip || !pejabat.bendahara_nip || !pejabat.pptk_nip || !pejabat.ppk_nip) {
      return showToast('Harap lengkapi pejabat penandatangan!', 'error');
    }

    const spjIdToFind = String(selectedSPJ.id_spj);
    const spjNotes = realisasiGU.filter(n => String(n.id_spj) === spjIdToFind);
    if (spjNotes.length === 0) {
      const notaWithSpj = realisasiGU.filter(n => n.id_spj && String(n.id_spj).trim() !== '');
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

    const historisTotal = realisasiGU.filter(r =>
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

    setIsSubmittingPajak(true);
    try {
      const payload = {
        action: 'update_pajak_spj',
        payload: {
          id_spj: selectedSPJ.id_spj,
          ...pajakData
        }
      };
      const response = await fetch(GAS_URL, {
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
    return (
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h4 className="font-bold mb-3 text-[#0A192F]">{label}</h4>
        <div className="space-y-3">
          <InputField label="Kode Billing" value={pajakData[`billing_${ppnKey}`] || ''} onChange={e => setPajakData({ ...pajakData, [`billing_${ppnKey}`]: e.target.value.replace(/[^0-9]/g, '').slice(0, 15) })} />
          <InputField label="NTPN" value={pajakData[`ntpn_${ppnKey}`] || ''} onChange={e => setPajakData({ ...pajakData, [`ntpn_${ppnKey}`]: e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 16) })} />
          <InputField label="NTB" value={pajakData[`ntb_${ppnKey}`] || ''} onChange={e => setPajakData({ ...pajakData, [`ntb_${ppnKey}`]: e.target.value.replace(/[^0-9]/g, '').slice(0, 12) })} />
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
                      <td className="p-4 text-xs font-bold font-mono">{spj.no_spj_resmi || spj.id_spj}</td>
                      <td className="p-4 font-bold">{spj.bidang}</td>
                      <td className="p-4">{spj.proses_gu}</td>
                      <td className="p-4 font-bold text-gray-800">{formatRupiah(spj?.total_kotor || 0)}</td>
                      <td className="p-4">
                        {Number(spj?.total_ppn || 0) > 0 && <div className="text-xs flex justify-between w-28"><span className="text-gray-500">PPN:</span><span className="font-semibold">{formatRupiah(spj?.total_ppn).replace('Rp', '')}</span></div>}
                        {Number(spj?.total_pph21 || 0) > 0 && <div className="text-xs flex justify-between w-28"><span className="text-gray-500">PPh 21:</span><span className="font-semibold">{formatRupiah(spj?.total_pph21).replace('Rp', '')}</span></div>}
                        {Number(spj?.total_pph22 || 0) > 0 && <div className="text-xs flex justify-between w-28"><span className="text-gray-500">PPh 22:</span><span className="font-semibold">{formatRupiah(spj?.total_pph22).replace('Rp', '')}</span></div>}
                        {Number(spj?.total_pph23 || 0) > 0 && <div className="text-xs flex justify-between w-28"><span className="text-gray-500">PPh 23:</span><span className="font-semibold">{formatRupiah(spj?.total_pph23).replace('Rp', '')}</span></div>}
                        {Number(spj?.total_ppn || 0) === 0 && Number(spj?.total_pph21 || 0) === 0 && Number(spj?.total_pph22 || 0) === 0 && Number(spj?.total_pph23 || 0) === 0 && <span className="text-gray-400 italic text-xs">Nihil</span>}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isPajakDone ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'} border`}>
                          {spj.status_spj}
                        </span>
                      </td>
                      <td className="p-4 flex gap-2 justify-center">
                        <button onClick={() => handleCetak(spj)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A192F] text-white hover:bg-[#122442] rounded-md transition-colors text-xs font-bold" title="Cetak SPJ"><Printer size={14} /> Cetak</button>
                        <button
                          onClick={() => handleInputPajak(spj)}
                          disabled={isPajakDone}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-xs font-bold ${isPajakDone ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' : 'bg-[#D4AF37] text-white hover:bg-[#b8952b]'}`}
                          title={isPajakDone ? 'Pajak sudah diinput' : 'Update Billing/NTPN Pajak'}
                        >
                          {isPajakDone ? <><Lock size={12} /> Terkunci</> : 'Pajak'}
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
      {showPajakModal && selectedSPJ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#0A192F] p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg text-[#D4AF37] flex items-center"><ShieldCheck className="mr-2" /> Input Data Pajak & Validasi SPJ</h3>
              <span className="bg-white/10 px-3 py-1 rounded text-sm font-mono">{selectedSPJ.id_spj}</span>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6 grid grid-cols-2 gap-4">
                <InputField label="Tanggal Bayar SPJ" type="date" value={pajakData.tanggal_bayar} onChange={e => setPajakData({ ...pajakData, tanggal_bayar: e.target.value })} required />
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bidang / Total</label>
                  <div className="px-4 py-2 bg-white rounded border text-sm font-bold text-gray-700">
                    {selectedSPJ?.bidang} - {formatRupiah(selectedSPJ?.total_kotor || 0)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {Number(selectedSPJ.total_ppn) > 0 && renderPajakInputs(`PPN (${formatRupiah(selectedSPJ.total_ppn)})`, 'ppn')}
                {Number(selectedSPJ.total_pph21) > 0 && renderPajakInputs(`PPh 21 (${formatRupiah(selectedSPJ.total_pph21)})`, 'pph21')}
                {Number(selectedSPJ.total_pph22) > 0 && renderPajakInputs(`PPh 22 (${formatRupiah(selectedSPJ.total_pph22)})`, 'pph22')}
                {Number(selectedSPJ.total_pph23) > 0 && renderPajakInputs(`PPh 23 (${formatRupiah(selectedSPJ.total_pph23)})`, 'pph23')}
                {Number(selectedSPJ.total_ppn) === 0 && Number(selectedSPJ.total_pph21) === 0 && Number(selectedSPJ.total_pph22) === 0 && Number(selectedSPJ.total_pph23) === 0 && (
                  <div className="col-span-full p-6 text-center text-gray-500 italic bg-gray-50 border rounded-lg">SPJ ini tidak memiliki potongan pajak. Anda dapat langsung menyimpan validasinya.</div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" disabled={isSubmittingPajak} onClick={() => setShowPajakModal(false)} className="px-6 py-2.5 border rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50">Batal</button>
                <button type="button" disabled={isSubmittingPajak} onClick={savePajak} className={`px-8 py-2.5 bg-[#0A192F] text-[#D4AF37] rounded-lg font-bold shadow-lg hover:bg-[#122442] hover:-translate-y-0.5 transition-all disabled:opacity-50 ${isSubmittingPajak ? 'cursor-not-allowed' : ''}`}>
                  {isSubmittingPajak ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin"></span>
                      Memproses...
                    </span>
                  ) : 'Simpan & Validasi SPJ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PEJABAT CETAK */}
      {showModalPejabat && selectedSPJ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#0A192F] p-4 text-white">
              <h3 className="font-bold text-lg text-[#D4AF37] flex items-center"><Printer className="mr-2" /> Penandatangan Dokumen Cetak</h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <InputField label="Nomor BKU (Opsional)" value={pejabat.no_bku} onChange={e => setPejabat({ ...pejabat, no_bku: e.target.value })} placeholder="Kosongi jika tulis manual" />
                <InputField label="Tanggal Cetak" type="date" value={pejabat.tanggal_cetak} onChange={e => setPejabat({ ...pejabat, tanggal_cetak: e.target.value })} required />
              </div>

              <div className="space-y-4 bg-gray-50 p-5 rounded-xl border">
                <SelectField label="Pengguna Anggaran (PA)" value={pejabat.pa_nip} onChange={e => setPejabat({ ...pejabat, pa_nip: e.target.value })}><option value="">-- Pilih Pejabat --</option>{listPA.map(p => <option key={p?.nip} value={p?.nip}>{p?.nama}</option>)}</SelectField>
                <SelectField label="Bendahara Pengeluaran" value={pejabat.bendahara_nip} onChange={e => setPejabat({ ...pejabat, bendahara_nip: e.target.value })}><option value="">-- Pilih Pejabat --</option>{listBendahara.map(p => <option key={p?.nip} value={p?.nip}>{p?.nama}</option>)}</SelectField>
                <SelectField label="Pejabat Pelaksana Teknis (PPTK)" value={pejabat.pptk_nip} onChange={e => setPejabat({ ...pejabat, pptk_nip: e.target.value })}><option value="">-- Pilih Pejabat --</option>{listPPTK.map(p => <option key={p?.nip} value={p?.nip}>{p?.nama}</option>)}</SelectField>
                <SelectField label="Sekretaris selaku PPK" value={pejabat.ppk_nip} onChange={e => setPejabat({ ...pejabat, ppk_nip: e.target.value })}><option value="">-- Pilih Pejabat --</option>{listPPK.map(p => <option key={p?.nip} value={p?.nip}>{p?.nama}</option>)}</SelectField>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t">
                <button onClick={() => setShowModalPejabat(false)} className="px-6 py-2.5 border rounded-lg hover:bg-gray-50 transition-colors font-semibold">Tutup</button>
                <button onClick={proceedToPrint} className="flex items-center px-8 py-2.5 bg-[#0A192F] text-white rounded-lg font-bold shadow-lg hover:bg-[#122442] hover:-translate-y-0.5 transition-all">
                  <Printer size={16} className="mr-2 text-[#D4AF37]" /> Preview SPJ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
