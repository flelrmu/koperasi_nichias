/**
 * Konversi angka menjadi terbilang dalam Bahasa Indonesia
 * Contoh: 20000000 -> "Dua Puluh Juta Rupiah"
 */

const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

function terbilangHelper(angka) {
  if (angka < 12) return satuan[angka];
  if (angka < 20) return terbilangHelper(angka - 10) + ' Belas';
  if (angka < 100) return terbilangHelper(Math.floor(angka / 10)) + ' Puluh' + (angka % 10 > 0 ? ' ' + terbilangHelper(angka % 10) : '');
  if (angka < 200) return 'Seratus' + (angka - 100 > 0 ? ' ' + terbilangHelper(angka - 100) : '');
  if (angka < 1000) return terbilangHelper(Math.floor(angka / 100)) + ' Ratus' + (angka % 100 > 0 ? ' ' + terbilangHelper(angka % 100) : '');
  if (angka < 2000) return 'Seribu' + (angka - 1000 > 0 ? ' ' + terbilangHelper(angka - 1000) : '');
  if (angka < 1000000) return terbilangHelper(Math.floor(angka / 1000)) + ' Ribu' + (angka % 1000 > 0 ? ' ' + terbilangHelper(angka % 1000) : '');
  if (angka < 1000000000) return terbilangHelper(Math.floor(angka / 1000000)) + ' Juta' + (angka % 1000000 > 0 ? ' ' + terbilangHelper(angka % 1000000) : '');
  if (angka < 1000000000000) return terbilangHelper(Math.floor(angka / 1000000000)) + ' Miliar' + (angka % 1000000000 > 0 ? ' ' + terbilangHelper(angka % 1000000000) : '');
  if (angka < 1000000000000000) return terbilangHelper(Math.floor(angka / 1000000000000)) + ' Triliun' + (angka % 1000000000000 > 0 ? ' ' + terbilangHelper(angka % 1000000000000) : '');
  return '';
}

/**
 * @param {number|string} angka - Angka yang akan dikonversi
 * @returns {string} Terbilang dalam Bahasa Indonesia + " Rupiah"
 */
export default function angkaKeTerbilang(angka) {
  const num = Math.floor(Math.abs(parseFloat(angka) || 0));
  if (num === 0) return 'Nol Rupiah';
  return terbilangHelper(num) + ' Rupiah';
}
