const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { 
  sequelize, 
  User, 
  Anggota, 
  Simpanan, 
  KategoriKas
} = require('../models');

// Helper to clean spaced-out names (like "T u r i m i n" or "W i w i e k")
function cleanName(rawName) {
  let name = rawName.trim();
  const parts = name.split(/\s+/);
  // If many parts are single letters, it's likely a spaced-out name
  if (parts.length > 2 && parts.every(part => part.length <= 2)) {
    name = name.replace(/\s+/g, '');
  } else {
    // Standard spacing cleanup
    name = name.replace(/\s+/g, ' ');
  }
  return name;
}

// Lists of random values to ensure variety
const divisions = ['Marketing', 'Purchasing', 'HRD', 'Admin', 'Keuangan'];
const jobPositions = ['Staff', 'Assistant_Manager', 'Manager'];
const cities = ['Padang', 'Jakarta', 'Bukittinggi', 'Solo', 'Malang', 'Batam', 'Medan', 'Bandung', 'Surabaya', 'Yogyakarta'];
const bankNames = ['BCA', 'Mandiri', 'BNI', 'BRI'];
const streets = ['Jl. Universitas Andalas', 'Jl. Jenderal Sudirman', 'Jl. H.R. Rasuna Said', 'Jl. MH Thamrin', 'Jl. Ahmad Yani', 'Jl. Gatot Subroto'];

