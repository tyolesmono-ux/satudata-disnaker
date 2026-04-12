// File: src/utils/helpers.js

export function terbilang(angka) {
  const bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  let num = Math.abs(angka);
  if (num < 12) return bilangan[num];
  if (num < 20) return terbilang(num - 10) + ' Belas';
  if (num < 100) return terbilang(Math.floor(num / 10)) + ' Puluh ' + terbilang(num % 10);
  if (num < 200) return 'Seratus ' + terbilang(num - 100);
  if (num < 1000) return terbilang(Math.floor(num / 100)) + ' Ratus ' + terbilang(num % 100);
  if (num < 2000) return 'Seribu ' + terbilang(num - 1000);
  if (num < 1000000) return terbilang(Math.floor(num / 1000)) + ' Ribu ' + terbilang(num % 1000);
  if (num < 1000000000) return terbilang(Math.floor(num / 1000000)) + ' Juta ' + terbilang(num % 1000000);
  if (num < 1000000000000) return terbilang(Math.floor(num / 1000000000)) + ' Milyar ' + terbilang(num % 1000000000);
  return '';
}

export const formatRupiah = (angka) => {
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0 
  }).format(angka || 0);
};

export const formatTanggal = (tgl) => {
  if (!tgl) return ''; 
  const date = new Date(tgl);
  const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
};