/**
 * BACKEND SATUDATA - Dinas Tenaga Kerja
 */

const SHEET_NAMES = ['Program', 'Kegiatan', 'SubKegiatan', 'Rekening', 'RincianBelanja', 'StandarHarga', 'PegawaiASN', 'WPPribadi', 'WPPihakKetiga', 'KOP21', 'KOPUNI', 'RealisasiGU', 'DataSPJ', 'PrintedNotes', 'Tagging', 'Settings'];
const FOLDER_ID = '1majeQxu3-VGaTaV2afxXS-Dp4-4DV0yq';
const JWT_SECRET = 'SatudataDisnakerSecret2026!@#'; // Jangan ubah setelah dipakai

// ==========================================
// FUNGSI SETUP (JALANKAN SEKALI SAJA DI EDITOR GAS)
// ==========================================
function setupAdminUser() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Users');
    sheet.appendRow(['username', 'password_hash', 'role', 'nama_lengkap']);
  }
  var hash = hashPassword("admin123");
  sheet.appendRow(['admin', hash, 'super_admin', 'Administrator Utama']);
  Logger.log("User admin berhasil dibuat. Password: admin123");
}

// FUNGSI UNTUK MENAMBAH USER BARU (Jalankan dari Editor GAS)
function addNewUser() {
  // GANTI DATA DI BAWAH INI SESUAI KEINGINAN
  var username = "operator1";
  var password = "password123";
  var role     = "operator"; // pilihan: super_admin, admin, operator, kepala_bidang
  var nama     = "Operator Lapangan";
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  var hash = hashPassword(password);
  sheet.appendRow([username, hash, role, nama]);
  Logger.log("User " + username + " berhasil ditambahkan!");
}

// ==========================================
// UTILS AUTENTIKASI (JWT & HASH)
// ==========================================
function hashPassword(password) {
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  var txtHash = '';
  for (var i = 0; i < rawHash.length; i++) {
    var hashVal = rawHash[i];
    if (hashVal < 0) hashVal += 256;
    if (hashVal.toString(16).length == 1) txtHash += '0';
    txtHash += hashVal.toString(16);
  }
  return txtHash;
}

function generateJWT(user) {
  var header = Utilities.base64EncodeWebSafe(JSON.stringify({alg: "HS256", typ: "JWT"}));
  var payload = Utilities.base64EncodeWebSafe(JSON.stringify({
    username: user.username,
    role: user.role,
    nama_lengkap: user.nama_lengkap,
    exp: Date.now() + (1000 * 60 * 60 * 24)
  }));
  var signature = Utilities.computeHmacSha256Signature(header + "." + payload, JWT_SECRET);
  return header + "." + payload + "." + Utilities.base64EncodeWebSafe(signature);
}

function verifyJWT(token) {
  if (!token) return false;
  try {
    var parts = token.split('.');
    if (parts.length !== 3) return false;
    var signature = Utilities.computeHmacSha256Signature(parts[0] + "." + parts[1], JWT_SECRET);
    if (Utilities.base64EncodeWebSafe(signature) === parts[2]) {
      var payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[1])).getDataAsString());
      if (payload.exp > Date.now()) return payload;
    }
  } catch(e) {}
  return false;
}

// ==========================================
// UTILS AUDIT LOG
// ==========================================
function recordAuditLog(username, role, action, module, details) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('AuditLog');
    if (!sheet) {
      sheet = ss.insertSheet('AuditLog');
      sheet.appendRow(['timestamp', 'username', 'role', 'action', 'module', 'details']);
      // Bekukan baris pertama
      sheet.setFrozenRows(1);
      sheet.getRange("A1:F1").setFontWeight("bold").setBackground("#f3f3f3");
    }
    
    var logDetails = (typeof details === 'object') ? JSON.stringify(details) : String(details);
    sheet.appendRow([new Date(), username, role, action, module, logDetails]);
  } catch(e) {
    Logger.log("Gagal merekam audit log: " + e.message);
  }
}

