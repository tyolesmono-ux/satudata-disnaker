import React, { useMemo } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { formatRupiah, formatTanggal, terbilang } from '../../utils/helpers';
import logoSurakarta from '../../assets/logo-surakarta.png';

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

  // Grouping: Untuk Rekapitulasi (Halaman 3), tampilkan 1 baris saja per SPJ (gabungan total)
  const groupedNotes = useMemo(() => {
    if (!data.notes || data.notes.length === 0) return [];

    // Karena PrintLayout ini dipanggil per 1 ID SPJ, maka kita gabungkan semua baris menjadi 1
    const summary = {
      ...data.notes[0],
      nominal_nota: totalKotor,
      // Jika ingin mencatat bahwa ini adalah gabungan, bisa modif keterangan_nota
    };

    return [summary];
  }, [data.notes, totalKotor]);

  return (
    <div className="bg-gray-200 print:bg-white min-h-screen pb-12 font-sans">
      <div className="sticky top-0 bg-[#0A192F] text-white p-4 shadow-md flex justify-between items-center z-50 print:hidden">
        <button onClick={onBack} className="flex items-center px-4 py-2 bg-white/10 rounded hover:bg-white/20"><ArrowLeft size={18} className="mr-2" /> Kembali</button>
        <div className="font-bold text-[#D4AF37]">Print Preview SPJ (Kertas F4 / Folio)</div>
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
                    <td className="border border-black p-2 align-top whitespace-nowrap text-xs font-semibold tracking-tight text-left" rowSpan={groupedNotes.length}>
                      {data.filterContext.kode_subkegiatan}<br />{data.filterContext.kode_rekening}
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
