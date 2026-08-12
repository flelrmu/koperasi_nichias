




const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

function terbilangHelper(angka) {
  if (angka < 12) {
    return satuan[angka];
  } else if (angka < 20) {
    return terbilangHelper(angka - 10) + ' Belas';
  } else if (angka < 100) {
    return terbilangHelper(Math.floor(angka / 10)) + ' Puluh' + (angka % 10 > 0 ? ' ' + terbilangHelper(angka % 10) : '');
  } else if (angka < 200) {
    return 'Seratus' + (angka - 100 > 0 ? ' ' + terbilangHelper(angka - 100) : '');
  } else if (angka < 1000) {
    return terbilangHelper(Math.floor(angka / 100)) + ' Ratus' + (angka % 100 > 0 ? ' ' + terbilangHelper(angka % 100) : '');
  } else if (angka < 2000) {
    return 'Seribu' + (angka - 1000 > 0 ? ' ' + terbilangHelper(angka - 1000) : '');
  } else if (angka < 1000000) {
    return terbilangHelper(Math.floor(angka / 1000)) + ' Ribu' + (angka % 1000 > 0 ? ' ' + terbilangHelper(angka % 1000) : '');
  } else if (angka < 1000000000) {
    return terbilangHelper(Math.floor(angka / 1000000)) + ' Juta' + (angka % 1000000 > 0 ? ' ' + terbilangHelper(angka % 1000000) : '');
  } else if (angka < 1000000000000) {
    return terbilangHelper(Math.floor(angka / 1000000000)) + ' Miliar' + (angka % 1000000000 > 0 ? ' ' + terbilangHelper(angka % 1000000000) : '');
  } else if (angka < 1000000000000000) {
    return terbilangHelper(Math.floor(angka / 1000000000000)) + ' Triliun' + (angka % 1000000000000 > 0 ? ' ' + terbilangHelper(angka % 1000000000000) : '');
  }
  return '';
}





function angkaKeTerbilang(angka) {
  const num = Math.floor(Math.abs(parseFloat(angka) || 0));
  if (num === 0) return 'Nol Rupiah';
  return terbilangHelper(num) + ' Rupiah';
}

module.exports = angkaKeTerbilang;