function doGet(e) {
  return createJsonResponse({ status: 'error', message: 'Endpoint doGet kini dibatasi. Gunakan POST untuk akses data.' });
}

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;

    // 1. ACTION LOGIN (Public)
    if (action === 'login') {
      var username = requestData.payload.username;
      var password = requestData.payload.password;
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
      if (!sheet) return createJsonResponse({ status: 'error', message: 'Tabel Users tidak ditemukan' });
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var userIdx = headers.indexOf('username');
      var passIdx = headers.indexOf('password_hash');
      var inputHash = hashPassword(password);
      for (var i = 1; i < data.length; i++) {
        if (data[i][userIdx] === username && data[i][passIdx] === inputHash) {
          var userObj = { username: data[i][userIdx], role: data[i][headers.indexOf('role')], nama_lengkap: data[i][headers.indexOf('nama_lengkap')] };
          recordAuditLog(username, userObj.role, 'LOGIN', 'Auth', 'User berhasil login');
          return createJsonResponse({ status: 'success', data: { token: generateJWT(userObj), user: userObj } });
        }
      }
      recordAuditLog(username, 'unknown', 'LOGIN_FAILED', 'Auth', 'Percobaan login gagal (password salah)');
      return createJsonResponse({ status: 'error', message: 'Username atau password salah.' });
    }

    // 2. VERIFIKASI TOKEN JWT UNTUK SEMUA ACTION LAINNYA
    const user = verifyJWT(requestData.token);
    if (!user) {
      return createJsonResponse({ status: 'error', message: 'Unauthorized: Sesi berakhir, silakan login kembali.' });
    }

    // 3. ACTION MANAGEMENT USER & AUDIT LOG (Hanya Super Admin)
    if (action === 'getUsers' || action === 'addUser' || action === 'deleteUser' || action === 'getAuditLogs' || action === 'updateSettings' || action === 'initialize_new_phase') {
      if (user.role !== 'super_admin') return createJsonResponse({ status: 'error', message: 'Akses Ditolak: Hanya Super Admin yang boleh mengakses modul ini.' });
      
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      
      if (action === 'getAuditLogs') {
        var logSheet = ss.getSheetByName('AuditLog');
        if (!logSheet) return createJsonResponse({ status: 'success', data: [] });
        var logData = logSheet.getDataRange().getValues();
        var logs = [];
        for (var i = 1; i < logData.length; i++) {
          logs.push({
            timestamp: logData[i][0],
            username: logData[i][1],
            role: logData[i][2],
            action: logData[i][3],
            module: logData[i][4],
            details: logData[i][5]
          });
        }
        return createJsonResponse({ status: 'success', data: logs.reverse() }); // Terbaru di atas
      }

      var sheet = ss.getSheetByName('Users');
      
      if (action === 'getUsers') {
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var users = [];
        for (var i = 1; i < data.length; i++) {
          users.push({
            username: data[i][headers.indexOf('username')],
            role: data[i][headers.indexOf('role')],
            nama_lengkap: data[i][headers.indexOf('nama_lengkap')]
          });
        }
        return createJsonResponse({ status: 'success', data: users });
      }

      if (action === 'addUser') {
        var p = requestData.payload;
        var hash = hashPassword(p.password);
        sheet.appendRow([p.username, hash, p.role, p.nama_lengkap]);
        recordAuditLog(user.username, user.role, 'ADD_USER', 'User Management', 'Menambahkan user: ' + p.username);
        return createJsonResponse({ status: 'success', message: 'User berhasil ditambahkan' });
      }

      if (action === 'deleteUser') {
        var usernameToDelete = requestData.payload.username;
        if (usernameToDelete === 'admin') return createJsonResponse({ status: 'error', message: 'User admin utama tidak boleh dihapus' });
        var data = sheet.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) {
          if (data[i][0] === usernameToDelete) {
            sheet.deleteRow(i + 1);
            recordAuditLog(user.username, user.role, 'DELETE_USER', 'User Management', 'Menghapus user: ' + usernameToDelete);
            return createJsonResponse({ status: 'success', message: 'User berhasil dihapus' });
          }
        }
        return createJsonResponse({ status: 'error', message: 'User tidak ditemukan' });
      }

      if (action === 'updateSettings') {
        const payload = requestData.payload;
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        let sheet = ss.getSheetByName('Settings');
        if (!sheet) {
          sheet = ss.insertSheet('Settings');
          sheet.appendRow(['key', 'value', 'timestamp']);
        }
        
        const data = sheet.getDataRange().getValues();
        const keys = Object.keys(payload);
        
        keys.forEach(key => {
          let found = false;
          for (let i = 1; i < data.length; i++) {
            if (data[i][0] === key) {
              sheet.getRange(i + 1, 2).setValue(payload[key]);
              sheet.getRange(i + 1, 3).setValue(new Date());
              found = true;
              break;
            }
          }
          if (!found) {
            sheet.appendRow([key, payload[key], new Date()]);
          }
        });
        
        recordAuditLog(user.username, user.role, 'UPDATE_SETTINGS', 'System', 'Update konfigurasi sistem: ' + keys.join(', '));
        return createJsonResponse({ status: 'success', message: 'Konfigurasi berhasil disimpan!' });
      }

      // === ACTION: INITIALIZE NEW PHASE (Bulk Copy) ===
      if (action === 'initialize_new_phase') {
        const payload = requestData.payload;
        const sheet = ss.getSheetByName('Rekening');
        if (!sheet || sheet.getLastRow() <= 1) return createJsonResponse({ status: 'error', message: 'Sheet Rekening tidak ditemukan atau kosong.' });
        
        const data = sheet.getDataRange().getValues();
        // NORMALIZE HEADERS TO LOWERCASE for robust matching
        const headers = data[0].map(h => h.toString().toLowerCase().trim());
        const sourceTahap = payload.sourcePhase;
        const targetTahap = payload.targetPhase;
        const tahun = String(payload.year);
        
        const colIdx = {
          tahap: headers.indexOf('tahap_anggaran'),
          tahun: headers.indexOf('tahun_anggaran'),
          ts: headers.indexOf('timestamp')
        };
        
        if (colIdx.ts === -1) return createJsonResponse({ status: 'error', message: 'Kolom timestamp tidak ditemukan di sheet Rekening.' });

        const newRows = [];
        const baseTs = new Date().toISOString(); 
        
        for (let i = 1; i < data.length; i++) {
          if (String(data[i][colIdx.tahun]) === tahun && String(data[i][colIdx.tahap]) === sourceTahap) {
            const newRow = [...data[i]];
            newRow[colIdx.tahap] = targetTahap;
            // Generate a truly unique string ID to avoid any Sheets date formatting issues
            newRow[colIdx.ts] = baseTs + "_" + i; 
            
            // Ensure codes stay as strings with ' prefix
            const textCols = ['kode_subkegiatan', 'kode_rekening', 'kode_barang'];
            textCols.forEach(colName => {
              const idx = headers.indexOf(colName);
              if (idx !== -1) newRow[idx] = "'" + String(newRow[idx]).replace(/^'/, '');
            });
            
            newRows.push(newRow);
          }
        }
        
        if (newRows.length === 0) {
          return createJsonResponse({ status: 'error', message: `Tidak ada data found untuk Tahap ${sourceTahap} di Tahun ${tahun}` });
        }
        
        // Batch append
        const startRow = sheet.getLastRow() + 1;
        sheet.getRange(startRow, 1, newRows.length, headers.length).setValues(newRows);
        
        recordAuditLog(user.username, user.role, 'INITIALIZE_PHASE', 'Rekening', `Inisiasi Tahap ${targetTahap} dari ${sourceTahap} (${newRows.length} item)`);
        return createJsonResponse({ status: 'success', message: `Berhasil menginisiasi ${newRows.length} data ke Tahap ${targetTahap}!` });
      }
    }

    // 4. ACTION GET ALL DATA
    if (action === 'getAllData') {
      const data = {};
      SHEET_NAMES.forEach(sheetName => {
        data[sheetName.toLowerCase()] = getSheetData(sheetName);
      });
      // Sertakan statistik storage dasar
      data.storage_stats = getSpreadsheetStats();
      
      // Khusus settings, ubah jadi object key-value
      const rawSettings = data.settings || [];
      const settingsObj = {};
      rawSettings.forEach(s => {
        if (s.key) settingsObj[s.key] = s.value;
      });
      data.settings = settingsObj;
      
      return createJsonResponse({ status: 'success', data: data });
    }

    const sheetName = requestData.sheet;
    const payload = requestData.payload;
    
    if (action === 'insert' && SHEET_NAMES.includes(sheetName)) {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) sheet = ss.insertSheet(sheetName);
      
      // Sinkronisasi Header otomatis jika belum lengkap
      if (sheet.getLastRow() > 0) {
        const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        if (sheetName === 'RealisasiGU' && (currentHeaders.indexOf('status_spj') === -1 || currentHeaders.indexOf('timestamp') < 19)) {
          setHeaders(sheet, sheetName);
        }
      } else {
        setHeaders(sheet, sheetName);
      }
      
      let rowData = [];
      if (sheetName === 'Program') {
        rowData = ["'" + payload.kode_program, payload.nama_program, new Date()];
      } else if (sheetName === 'Kegiatan') {
        rowData = ["'" + payload.kode_program, "'" + payload.kode_kegiatan, payload.nama_kegiatan, new Date()];
      } else if (sheetName === 'SubKegiatan') {
        rowData = ["'" + payload.kode_kegiatan, "'" + payload.kode_subkegiatan, payload.nama_subkegiatan, new Date()];
      } else if (sheetName === 'Rekening') {
        rowData = [
          "'" + payload.kode_subkegiatan, 
          "'" + payload.kode_rekening, 
          payload.nama_rekening, 
          payload.pagu, 
          payload.tahun_anggaran, 
          payload.tahap_anggaran, 
          payload.paket_belanja || '',
          payload.keterangan_belanja || '',
          "'" + (payload.kode_barang || ''), 
          payload.uraian_barang || '', 
          payload.spesifikasi || '', 
          payload.satuan || '', 
          payload.harga_satuan || 0,
          payload.koefisien_uraian || '', 
          payload.volume || 0, 
          new Date()
        ];
      } else if (sheetName === 'PegawaiASN') {
        rowData = ["'" + payload.nip, "'" + payload.nik, "'" + payload.nitku, "'" + payload.npwp, payload.nama, payload.golongan, payload.peran_jabatan, payload.kategori_pegawai, new Date()];
      } else if (sheetName === 'WPPribadi') {
        rowData = ["'" + payload.nik, "'" + payload.nitku, "'" + payload.npwp, payload.nama, new Date()];
      } else if (sheetName === 'WPPihakKetiga') {
        rowData = ["'" + payload.nik, "'" + payload.nitku, "'" + payload.npwp, payload.nama_pemilik, payload.nama_usaha, new Date()];
      } else if (sheetName === 'KOP21') {
        rowData = ["'" + payload.kode_objek_pajak, payload.nama_objek_pajak, new Date()];
      } else if (sheetName === 'KOPUNI') {
        rowData = ["'" + payload.kode_objek_pajak, payload.nama_objek_pajak, payload.tarif, new Date()];
      } else if (sheetName === 'RealisasiGU') {
        var tsNow = new Date().getTime();
        var randSuffix = Math.random().toString().slice(2, 6);
        var idNota = 'NT-' + tsNow + randSuffix;
        var tsUnique = String(tsNow) + randSuffix; // String murni agar konsisten
        rowData = [
          payload.tahun_anggaran, payload.tahap_anggaran, payload.bulan_spj, payload.proses_gu,
          "'" + payload.kode_subkegiatan, "'" + payload.kode_rekening,
          String(payload.rekening_id || ''),
          payload.tanggal_nota, "'" + payload.nik_vendor, payload.nama_vendor, payload.nominal_nota,
          payload.ppn, payload.pph21, payload.pph22, payload.pph23, 
          payload.keterangan_nota,
          "'" + (payload.kop_pajak || ''), "'" + (payload.kap_pajak || ''), "'" + (payload.kjs_pajak || ''), "'" + (payload.nop_pajak || ''),
          idNota, 'Draft', '', '', '', 'Draft', '', // id_nota, status_spj, kode_billing, no_ntpn, no_ntb, status_nota, id_spj
          tsUnique // timestamp unik (string)
        ];
      } else if (sheetName === 'Tagging') {
        rowData = [payload.kategori, payload.nama_tag, new Date()];
      }
      
      // Untuk RealisasiGU, return lebih awal dengan id_nota & timestamp yang digenerate backend
      if (sheetName === 'RealisasiGU') {
        sheet.appendRow(rowData);
        recordAuditLog(user.username, user.role, 'INSERT', sheetName, 'Input SPJ Baru: ' + idNota);
        return createJsonResponse({ status: 'success', message: 'Data berhasil disimpan!', id_nota: idNota, timestamp: String(tsUnique) });
      }
      
      sheet.appendRow(rowData);
      recordAuditLog(user.username, user.role, 'INSERT', sheetName, 'Menambahkan data baru');
      return createJsonResponse({ status: 'success', message: 'Data berhasil disimpan!' });
    }

    // ===============================================
    // BATCH INSERT REALISASI (Input Masal PPh21)
    // ===============================================
    if (action === 'batch_insert_realisasi') {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName('RealisasiGU');
      if (!sheet) sheet = ss.insertSheet('RealisasiGU');
      if (sheet.getLastRow() === 0) setHeaders(sheet, 'RealisasiGU');
      
      const items = payload.items || [];
      const results = [];
      
      for (var idx = 0; idx < items.length; idx++) {
        var item = items[idx];
        var tsNow = new Date().getTime();
        var randSuffix = String(idx) + Math.random().toString().slice(2, 6);
        var batchIdNota = 'NT-' + tsNow + randSuffix;
        var batchTsUnique = String(tsNow) + randSuffix;
        
        var batchRowData = [
          item.tahun_anggaran, item.tahap_anggaran, item.bulan_spj, item.proses_gu,
          "'" + item.kode_subkegiatan, "'" + item.kode_rekening,
          String(item.rekening_id || ''),
          item.tanggal_nota, "'" + item.nik_vendor, item.nama_vendor, item.nominal_nota,
          item.ppn || 0, item.pph21 || 0, item.pph22 || 0, item.pph23 || 0,
          item.keterangan_nota,
          "'" + (item.kop_pajak || ''), "'" + (item.kap_pajak || ''), "'" + (item.kjs_pajak || ''), "'" + (item.nop_pajak || ''),
          batchIdNota, 'Draft', '', '', '', 'Draft', '',
          batchTsUnique
        ];
        sheet.appendRow(batchRowData);
        results.push({ id_nota: batchIdNota, timestamp: String(batchTsUnique) });
        Utilities.sleep(50);
      }
      
      recordAuditLog(user.username, user.role, 'BATCH_INSERT', 'RealisasiGU', 'Input masal ' + items.length + ' PPh21');
      return createJsonResponse({ status: 'success', message: items.length + ' nota berhasil disimpan!', results: results });
    }

    // ===============================================
    // GENERIC BATCH INSERT (Untuk Import Masal Sheet Apa Saja)
    // ===============================================
    if (action === 'batch_insert') {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) sheet = ss.insertSheet(sheetName);
      if (sheet.getLastRow() === 0) setHeaders(sheet, sheetName);
      
      const items = payload.items || [];
      const tsValue = new Date();
      
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      items.forEach(item => {
        const rowData = [];
        headers.forEach(h => {
          if (h === 'timestamp') rowData.push(tsValue);
          else if (item[h] !== undefined) {
            const textFields = ['kode_barang', 'id_standar_harga', 'kode_rekening_list', 'kode_kelompok_barang'];
            if (textFields.includes(h)) rowData.push("'" + item[h]);
            else rowData.push(item[h]);
          } else {
            rowData.push('');
          }
        });
        sheet.appendRow(rowData);
      });
      
      recordAuditLog(user.username, user.role, 'BATCH_INSERT', sheetName, 'Import masal ' + items.length + ' data');
      return createJsonResponse({ status: 'success', message: items.length + ' data berhasil diimport!' });
    }

    // ===============================================
    // IMPORT KERTAS KERJA ANGGARAN (Excel .xlsx)
    // ===============================================
    if (action === 'import_kertas_kerja') {
      if (user.role !== 'super_admin') return createJsonResponse({ status: 'error', message: 'Akses Ditolak: Hanya Super Admin yang boleh melakukan import anggaran.' });
      
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName('Rekening');
      if (!sheet) {
        sheet = ss.insertSheet('Rekening');
        setHeaders(sheet, 'Rekening');
      }
      
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const items = (payload && payload.items) ? payload.items : (requestData.items || []);
      
      const colIdx = {
        sub: headers.indexOf('kode_subkegiatan'),
        rek: headers.indexOf('kode_rekening'),
        nama: headers.indexOf('nama_rekening'),
        pagu: headers.indexOf('pagu'),
        tahun: headers.indexOf('tahun_anggaran'),
        tahap: headers.indexOf('tahap_anggaran'),
        paket: headers.indexOf('paket_belanja'),
        ket: headers.indexOf('keterangan_belanja'),
        brg: headers.indexOf('kode_barang'),
        uraian: headers.indexOf('uraian_barang'),
        spek: headers.indexOf('spesifikasi'),
        satuan: headers.indexOf('satuan'),
        harga: headers.indexOf('harga_satuan'),
        koef: headers.indexOf('koefisien_uraian'),
        vol: headers.indexOf('volume'),
        ts: headers.indexOf('timestamp')
      };
      
      let processed = 0;
      items.forEach(item => {
        let foundRow = -1;
        // Cari baris yang cocok (SubKegiatan, Rekening, Tahun, Tahap)
        for (let i = 1; i < data.length; i++) {
          if (String(data[i][colIdx.sub]) === String(item.kode_subkegiatan) &&
              String(data[i][colIdx.rek]) === String(item.kode_rekening) &&
              String(data[i][colIdx.tahun]) === String(item.tahun_anggaran) &&
              String(data[i][colIdx.tahap]) === String(item.tahap_anggaran)) {
            foundRow = i + 1;
            break;
          }
        }
        
        const tsValue = new Date();
        if (foundRow !== -1) {
          // UPDATE
          if (colIdx.nama !== -1 && item.nama_rekening !== undefined) sheet.getRange(foundRow, colIdx.nama + 1).setValue(item.nama_rekening);
          if (colIdx.pagu !== -1 && item.pagu !== undefined) sheet.getRange(foundRow, colIdx.pagu + 1).setValue(item.pagu);
          if (colIdx.paket !== -1 && item.paket_belanja !== undefined) sheet.getRange(foundRow, colIdx.paket + 1).setValue(item.paket_belanja);
          if (colIdx.ket !== -1 && item.keterangan_belanja !== undefined) sheet.getRange(foundRow, colIdx.ket + 1).setValue(item.keterangan_belanja);
          if (colIdx.brg !== -1 && item.kode_barang !== undefined) sheet.getRange(foundRow, colIdx.brg + 1).setValue("'" + item.kode_barang);
          if (colIdx.uraian !== -1 && item.uraian_barang !== undefined) sheet.getRange(foundRow, colIdx.uraian + 1).setValue(item.uraian_barang);
          if (colIdx.spek !== -1 && item.spesifikasi !== undefined) sheet.getRange(foundRow, colIdx.spek + 1).setValue(item.spesifikasi);
          if (colIdx.satuan !== -1 && item.satuan !== undefined) sheet.getRange(foundRow, colIdx.satuan + 1).setValue(item.satuan);
          if (colIdx.harga !== -1 && item.harga_satuan !== undefined) sheet.getRange(foundRow, colIdx.harga + 1).setValue(Number(item.harga_satuan));
          if (colIdx.koef !== -1 && item.koefisien_uraian !== undefined) sheet.getRange(foundRow, colIdx.koef + 1).setValue(item.koefisien_uraian);
          if (colIdx.vol !== -1 && item.volume !== undefined) sheet.getRange(foundRow, colIdx.vol + 1).setValue(Number(item.volume));
          if (colIdx.ts !== -1) sheet.getRange(foundRow, colIdx.ts + 1).setValue(tsValue);
        } else {
          // INSERT
          const rowData = [];
          headers.forEach(h => {
            if (h === 'kode_subkegiatan') rowData.push("'" + (item.kode_subkegiatan || ''));
            else if (h === 'kode_rekening') rowData.push("'" + (item.kode_rekening || ''));
            else if (h === 'nama_rekening') rowData.push(item.nama_rekening || '');
            else if (h === 'pagu') rowData.push(Number(item.pagu || 0));
            else if (h === 'tahun_anggaran') rowData.push(String(item.tahun_anggaran || ''));
            else if (h === 'tahap_anggaran') rowData.push(item.tahap_anggaran || '');
            else if (h === 'paket_belanja') rowData.push(item.paket_belanja || '');
            else if (h === 'keterangan_belanja') rowData.push(item.keterangan_belanja || '');
            else if (h === 'kode_barang') rowData.push("'" + (item.kode_barang || ''));
            else if (h === 'uraian_barang') rowData.push(item.uraian_barang || '');
            else if (h === 'spesifikasi') rowData.push(item.spesifikasi || '');
            else if (h === 'satuan') rowData.push(item.satuan || '');
            else if (h === 'harga_satuan') rowData.push(Number(item.harga_satuan || 0));
            else if (h === 'koefisien_uraian') rowData.push(item.koefisien_uraian || '');
            else if (h === 'volume') rowData.push(Number(item.volume || 0));
            else if (h === 'timestamp') rowData.push(tsValue);
            else rowData.push('');
          });
          sheet.appendRow(rowData);
        }
        processed++;
      });
      
      recordAuditLog(user.username, user.role, 'IMPORT', 'Rekening', 'Import/Update ' + processed + ' Kertas Kerja');
      return createJsonResponse({ status: 'success', message: `${processed} data anggaran berhasil diproses!`, count: processed });
    }

    // ===============================================
    // PERBAIKAN 1: FUNGSI BUAT SPJ BUNDLE
    // ===============================================
    if (action === 'buat_spj_bundle') {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheetDataSPJ = ss.getSheetByName('DataSPJ');
      if (!sheetDataSPJ) sheetDataSPJ = ss.insertSheet('DataSPJ');
      
      if (sheetDataSPJ.getLastRow() === 0) setHeaders(sheetDataSPJ, 'DataSPJ');
      
      const tsNow = new Date().getTime();
      const spjTimestamp = String(tsNow) + Math.random().toString().slice(2, 6);
      const rowDataBaru = [
        String(payload.id_spj || ''), '', String(payload.bidang || ''), payload.tanggal_bayar || '', String(payload.proses_gu || ''),
        payload.total_kotor || 0, payload.total_ppn || 0, payload.total_pph21 || 0, payload.total_pph22 || 0, payload.total_pph23 || 0,
        '', '', '', '', '', '', // billing_ppn, ntpn_ppn, ntb_ppn, billing_pph21, ntpn_pph21, ntb_pph21
        '', '', '', '', '', '', // billing_pph22, ntpn_pph22, ntb_pph22, billing_pph23, ntpn_pph23, ntb_pph23
        'Diproses', spjTimestamp
      ];
      sheetDataSPJ.appendRow(rowDataBaru);

      const sheetRG = ss.getSheetByName('RealisasiGU');
      if (sheetRG && sheetRG.getLastRow() > 1) {
        const data = sheetRG.getDataRange().getValues();
        const headers = data[0];
        const idNotaCol = headers.indexOf('id_nota');
        const statusNotaCol = headers.indexOf('status_nota');
        const statusSpjCol = headers.indexOf('status_spj');
        const idSpjCol = headers.indexOf('id_spj');
        
        if (idNotaCol !== -1) {
          const idNotaArr = (payload.notes || payload.id_nota || []).map(String);
          for (let i = 1; i < data.length; i++) {
            if (idNotaArr.includes(String(data[i][idNotaCol]))) {
              if (statusNotaCol !== -1) sheetRG.getRange(i + 1, statusNotaCol + 1).setValue('Diproses');
              if (statusSpjCol !== -1) sheetRG.getRange(i + 1, statusSpjCol + 1).setValue('Diproses');
              if (idSpjCol !== -1) sheetRG.getRange(i + 1, idSpjCol + 1).setValue(String(payload.id_spj));
            }
          }
        }
      }
      recordAuditLog(user.username, user.role, 'CREATE_BUNDLE', 'DataSPJ', 'Buat Bundle SPJ: ' + payload.id_spj);
      return createJsonResponse({ status: 'success', message: 'SPJ Bundle berhasil dibuat' });
    }

    // ===============================================
    // PERBAIKAN 2: FUNGSI UPDATE PAJAK (VERIFIKASI)
    // ===============================================
    if (action === 'update_pajak_spj') {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheetDataSPJ = ss.getSheetByName('DataSPJ');
      let nomorResmi = '';

      // 1. UPDATE DI SHEET DataSPJ
      if (sheetDataSPJ && sheetDataSPJ.getLastRow() > 1) {
        const data = sheetDataSPJ.getDataRange().getValues();
        const headers = data[0];
        const idSpjCol = headers.indexOf('id_spj');
        
        let rowIndex = -1;
        for (let i = 1; i < data.length; i++) {
          if (String(data[i][idSpjCol]) === String(payload.id_spj)) {
            rowIndex = i;
            break;
          }
        }

        if (rowIndex !== -1) {
          const strUrut = ("000" + rowIndex).slice(-3);
          
          // TULIS tanggal_bayar ke cell DataSPJ terlebih dahulu
          const tglBayarCol = headers.indexOf('tanggal_bayar');
          if (tglBayarCol !== -1 && payload.tanggal_bayar) {
            sheetDataSPJ.getRange(rowIndex + 1, tglBayarCol + 1).setValue(payload.tanggal_bayar);
          }
          
          let tglBayarVal = payload.tanggal_bayar || data[rowIndex][tglBayarCol];
          let tglBayar = new Date(tglBayarVal);
          if (isNaN(tglBayar.getTime())) tglBayar = new Date();
          
          const bulanStr = ("0" + (tglBayar.getMonth() + 1)).slice(-2);
          const tahunStr = tglBayar.getFullYear();
          const pGU = String(data[rowIndex][headers.indexOf('proses_gu')] || payload.proses_gu || '');
          const bIdang = String(data[rowIndex][headers.indexOf('bidang')] || payload.bidang || '');

          nomorResmi = `${strUrut}/${pGU}/${bIdang}/${bulanStr}-${tahunStr}`;
          
          sheetDataSPJ.getRange(rowIndex + 1, headers.indexOf('no_spj_resmi') + 1).setValue(nomorResmi);
          sheetDataSPJ.getRange(rowIndex + 1, headers.indexOf('status_spj') + 1).setValue('Valid');
          
          const fieldsToUpdate = [
            'billing_ppn', 'ntpn_ppn', 'ntb_ppn',
            'billing_pph21', 'ntpn_pph21', 'ntb_pph21',
            'billing_pph22', 'ntpn_pph22', 'ntb_pph22',
            'billing_pph23', 'ntpn_pph23', 'ntb_pph23'
          ];
          fieldsToUpdate.forEach(f => {
            if (payload[f] !== undefined) {
               // Tambah kutipan tunggal jika field adalah billing, ntpn, atau ntb agar nol didepan tidak hilang
               var val = payload[f];
               if (f.startsWith('billing_') || f.startsWith('ntpn_') || f.startsWith('ntb_')) {
                 val = "'" + val;
               }
               sheetDataSPJ.getRange(rowIndex + 1, headers.indexOf(f) + 1).setValue(val);
            }
          });
        }
      }

      // 2. UPDATE DI SHEET RealisasiGU (Ini yang sebelumnya dilupakan AI)
      const sheetRG = ss.getSheetByName('RealisasiGU');
      if (sheetRG && sheetRG.getLastRow() > 1) {
        const data = sheetRG.getDataRange().getValues();
        const headers = data[0];
        const idSpjCol = headers.indexOf('id_spj');
        
        // Gabungkan teks jika pajaknya lebih dari 1 jenis
        const strBilling = [payload.billing_ppn, payload.billing_pph21, payload.billing_pph22, payload.billing_pph23].filter(x => x).join(" | ");
        const strNtpn = [payload.ntpn_ppn, payload.ntpn_pph21, payload.ntpn_pph22, payload.ntpn_pph23].filter(x => x).join(" | ");
        const strNtb = [payload.ntb_ppn, payload.ntb_pph21, payload.ntb_pph22, payload.ntb_pph23].filter(x => x).join(" | ");

        if (idSpjCol !== -1) {
          for (let i = 1; i < data.length; i++) {
            if (String(data[i][idSpjCol]) === String(payload.id_spj)) {
              const sNotaCol = headers.indexOf('status_nota');
              const sSpjCol = headers.indexOf('status_spj');
              const bCol = headers.indexOf('kode_billing');
              const ntpnCol = headers.indexOf('no_ntpn');
              const ntbCol = headers.indexOf('no_ntb');

              if (sNotaCol !== -1) sheetRG.getRange(i + 1, sNotaCol + 1).setValue('Valid');
              if (sSpjCol !== -1) sheetRG.getRange(i + 1, sSpjCol + 1).setValue('Valid');
              if (bCol !== -1) sheetRG.getRange(i + 1, bCol + 1).setValue("'" + strBilling);
              if (ntpnCol !== -1) sheetRG.getRange(i + 1, ntpnCol + 1).setValue("'" + strNtpn);
              if (ntbCol !== -1) sheetRG.getRange(i + 1, ntbCol + 1).setValue("'" + strNtb);
            }
          }
        }
      }
      recordAuditLog(user.username, user.role, 'VERIFY_SPJ', 'DataSPJ', 'Input Pajak & Validasi SPJ: ' + nomorResmi);
      return createJsonResponse({ status: 'success', message: 'Pajak SPJ berhasil diupdate', no_spj_resmi: nomorResmi });
    }

    if (action === 'tolak_spj') {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheetDataSPJ = ss.getSheetByName('DataSPJ');
      if (sheetDataSPJ && sheetDataSPJ.getLastRow() > 1) {
        const data = sheetDataSPJ.getDataRange().getValues();
        const headers = data[0];
        const idSpjCol = headers.indexOf('id_spj');
        const statusSpjCol = headers.indexOf('status_spj');
        
        if (idSpjCol !== -1 && statusSpjCol !== -1) {
          for (let i = 1; i < data.length; i++) {
            if (String(data[i][idSpjCol]) === String(payload.id_spj)) {
              sheetDataSPJ.getRange(i + 1, statusSpjCol + 1).setValue('Ditolak');
            }
          }
        }
      }

      const sheetRG = ss.getSheetByName('RealisasiGU');
      if (sheetRG && sheetRG.getLastRow() > 1) {
        const data = sheetRG.getDataRange().getValues();
        const headers = data[0];
        const idSpjCol = headers.indexOf('id_spj');
        const statusNotaCol = headers.indexOf('status_nota');
        const statusSpjCol = headers.indexOf('status_spj');
        
        if (idSpjCol !== -1) {
          for (let i = 1; i < data.length; i++) {
            if (String(data[i][idSpjCol]) === String(payload.id_spj)) {
              if(statusNotaCol !== -1) sheetRG.getRange(i + 1, statusNotaCol + 1).setValue('Draft');
              if(statusSpjCol !== -1) sheetRG.getRange(i + 1, statusSpjCol + 1).setValue('Draft');
              sheetRG.getRange(i + 1, idSpjCol + 1).setValue(''); // Reset ID SPJ
            }
          }
        }
      }
      return createJsonResponse({ status: 'success', message: 'SPJ Berhasil ditolak dan nota dikembalikan ke Draft.' });
    }

    // === ACTION: UPDATE (Generic) ===
    if (action === 'update' && SHEET_NAMES.includes(sheetName)) {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet || sheet.getLastRow() <= 1) return createJsonResponse({ status: 'error', message: 'Sheet tidak ditemukan atau kosong.' });
      
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const updates = payload.updates;
      
      const timestamps = Array.isArray(payload.timestamp) ? payload.timestamp : [payload.timestamp];
      const tsColIndex = headers.indexOf('timestamp');
      
      if (tsColIndex === -1) return createJsonResponse({ status: 'error', message: 'Kolom timestamp tidak ditemukan.' });
      
      let count = 0;
      for (let i = 1; i < data.length; i++) {
        let rowVal = data[i][tsColIndex];
        
        // Handle case where timestamp might be missing (rare)
        if (!rowVal || rowVal === '') {
          rowVal = `old_row_${i + 1}`;
        }

        let isMatch = false;
        for (let targetTs of timestamps) {
          if (rowVal instanceof Date) {
            // Precise Date matching
            if (rowVal.getTime() === new Date(targetTs).getTime()) { isMatch = true; break; }
          } else {
            // String matching
            if (String(rowVal) === String(targetTs)) { isMatch = true; break; }
          }
        }

        if (isMatch) {
          for (const key in updates) {
            const colIndex = headers.indexOf(key);
            if (colIndex !== -1) {
              var val = updates[key];
              // List field yang wajib disimpan sebagai teks agar nol didepan tidak hilang
              const textFields = [
                'nik_vendor', 'kode_billing', 'no_ntpn', 'no_ntb', 
                'kode_subkegiatan', 'kode_rekening', 'nik', 'npwp', 'nip', 'nitku',
                'kode_program', 'kode_kegiatan', 'kode_objek_pajak', 'id_spj', 'kode_barang'
              ];
              if (textFields.includes(key)) {
                val = "'" + val;
              }
              sheet.getRange(i + 1, colIndex + 1).setValue(val);
            }
          }
          count++;
          if (count === timestamps.length && !Array.isArray(payload.timestamp)) break;
        }
      }
      
      recordAuditLog(user.username, user.role, 'UPDATE', sheetName, `Memperbarui ${count} data`);
      return createJsonResponse({ status: 'success', message: `${count} data berhasil diperbarui!` });
    }

    return createJsonResponse({ status: 'error', message: 'Invalid action atau sheet' });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.message });
  }
}