async function importMembers() {
  const transaction = await sequelize.transaction();
  try {
    console.log('🔄 Membaca dan memparsing data.md...');
    const dataPath = path.join(__dirname, '../data.md');
    const content = fs.readFileSync(dataPath, 'utf8');
    const lines = content.split('\n');
    
    const rawMembers = [];
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      
      // Skip headers and totals
      if (line.startsWith('NAMA') || 
          line.startsWith('ANGGOTA') || 
          line.toLowerCase().includes('total simpanan') || 
          line.toLowerCase().includes('jumlah anggota') || 
          line.toLowerCase().includes('laki-laki') || 
          line.toLowerCase().includes('perempuan')) {
        continue;
      }
      
      const match = line.match(/^(.+?)\s+([\d.,]+)$/);
      if (match) {
        const name = cleanName(match[1]);
        const amount = parseFloat(match[2].replace(/\./g, '').replace(',', '.'));
        rawMembers.push({ name, totalSavings: amount });
      }
    }

    console.log(`Parsed ${rawMembers.length} members from file.`);

    // 1. CLEAR EXISTING MEMBER DATA
    console.log('🗑️  Menghapus data anggota lama...');
    // Delete all Simpanan
    await Simpanan.destroy({ where: {}, transaction });
    // Delete all Anggota
    await Anggota.destroy({ where: {}, transaction });
    // Delete all Users with role 'Anggota'
    await User.destroy({ where: { role: 'Anggota' }, transaction });

    console.log('🔑 Menyiapkan password default...');
    const hashedPassword = await bcrypt.hash('Koperasi@2026', 10);

    // 2. CREATE NEW USERS, ANGGOTA, AND SIMPANAN
    console.log('👥 Mengimpor anggota baru...');
    
    let totalPokokSum = 0;
    let totalWajibSum = 0;
    let totalSukarelaSum = 0;

    for (let i = 0; i < rawMembers.length; i++) {
      const rm = rawMembers[i];
      
      // Create user
      const emailPrefix = rm.name.toLowerCase().replace(/[^a-z0-9]/g, '.');
      const email = `${emailPrefix}.${i + 1}@koperasi-nichias.co.id`;

      const user = await User.create({
        email,
        password: hashedPassword,
        role: 'Anggota',
        created_at: new Date()
      }, { transaction });

      // Generate random profile data
      const noAnggota = `KOP-2026-${String(i + 1).padStart(3, '0')}`;
      const noIdentitas = `137101${String(Math.floor(1000000000 + Math.random() * 9000000000))}`;
      const tempatLahir = cities[i % cities.length];
      
      // Random birthday between 1975 and 2002
      const birthYear = 1975 + (i % 28);
      const birthMonth = String(1 + (i % 12)).padStart(2, '0');
      const birthDay = String(1 + (i % 28)).padStart(2, '0');
      const tanggalLahir = `${birthYear}-${birthMonth}-${birthDay}`;

      // Diverse jabatan and divisi
      // Distribute: 80% Staff, 15% Assistant_Manager, 5% Manager
      let jabatan = 'Staff';
      if (i % 20 === 0) {
        jabatan = 'Manager';
      } else if (i % 6 === 0) {
        jabatan = 'Assistant_Manager';
      }
      const divisi = divisions[i % divisions.length];

      const noHp = `0812${String(Math.floor(10000000 + Math.random() * 90000000))}`;
      const noRekeningBank = `${bankNames[i % bankNames.length]} - ${String(Math.floor(100000000 + Math.random() * 900000000))}`;
      const alamat = `${streets[i % streets.length]} No. ${1 + (i % 50)}, ${tempatLahir}`;

      const anggota = await Anggota.create({
        user_id: user.user_id,
        no_anggota: noAnggota,
        no_identitas: noIdentitas,
        nama_lengkap: rm.name,
        tempat_lahir: tempatLahir,
        tanggal_lahir: tanggalLahir,
        jabatan,
        divisi,
        no_hp: noHp,
        no_rekening_bank: noRekeningBank,
        alamat,
        tanggal_registrasi: new Date(),
        tanggal_bergabung: '2026-01-10',
        status_keanggotaan: 'Aktif'
      }, { transaction });

      // Split savings
      // Simpanan Pokok: 100,000
      const saldoPokok = 100000;
      const remainder = rm.totalSavings - saldoPokok;
      
      let saldoWajib = 0;
      let saldoSukarela = 0;

      if (remainder > 0) {
        // Varying splits: use a cycle of percentages 20% to 80%
        const percentWajib = 0.2 + (i % 7) * 0.1;
        let calculatedWajib = Math.floor(remainder * percentWajib);
        // Round to nearest 10k
        calculatedWajib = Math.round(calculatedWajib / 10000) * 10000;
        
        if (calculatedWajib < 0) calculatedWajib = 0;
        if (calculatedWajib > remainder) calculatedWajib = remainder;
        
        saldoWajib = calculatedWajib;
        saldoSukarela = remainder - calculatedWajib;
      }

      totalPokokSum += saldoPokok;
      totalWajibSum += saldoWajib;
      totalSukarelaSum += saldoSukarela;

      await Simpanan.create({
        anggota_id: anggota.anggota_id,
        saldo_pokok: saldoPokok,
        saldo_wajib: saldoWajib,
        saldo_sukarela: saldoSukarela,
        last_updated: new Date()
      }, { transaction });
    }

    const grandTotalSavings = totalPokokSum + totalWajibSum + totalSukarelaSum;
    console.log(`\nImport Summary:`);
    console.log(`- Total Pokok   : ${totalPokokSum.toLocaleString('id-ID')}`);
    console.log(`- Total Wajib   : ${totalWajibSum.toLocaleString('id-ID')}`);
    console.log(`- Total Sukarela: ${totalSukarelaSum.toLocaleString('id-ID')}`);
    console.log(`- Grand Total   : ${grandTotalSavings.toLocaleString('id-ID')}`);

    // 3. UPDATE KATEGORI KAS STARTING BALANCES FOR LEDGER BALANCE
    console.log('\n💼 Menyelaraskan saldo_awal di KategoriKas...');
    
    // Simpanan Pokok (Liability = negative value)
    await KategoriKas.update(
      { saldo_awal: -totalPokokSum },
      { where: { nama_kategori: 'Simpanan Pokok' }, transaction }
    );
    // Simpanan Wajib (Liability = negative value)
    await KategoriKas.update(
      { saldo_awal: -totalWajibSum },
      { where: { nama_kategori: 'Simpanan Wajib' }, transaction }
    );
    // Simpanan Sukarela (Liability = negative value)
    await KategoriKas.update(
      { saldo_awal: -totalSukarelaSum },
      { where: { nama_kategori: 'Simpanan Sukarela' }, transaction }
    );
    // Set BANK starting balance to equal all savings (Asset = positive value)
    await KategoriKas.update(
      { saldo_awal: grandTotalSavings },
      { where: { nama_kategori: 'BANK' }, transaction }
    );
    // Set CASH starting balance to 0 (Asset = positive value)
    await KategoriKas.update(
      { saldo_awal: 0 },
      { where: { nama_kategori: 'CASH' }, transaction }
    );

    await transaction.commit();
    console.log('✅ Anggota baru berhasil diimpor dan disinkronkan!');
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Gagal mengimpor data:', error);
  } finally {
    process.exit();
  }
}

importMembers();
