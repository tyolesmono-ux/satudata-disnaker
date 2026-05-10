import { create } from 'zustand';
import { GAS_URL } from '../config/constants';
import { fetchWithTimeout } from '../utils/api';
import { EntitySchemas } from '../utils/schemas';

export const useAppStore = create((set, get) => ({
  // --- DATA STATES ---
  programs: [],
  kegiatans: [],
  subKegiatans: [],
  rekenings: [],
  pegawaiASN: [],
  wpPribadi: [],
  wpPihakKetiga: [],
  realisasiGU: [],
  dataSPJ: [],
  kop21: [],
  kopUNI: [],
  rincianbelanja: [],
  standarharga: [],
  taggings: [],
  settings: { activeTahap: 'APBD', activeTahun: new Date().getFullYear().toString() },
  storageStats: null,
  
  // --- UI STATES ---
  sidebarOpen: true,
  expandedMenu: 'realisasi',
  toast: { show: false, message: '', type: 'success' },
  modal: { show: false, status: 'loading', message: '' },
  isFetchingData: false,
  printData: null,
  printedNotes: [],

  // --- AUTH STATES ---
  token: localStorage.getItem('satuData_token') || null,
  user: JSON.parse(localStorage.getItem('satuData_user')) || null,
  appUsers: [],
  auditLogs: [],

  // --- UI ACTIONS ---
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setExpandedMenu: (menu) => set({ expandedMenu: menu }),
  setPrintData: (data) => set({ printData: data }),
  setModal: (modal) => set({ modal }),
  
  showToast: (message, type = 'success') => {
    set({ toast: { show: true, message, type } });
    setTimeout(() => set({ toast: { show: false, message: '', type: 'success' } }), 3000);
  },

  // --- DATA ACTIONS ---
  login: async (username, password) => {
    set({ modal: { show: true, status: 'loading', message: 'Sedang verifikasi login...' } });
    try {
      const response = await fetchWithTimeout(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'login', payload: { username, password } }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const result = await response.json();
      if (result.status === 'success') {
        const { token, user } = result.data;
        localStorage.setItem('satuData_token', token);
        localStorage.setItem('satuData_user', JSON.stringify(user));
        set({ token, user, modal: { show: false, status: 'loading', message: '' } });
        return true;
      } else {
        set({ modal: { show: true, status: 'error', message: result.message || 'Login gagal.' } });
        return false;
      }
    } catch (err) {
      set({ modal: { show: true, status: 'error', message: 'Terjadi kesalahan jaringan.' } });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('satuData_token');
    localStorage.removeItem('satuData_user');
    set({ token: null, user: null, appUsers: [] });
  },

  // --- USER MANAGEMENT ACTIONS ---
  fetchUsers: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const response = await fetchWithTimeout(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'getUsers', token }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const result = await response.json();
      if (result.status === 'success') set({ appUsers: result.data });
    } catch (err) { console.error('Gagal fetch users', err); }
  },

  addUser: async (userData) => {
    set({ modal: { show: true, status: 'loading', message: 'Menambahkan user...' } });
    try {
      const token = get().token;
      const response = await fetchWithTimeout(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'addUser', payload: userData, token }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const result = await response.json();
      if (result.status === 'success') {
        get().showToast('User berhasil ditambahkan', 'success');
        get().fetchUsers();
        set({ modal: { show: false, status: 'loading', message: '' } });
        return true;
      }
      set({ modal: { show: true, status: 'error', message: result.message } });
    } catch (err) { set({ modal: { show: true, status: 'error', message: 'Koneksi gagal' } }); }
    return false;
  },

  deleteUser: async (username) => {
    if (!confirm(`Hapus user ${username}?`)) return;
    set({ modal: { show: true, status: 'loading', message: 'Menghapus user...' } });
    try {
      const token = get().token;
      const response = await fetchWithTimeout(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'deleteUser', payload: { username }, token }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const result = await response.json();
      if (result.status === 'success') {
        get().showToast('User berhasil dihapus', 'success');
        get().fetchUsers();
        set({ modal: { show: false, status: 'loading', message: '' } });
      } else {
        set({ modal: { show: true, status: 'error', message: result.message } });
      }
    } catch (err) { set({ modal: { show: true, status: 'error', message: 'Koneksi gagal' } }); }
  },

  fetchAuditLogs: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const response = await fetchWithTimeout(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'getAuditLogs', token }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const result = await response.json();
      if (result.status === 'success') set({ auditLogs: result.data });
    } catch (err) { console.error('Gagal fetch audit logs', err); }
  },

  buatSPJBundle: async (payload) => {
    set({ modal: { show: true, status: 'loading', message: 'Sedang memproses pengajuan SPJ...' } });
    try {
      const token = get().token;
      const response = await fetchWithTimeout(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'buat_spj_bundle', payload, token }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const result = await response.json();
      if (result.status === 'success') {
        get().showToast('Berhasil membuat bundle SPJ!', 'success');
        await get().fetchAllData(); // Sync total
        set({ modal: { show: false, status: 'loading', message: '' } });
        return true;
      }
      set({ modal: { show: true, status: 'error', message: result.message } });
    } catch (err) { set({ modal: { show: true, status: 'error', message: 'Koneksi gagal' } }); }
    return false;
  },

  batchInsertRealisasi: async (items) => {
    set({ modal: { show: true, status: 'loading', message: `Sedang menyimpan ${items.length} nota...` } });
    try {
      const token = get().token;
      const response = await fetchWithTimeout(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'batch_insert_realisasi', payload: { items }, token }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const result = await response.json();
      if (result.status === 'success') {
        get().showToast(`${items.length} nota berhasil disimpan!`, 'success');
        await get().fetchAllData(); // Sync total
        set({ modal: { show: false, status: 'loading', message: '' } });
        return true;
      }
      set({ modal: { show: true, status: 'error', message: result.message } });
    } catch (err) { set({ modal: { show: true, status: 'error', message: 'Koneksi gagal' } }); }
    return false;
  },

  fetchAllData: async () => {
    if (!GAS_URL) return;
    const token = get().token;
    if (!token) return; // Harus login dulu

    set({ isFetchingData: true });
    try {
      const response = await fetchWithTimeout(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'getAllData', token }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const result = await response.json();
      if (result.status === 'success') {
        const data = result.data;
        const normalize = (list) => (list || []).map((item, idx) => ({
          ...item,
          timestamp: item.timestamp ? String(item.timestamp) : `old_row_${idx + 2}`
        }));

        set({
          programs: normalize(data.program),
          kegiatans: normalize(data.kegiatan),
          subKegiatans: normalize(data.subkegiatan),
          rekenings: normalize(data.rekening),
          pegawaiASN: normalize(data.pegawaiasn),
          wpPribadi: normalize(data.wppribadi),
          wpPihakKetiga: normalize(data.wppihakketiga),
          dataSPJ: normalize(data.dataspj),
          kop21: data.kop21 || [],
          kopUNI: data.kopuni || [],
          rincianbelanja: normalize(data.rincianbelanja),
          standarharga: normalize(data.standarharga),
          taggings: normalize(data.tagging),
          settings: {
            activeTahap: String(data.settings?.activeTahap || 'APBD'),
            activeTahun: String(data.settings?.activeTahun || new Date().getFullYear().toString())
          },
          storageStats: data.storage_stats || null,
          realisasiGU: normalize(data.realisasigu).map(r => ({ ...r, id_nota: r.id_nota || r.timestamp }))
        });
      }
    } catch (error) {
      get().showToast('Gagal menarik data dari database.', 'error');
    } finally {
      set({ isFetchingData: false });
    }
  },

  handleSaveData: async (sheetName, payload) => {
    // 1. Validasi dengan Zod jika schema tersedia
    try {
      const schema = EntitySchemas[sheetName];
      if (schema) {
        const validation = schema.safeParse(payload);
        if (!validation.success) {
          // Zod v3 uses .error.issues (not .error.errors)
          const allErrors = validation.error.issues.map(e => e.message).join('\n• ');
          set({ modal: { show: true, status: 'error', message: `Validasi Gagal:\n• ${allErrors}` } });
          return false;
        }
      }
    } catch (zodErr) {
      console.error('[Zod] Error saat validasi:', zodErr);
      // Blokir tetap jika terjadi error tak terduga
      set({ modal: { show: true, status: 'error', message: 'Terjadi kesalahan internal saat validasi data.' } });
      return false;
    }

    set({ modal: { show: true, status: 'loading', message: `Sedang menyimpan data ${sheetName}...` } });
    try {
      const token = get().token;
      const response = await fetchWithTimeout(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'insert', sheet: sheetName, payload, token }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' } 
      });
      const result = await response.json();
      if (result.status !== 'success') throw new Error(result.message);
      
      const currentState = get();
      const updateState = {};
      
      if (sheetName === 'Program') updateState.programs = [...currentState.programs, payload];
      if (sheetName === 'Kegiatan') updateState.kegiatans = [...currentState.kegiatans, payload];
      if (sheetName === 'SubKegiatan') updateState.subKegiatans = [...currentState.subKegiatans, payload];
      if (sheetName === 'Rekening') updateState.rekenings = [...currentState.rekenings, payload];
      if (sheetName === 'PegawaiASN') updateState.pegawaiASN = [...currentState.pegawaiASN, payload];
      if (sheetName === 'WPPribadi') updateState.wpPribadi = [...currentState.wpPribadi, payload];
      if (sheetName === 'WPPihakKetiga') updateState.wpPihakKetiga = [...currentState.wpPihakKetiga, payload];
      if (sheetName === 'RincianBelanja') updateState.rincianbelanja = [...currentState.rincianbelanja, payload];
      if (sheetName === 'StandarHarga') updateState.standarharga = [...currentState.standarharga, payload];
      if (sheetName === 'Tagging') updateState.taggings = [...currentState.taggings, payload];
      if (sheetName === 'RealisasiGU') {
        const realIdNota = result.id_nota || ('temp_' + Date.now());
        const realTimestamp = result.timestamp || realIdNota;
        updateState.realisasiGU = [...currentState.realisasiGU, { 
          ...payload, 
          id_nota: realIdNota, 
          timestamp: realTimestamp,
          status_nota: 'Draft',
          status_spj: 'Draft',
          id_spj: ''
        }];
      }
      
      const successMsg = sheetName === 'RealisasiGU' && payload.proses_gu 
        ? `Data ${payload.proses_gu} berhasil disimpan!`
        : `Data ${sheetName} berhasil disimpan!`;
        
      set({ ...updateState, modal: { show: true, status: 'success', message: successMsg } });
      get().fetchAllData(); // Background sync
      return true; 
    } catch (error) {
      set({ modal: { show: true, status: 'error', message: `Gagal: ${error.message}` } });
      return false; 
    }
  },

  handleUpdateData: async (sheetName, timestamp, updates) => {
    set({ modal: { show: true, status: 'loading', message: `Sedang memperbarui data ${sheetName}...` } });
    try {
      const token = get().token;
      const response = await fetchWithTimeout(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'update', sheet: sheetName, payload: { timestamp, updates }, token }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const result = await response.json();
      if (result.status !== 'success') throw new Error(result.message);

      const tsArray = Array.isArray(timestamp) ? timestamp.map(String) : [String(timestamp)];
      if (tsArray.includes("undefined") || tsArray.includes("null")) {
        console.error("Attempted update with invalid timestamp", tsArray);
        throw new Error("Invalid timestamp: Data tidak memiliki ID unik untuk diupdate.");
      }
      
      const currentState = get();
      const updateState = {};
      const keyMap = {
        'Program': 'programs',
        'Kegiatan': 'kegiatans',
        'SubKegiatan': 'subKegiatans',
        'Rekening': 'rekenings',
        'PegawaiASN': 'pegawaiASN',
        'WPPribadi': 'wpPribadi',
        'WPPihakKetiga': 'wpPihakKetiga',
        'RealisasiGU': 'realisasiGU',
        'Tagging': 'taggings'
      };

      const stateKey = keyMap[sheetName];
      if (stateKey) {
        updateState[stateKey] = currentState[stateKey].map(item => 
          tsArray.includes(String(item.timestamp)) ? { ...item, ...updates } : item
        );
      }

      set({
        ...updateState,
        modal: { show: true, status: 'success', message: result.message }
      });
      get().fetchAllData(); // Sync background
      return true;
    } catch (error) {
      set({ modal: { show: true, status: 'error', message: `Gagal: ${error.message}` } });
      return false;
    }
  },

  handleInitializePhase: async (sourcePhase, targetPhase, year) => {
    set({ modal: { show: true, status: 'loading', message: `Sedang menginisiasi tahap ${targetPhase}...` } });
    try {
      const token = get().token;
      const response = await fetchWithTimeout(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'initialize_new_phase', 
          payload: { sourcePhase, targetPhase, year }, 
          token 
        }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const result = await response.json();
      if (result.status !== 'success') throw new Error(result.message);

      set({ modal: { show: true, status: 'success', message: result.message } });
      await get().fetchAllData(); // Refresh all data to get the new rows
      return true;
    } catch (error) {
      set({ modal: { show: true, status: 'error', message: `Gagal: ${error.message}` } });
      return false;
    }
  },

  handleUpdateSettings: async (newSettings) => {
    set({ modal: { show: true, status: 'loading', message: 'Menyimpan konfigurasi sistem...' } });
    try {
      const token = get().token;
      const response = await fetchWithTimeout(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'updateSettings', payload: newSettings, token }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const result = await response.json();
      if (result.status !== 'success') throw new Error(result.message);

      set({ 
        settings: { ...get().settings, ...newSettings },
        modal: { show: true, status: 'success', message: result.message }
      });
      return true;
    } catch (error) {
      set({ modal: { show: true, status: 'error', message: `Gagal: ${error.message}` } });
      return false;
    }
  },

  // Manual setters for complex updates in components
  // Manual setters with functional update support
  setRealisasiGU: (data) => {
    if (typeof data === 'function') set((state) => ({ realisasiGU: data(state.realisasiGU) }));
    else set({ realisasiGU: data });
  },
  setDataSPJ: (data) => {
    if (typeof data === 'function') set((state) => ({ dataSPJ: data(state.dataSPJ) }));
    else set({ dataSPJ: data });
  },
  setPrintedNotes: (data) => set({ printedNotes: data }),
}));
