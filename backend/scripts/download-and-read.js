const fs = require('fs');
const path = require('path');
const https = require('https');
const ExcelJS = require('exceljs');

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      // Handle all 3xx redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      const file = fs.createWriteStream(dest);
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function analyze() {
  const lapUrl = 'https://docs.google.com/spreadsheets/d/1HZse-clFSzS3y9c-smiRlENZuyaT-hBhDrcJrQypTEg/export?format=xlsx';
  const shuUrl = 'https://docs.google.com/spreadsheets/d/1zAnMHmgUfW5jPh8usVRBdmsR89T9_JFXNfzSL0J0QgQ/export?format=xlsx';
  
  const lapFile = path.join(__dirname, '../laporan_2024.xlsx');
  const shuFile = path.join(__dirname, '../shu_2024.xlsx');
  
  try {
    console.log('📥 Mendownload Laporan 2024...');
    await downloadFile(lapUrl, lapFile);
    console.log('📥 Mendownload SHU 2024...');
    await downloadFile(shuUrl, shuFile);
    
    console.log('\n🔍 Menganalisis Laporan 2024...');
    const lapWorkbook = new ExcelJS.Workbook();
    await lapWorkbook.xlsx.readFile(lapFile);
    console.log('Daftar Sheet Laporan 2024:', lapWorkbook.worksheets.map(w => w.name));
    
    // Find sheet with "laba" or "rugi" in the name
    const lrSheet = lapWorkbook.worksheets.find(w => w.name.toLowerCase().includes('laba') || w.name.toLowerCase().includes('rugi')) || lapWorkbook.worksheets[0];
    console.log(`\n📄 Sheet Laba Rugi terpilih: "${lrSheet.name}"`);
    
    // Print first 80 rows of Laba Rugi
    for (let r = 1; r <= 80; r++) {
      const row = lrSheet.getRow(r);
      const rowValues = [];
      let hasValue = false;
      for (let c = 1; c <= 10; c++) {
        const cell = row.getCell(c);
        let val = cell.value;
        if (val && typeof val === 'object' && val.formula) {
          val = `FORMULA: =${val.formula} (Result: ${val.result})`;
        }
        rowValues.push(val);
        if (val !== null && val !== undefined) hasValue = true;
      }
      if (hasValue) {
        console.log(`Row ${r}:`, rowValues.map((v, i) => v !== null ? `Col${i+1}: ${v}` : null).filter(Boolean).join(' | '));
      }
    }
    
    console.log('\n🔍 Menganalisis SHU 2024...');
    const shuWorkbook = new ExcelJS.Workbook();
    await shuWorkbook.xlsx.readFile(shuFile);
    console.log('Daftar Sheet SHU 2024:', shuWorkbook.worksheets.map(w => w.name));
    
    const targetShuSheet = shuWorkbook.worksheets[0];
    console.log(`\n📄 Sheet SHU terpilih: "${targetShuSheet.name}"`);
    
    // Print first 80 rows of SHU Sheet to locate member distribution formula
    for (let r = 1; r <= 80; r++) {
      const row = targetShuSheet.getRow(r);
      const rowValues = [];
      let hasValue = false;
      for (let c = 1; c <= 10; c++) {
        const cell = row.getCell(c);
        let val = cell.value;
        if (val && typeof val === 'object' && val.formula) {
          val = `FORMULA: =${val.formula} (Result: ${val.result})`;
        }
        rowValues.push(val);
        if (val !== null && val !== undefined) hasValue = true;
      }
      if (hasValue) {
        console.log(`Row ${r}:`, rowValues.map((v, i) => v !== null ? `Col${i+1}: ${v}` : null).filter(Boolean).join(' | '));
      }
    }
    
  } catch (err) {
    console.error('Terjadi kesalahan:', err);
  } finally {
    process.exit();
  }
}

analyze();
