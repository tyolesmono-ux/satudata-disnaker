/**
 * BACKEND SATUDATA - Dinas Tenaga Kerja
 */

const SHEET_NAMES = ['Program', 'Kegiatan', 'SubKegiatan', 'Rekening', 'PegawaiASN', 'WPPribadi', 'WPPihakKetiga', 'RealisasiGU', 'DataSPJ', 'KOP21', 'KOPUNI'];

function doGet(e) {
  try {
    const action = e.parameter.action;
    if (action === 'getAllData') {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      // Perbaikan Header Otomatis untuk RealisasiGU jika diperlukan
      const sheet = ss.getSheetByName('RealisasiGU');
      if (sheet) {
        const currentHeaders = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
        if (currentHeaders.length > 0 && (currentHeaders.indexOf('status_spj') === -1 || currentHeaders.indexOf('timestamp') < 19)) {
          setHeaders(sheet, 'RealisasiGU');
        }
      }

      const data = {};
      SHEET_NAMES.forEach(sheetName => {
        data[sheetName.toLowerCase()] = getSheetData(sheetName);
      });
      return createJsonResponse({ status: 'success', data: data });
    }
    return createJsonResponse({ status: 'error', message: 'Action tidak ditemukan' });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.message });
  }
}

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
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
        rowData = ["'" + payload.kode_subkegiatan, "'" + payload.kode_rekening, payload.nama_rekening, payload.pagu, payload.tahun_anggaran, payload.tahap_anggaran, new Date()];
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
          payload.tanggal_nota, "'" + payload.nik_vendor, payload.nama_vendor, payload.nominal_nota,
          payload.ppn, payload.pph21, payload.pph22, payload.pph23, 
          payload.keterangan_nota,
          "'" + (payload.kop_pajak || ''), "'" + (payload.kap_pajak || ''), "'" + (payload.kjs_pajak || ''), "'" + (payload.nop_pajak || ''),
          idNota, 'Draft', '', '', '', 'Draft', '', // id_nota, status_spj, kode_billing, no_ntpn, no_ntb, status_nota, id_spj
          tsUnique // timestamp unik (string)
        ];
      }
      
      // Untuk RealisasiGU, return lebih awal dengan id_nota & timestamp yang digenerate backend
      if (sheetName === 'RealisasiGU') {
        sheet.appendRow(rowData);
        return createJsonResponse({ status: 'success', message: 'Data berhasil disimpan!', id_nota: idNota, timestamp: String(tsUnique) });
      }
      
      sheet.appendRow(rowData);
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
      
      return createJsonResponse({ status: 'success', message: items.length + ' nota berhasil disimpan!', results: results });
    }

    // ===============================================
    // IMPORT KERTAS KERJA ANGGARAN (Excel .xlsx)
    // ===============================================
    if (action === 'import_kertas_kerja') {
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
            else if (h === 'timestamp') rowData.push(tsValue);
            else rowData.push('');
          });
          sheet.appendRow(rowData);
        }
        processed++;
      });
      
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

    // === ACTION: UPDATE ===
    if (action === 'update' && sheetName === 'RealisasiGU') {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet || sheet.getLastRow() <= 1) return createJsonResponse({ status: 'error', message: 'Sheet tidak ditemukan.' });
      
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const updates = payload.updates;
      
      const timestamps = Array.isArray(payload.timestamp) ? payload.timestamp : [payload.timestamp];
      const tsColIndex = headers.indexOf('timestamp');
      
      if (tsColIndex === -1) return createJsonResponse({ status: 'error', message: 'Kolom timestamp tidak ditemukan.' });
      
      let count = 0;
      for (let i = 1; i < data.length; i++) {
        let rowVal = data[i][tsColIndex];
        
        if (!rowVal || rowVal === '') {
          rowVal = `old_row_${i + 1}`;
        }

        let isMatch = false;
        
        for (let targetTs of timestamps) {
          if (rowVal instanceof Date) {
            if (rowVal.getTime() === new Date(targetTs).getTime()) { isMatch = true; break; }
          } else {
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
                'kode_program', 'kode_kegiatan', 'kode_objek_pajak', 'id_spj'
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
  if (sheetName === 'Program') headers = ['kode_program', 'nama_program', 'timestamp'];
  else if (sheetName === 'Kegiatan') headers = ['kode_program', 'kode_kegiatan', 'nama_kegiatan', 'timestamp'];
  else if (sheetName === 'SubKegiatan') headers = ['kode_kegiatan', 'kode_subkegiatan', 'nama_subkegiatan', 'timestamp'];
  else if (sheetName === 'Rekening') headers = ['kode_subkegiatan', 'kode_rekening', 'nama_rekening', 'pagu', 'tahun_anggaran', 'tahap_anggaran', 'timestamp'];
  else if (sheetName === 'PegawaiASN') headers = ['nip', 'nik', 'nitku', 'npwp', 'nama', 'golongan', 'peran_jabatan', 'kategori_pegawai', 'timestamp'];
  else if (sheetName === 'WPPribadi') headers = ['nik', 'nitku', 'npwp', 'nama', 'timestamp'];
  else if (sheetName === 'WPPihakKetiga') headers = ['nik', 'nitku', 'npwp', 'nama_pemilik', 'nama_usaha', 'timestamp'];
  else if (sheetName === 'KOP21') headers = ['kode_objek_pajak', 'nama_objek_pajak', 'timestamp'];
  else if (sheetName === 'KOPUNI') headers = ['kode_objek_pajak', 'nama_objek_pajak', 'tarif', 'timestamp'];
  else if (sheetName === 'RealisasiGU') headers = [
    'tahun_anggaran', 'tahap_anggaran', 'bulan_spj', 'proses_gu', 
    'kode_subkegiatan', 'kode_rekening', 'tanggal_nota', 'nik_vendor', 'nama_vendor', 'nominal_nota', 
    'ppn', 'pph21', 'pph22', 'pph23', 'keterangan_nota',
    'kop_pajak', 'kap_pajak', 'kjs_pajak', 'nop_pajak',
    'id_nota', 'status_spj', 'kode_billing', 'no_ntpn', 'no_ntb', 'status_nota', 'id_spj',
    'timestamp'
  ];
  else if (sheetName === 'DataSPJ') headers = [
    'id_spj', 'no_spj_resmi', 'bidang', 'tanggal_bayar', 'proses_gu', 
    'total_kotor', 'total_ppn', 'total_pph21', 'total_pph22', 'total_pph23', 
    'billing_ppn', 'ntpn_ppn', 'ntb_ppn', 'billing_pph21', 'ntpn_pph21', 'ntb_pph21', 
    'billing_pph22', 'ntpn_pph22', 'ntb_pph22', 'billing_pph23', 'ntpn_pph23', 'ntb_pph23', 
    'status_spj', 'timestamp'
  ];
  sheet.appendRow(headers);
}