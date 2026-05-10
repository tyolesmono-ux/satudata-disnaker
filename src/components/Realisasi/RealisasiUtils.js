import { formatRupiah } from '../../utils/helpers';

export const guOptions = [
  ...Array.from({ length: 24 }, (_, i) => `GU-${String(i + 1).padStart(2, '0')}`),
  'GU-Nihil',
  'LS'
];

/**
 * Calculates remaining budget and volume for a specific item
 */
export const calculateRemaining = (rekeningId, rekenings, realisasiGU) => {
  if (!rekeningId) return { paguTotal: 0, volumeTotal: 0, paguTerpakai: 0, volumeTerpakai: 0, paguSisa: 0, volumeSisa: 0 };

  const rek = (rekenings || []).find(r => String(r.timestamp) === String(rekeningId));
  if (!rek) return { paguTotal: 0, volumeTotal: 0, paguTerpakai: 0, volumeTerpakai: 0, paguSisa: 0, volumeSisa: 0 };

  const realData = Array.isArray(realisasiGU) ? realisasiGU : [];
  const relevantNotes = realData.filter(r => String(r.rekening_id) === String(rekeningId));

  const paguTerpakai = relevantNotes.reduce((sum, r) => sum + Number(r.nominal_nota || 0), 0);
  const volumeTerpakai = relevantNotes.reduce((sum, r) => sum + Number(r.volume_nota || 0), 0);

  return {
    paguTotal: Number(rek.pagu || 0),
    volumeTotal: Number(rek.volume || 0),
    satuan: rek.satuan || '',
    hargaSatuan: Number(rek.harga_satuan || 0),
    paguTerpakai,
    volumeTerpakai,
    paguSisa: Number(rek.pagu || 0) - paguTerpakai,
    volumeSisa: Number(rek.volume || 0) - volumeTerpakai
  };
};

/**
 * Reset form data based on save mode
 */
export const getResetData = (mode, currentData, settings) => {
  const base = {
    tahun_anggaran: settings.activeTahun,
    tahap_anggaran: settings.activeTahap,
    bulan_spj: currentData.bulan_spj,
    proses_gu: currentData.proses_gu,
    kode_subkegiatan: mode === 'lanjut' ? currentData.kode_subkegiatan : '',
    kode_rekening: '',
    rekening_id: '',
    tanggal_nota: mode === 'lanjut' ? currentData.tanggal_nota : '',
    keterangan_nota: mode === 'lanjut' ? currentData.keterangan_nota : '',
    nik_vendor: mode === 'lanjut' ? currentData.nik_vendor : '',
    nama_vendor: mode === 'lanjut' ? currentData.nama_vendor : '',
    punya_npwp: mode === 'lanjut' ? currentData.punya_npwp : false,
    tipe_vendor: mode === 'lanjut' ? currentData.tipe_vendor : '',
    golongan_vendor: mode === 'lanjut' ? currentData.golongan_vendor : '',
    kategori_pajak: '',
    kop_pajak: '',
    nominal_nota: '',
    volume_nota: '',
    satuan_nota: '',
    ppn: 0, pph21: 0, pph22: 0, pph23: 0
  };
  return base;
};

/**
 * Calculates individual PPh21 for mass input
 */
export const calcMasalPph21 = (person, nominal) => {
  const nom = Number(nominal) || 0;
  if (person.tipe === 'ASN') {
    if (person.golongan === 'III') return Math.round(nom * 0.05);
    if (person.golongan === 'IV') return Math.round(nom * 0.15);
    return 0;
  }
  const hasNpwp = String(person.npwp || '').length > 5;
  return hasNpwp ? Math.round(nom * 0.03) : Math.round(nom * 0.06);
};
