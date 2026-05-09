import { z } from 'zod';

// Helper for numeric strings
const numericString = z.string().regex(/^\d+$/, 'Harus berupa angka');
const rupiahString = z.string().transform(val => val.replace(/[^\d]/g, '')).pipe(numericString);

export const ProgramSchema = z.object({
  kode_program: z.string().min(1, 'Kode Program wajib diisi'),
  nama_program: z.string().min(5, 'Nama Program minimal 5 karakter')
});

export const KegiatanSchema = z.object({
  kode_program: z.string().min(1, 'Wajib pilih Program'),
  kode_kegiatan: z.string().min(1, 'Kode Kegiatan wajib diisi'),
  nama_kegiatan: z.string().min(5, 'Nama Kegiatan minimal 5 karakter')
});

export const SubKegiatanSchema = z.object({
  kode_kegiatan: z.string().min(1, 'Wajib pilih Kegiatan'),
  kode_subkegiatan: z.string().min(1, 'Kode Sub Kegiatan wajib diisi'),
  nama_subkegiatan: z.string().min(5, 'Nama Sub Kegiatan minimal 5 karakter')
});

export const RekeningSchema = z.object({
  kode_subkegiatan: z.coerce.string().min(1, 'Wajib pilih Sub Kegiatan'),
  kode_rekening: z.coerce.string().min(1, 'Kode Rekening wajib diisi'),
  nama_rekening: z.string().min(3, 'Nama Rekening minimal 3 karakter'),
  pagu: z.coerce.number().min(0, 'Pagu tidak boleh negatif'),
  tahun_anggaran: z.coerce.string(),
  tahap_anggaran: z.coerce.string()
});

export const PegawaiASNSchema = z.object({
  nip: z.string().length(18, 'NIP harus 18 digit angka'),
  nama: z.string().min(3, 'Nama Lengkap minimal 3 karakter'),
  nik: z.string().length(16, 'NIK harus 16 digit'),
  nitku: z.string().optional(),
  npwp: z.string().optional(),
  golongan: z.string().min(1, 'Golongan wajib dipilih'),
  peran_jabatan: z.string().min(1, 'Peran Jabatan wajib dipilih'),
  kategori_pegawai: z.string().optional()
});

export const WPPribadiSchema = z.object({
  nik: z.string().length(16, 'NIK harus 16 digit'),
  nitku: z.string().optional(),
  npwp: z.string().min(15, 'NPWP minimal 15 digit'),
  nama: z.string().min(3, 'Nama Lengkap wajib diisi')
});

export const WPPihakKetigaSchema = z.object({
  nik: z.string().length(16, 'NIK Pemilik harus 16 digit'),
  nitku: z.string().optional(),
  npwp: z.string().min(15, 'NPWP minimal 15 digit'),
  nama_pemilik: z.string().min(3, 'Nama Pemilik wajib diisi'),
  nama_usaha: z.string().min(3, 'Nama Usaha wajib diisi')
});

export const RealisasiGUSchema = z.object({
  tahun_anggaran: z.coerce.string(),
  tahap_anggaran: z.coerce.string(),
  bulan_spj: z.string().min(1, 'Bulan SPJ wajib diisi'),
  proses_gu: z.string().min(1, 'Proses GU wajib diisi'),
  kode_subkegiatan: z.string().min(1, 'Sub Kegiatan wajib dipilih'),
  kode_rekening: z.string().min(1, 'Rekening wajib dipilih'),
  tanggal_nota: z.string().min(1, 'Tanggal Nota wajib diisi'),
  keterangan_nota: z.string().min(5, 'Keterangan minimal 5 karakter'),
  nik_vendor: z.string().min(1, 'Vendor wajib dipilih'),
  nominal_nota: z.coerce.number().positive('Nominal harus lebih dari 0'),
  kategori_pajak: z.string().optional(),
  kop_pajak: z.string().optional()
});

export const EntitySchemas = {
  Program: ProgramSchema,
  Kegiatan: KegiatanSchema,
  SubKegiatan: SubKegiatanSchema,
  Rekening: RekeningSchema,
  PegawaiASN: PegawaiASNSchema,
  WPPribadi: WPPribadiSchema,
  WPPihakKetiga: WPPihakKetigaSchema,
  RealisasiGU: RealisasiGUSchema
};