function getSheetData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() === 0) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  return rows.map((row, rowIdx) => {
    let obj = {};
    headers.forEach((header, index) => { obj[header] = row[index]; });
    
    const tsIdx = headers.indexOf('timestamp');
    if (tsIdx !== -1 && (!obj['timestamp'] || obj['timestamp'] === '')) {
      obj['timestamp'] = `old_row_${rowIdx + 2}`;
    }
    
    return obj;
  });
}

function createJsonResponse(responseObject) {
  return ContentService.createTextOutput(JSON.stringify(responseObject)).setMimeType(ContentService.MimeType.JSON);
}

function setHeaders(sheet, sheetName) {
  let headers = [];
  const name = String(sheetName || '').trim();
  const lowerName = name.toLowerCase();

  if (lowerName === 'program') headers = ['kode_program', 'nama_program', 'timestamp'];
  else if (lowerName === 'kegiatan') headers = ['kode_program', 'kode_kegiatan', 'nama_kegiatan', 'timestamp'];
  else if (lowerName === 'subkegiatan') headers = ['kode_kegiatan', 'kode_subkegiatan', 'nama_subkegiatan', 'timestamp'];
  else if (lowerName === 'rekening') headers = [
    'kode_subkegiatan', 'kode_rekening', 'nama_rekening', 'pagu', 
    'tahun_anggaran', 'tahap_anggaran', 'paket_belanja', 'keterangan_belanja',
    'kode_barang', 'uraian_barang', 'spesifikasi', 'satuan', 'harga_satuan',
    'koefisien_uraian', 'volume', 'timestamp'
  ];
  else if (lowerName === 'rincianbelanja') headers = ['kode_subkegiatan', 'kode_rekening', 'kode_rincian', 'nama_rincian', 'pagu', 'tahun_anggaran', 'tahap_anggaran', 'timestamp'];
  else if (lowerName === 'standarharga') headers = ['kode_kelompok_barang', 'uraian_kelompok_barang', 'id_standar_harga', 'kode_barang', 'uraian_barang', 'spesifikasi', 'satuan', 'harga_satuan', 'kode_rekening_list', 'jenis_standar_harga', 'timestamp'];
  else if (lowerName === 'pegawaiasn') headers = ['nip', 'nik', 'nitku', 'npwp', 'nama', 'golongan', 'peran_jabatan', 'kategori_pegawai', 'timestamp'];
  else if (lowerName === 'wppribadi') headers = ['nik', 'nitku', 'npwp', 'nama', 'timestamp'];
  else if (lowerName === 'wppihakketiga') headers = ['nik', 'nitku', 'npwp', 'nama_pemilik', 'nama_usaha', 'timestamp'];
  else if (lowerName === 'kop21') headers = ['kode_objek_pajak', 'nama_objek_pajak', 'timestamp'];
  else if (lowerName === 'kopuni') headers = ['kode_objek_pajak', 'nama_objek_pajak', 'tarif', 'timestamp'];
  else if (lowerName === 'realisasigu') headers = [
    'tahun_anggaran', 'tahap_anggaran', 'bulan_spj', 'proses_gu', 
    'kode_subkegiatan', 'kode_rekening', 'rekening_id', 'tanggal_nota', 'nik_vendor', 'nama_vendor', 'nominal_nota', 
    'ppn', 'pph21', 'pph22', 'pph23', 'keterangan_nota',
    'kop_pajak', 'kap_pajak', 'kjs_pajak', 'nop_pajak',
    'id_nota', 'status_spj', 'kode_billing', 'no_ntpn', 'no_ntb', 'status_nota', 'id_spj',
    'timestamp'
  ];
  else if (lowerName === 'dataspj') headers = [
    'id_spj', 'no_spj_resmi', 'bidang', 'tanggal_bayar', 'proses_gu', 
    'total_kotor', 'total_ppn', 'total_pph21', 'total_pph22', 'total_pph23', 
    'billing_ppn', 'ntpn_ppn', 'ntb_ppn', 'billing_pph21', 'ntpn_pph21', 'ntb_pph21', 
    'billing_pph22', 'ntpn_pph22', 'ntb_pph22', 'billing_pph23', 'ntpn_pph23', 'ntb_pph23', 
    'status_spj', 'timestamp'
  ];
  else if (lowerName === 'printednotes') headers = ['timestamp_nota', 'timestamp'];
  else if (lowerName === 'tagging') headers = ['kategori', 'nama_tag', 'timestamp'];
  else if (lowerName === 'settings') headers = ['key', 'value', 'timestamp'];
  
  if (headers.length > 0) {
    sheet.appendRow(headers);
    // Tambahkan formatting otomatis agar rapi
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
    sheet.setFrozenRows(1);
  } else {
    throw new Error("Header rujukan untuk sheet '" + sheetName + "' tidak ditemukan di backend.");
  }
}

function getSpreadsheetStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  let totalCells = 0;
  let totalRows = 0;
  let detail = [];

  sheets.forEach(sh => {
    const rows = sh.getMaxRows();
    const cols = sh.getMaxColumns();
    const cells = rows * cols;
    totalCells += cells;
    totalRows += rows;
    detail.push({
      name: sh.getName(),
      rows: rows,
      cells: cells
    });
  });

  return {
    total_cells_used: totalCells,
    total_rows_used: totalRows,
    max_cells_limit: 10000000, // Limit Google Sheets saat ini
    usage_percentage: ((totalCells / 10000000) * 100).toFixed(4),
    detail: detail
  };
}