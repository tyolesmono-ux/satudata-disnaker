import { create } from 'zustand';
import { GAS_URL } from '../config/constants';
import { fetchWithTimeout } from '../utils/api';

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
  
  // --- UI STATES ---
  activeMenu: 'dashboard',
  sidebarOpen: true,
  expandedMenu: 'realisasi',
  toast: { show: false, message: '', type: 'success' },
  modal: { show: false, status: 'loading', message: '' },
  isFetchingData: false,
  printData: null,
  printedNotes: [],

  // --- UI ACTIONS ---
  setActiveMenu: (menu) => set({ activeMenu: menu }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setExpandedMenu: (menu) => set({ expandedMenu: menu }),
  setPrintData: (data) => set({ printData: data }),
  setModal: (modal) => set({ modal }),
  
  showToast: (message, type = 'success') => {
    set({ toast: { show: true, message, type } });
    setTimeout(() => set({ toast: { show: false, message: '', type: 'success' } }), 3000);
  },

  // --- DATA ACTIONS ---
  fetchAllData: async () => {
    if (!GAS_URL) return;
    set({ isFetchingData: true });
    try {
      const response = await fetchWithTimeout(`${GAS_URL}?action=getAllData`);
      const result = await response.json();
      if (result.status === 'success') {
        const formattedRealisasi = (result.data.realisasigu || []).map((r, idx) => {
          const uniqueId = r.timestamp ? String(r.timestamp) : `temp_${idx}_${Date.now()}`;
          return { 
            ...r, 
            id_nota: r.id_nota || uniqueId,
            timestamp: uniqueId
          };
        });

        set({
          programs: result.data.program || [],
          kegiatans: result.data.kegiatan || [],
          subKegiatans: result.data.subkegiatan || [],
          rekenings: result.data.rekening || [],
          pegawaiASN: result.data.pegawaiasn || [],
          wpPribadi: result.data.wppribadi || [],
          wpPihakKetiga: result.data.wppihakketiga || [],
          dataSPJ: result.data.dataspj || [],
          kop21: result.data.kop21 || [],
          kopUNI: result.data.kopuni || [],
          realisasiGU: formattedRealisasi
        });
      }
    } catch (error) {
      get().showToast('Gagal menarik data dari database.', 'error');
    } finally {
      set({ isFetchingData: false });
    }
  },

  handleSaveData: async (sheetName, payload) => {
    set({ modal: { show: true, status: 'loading', message: `Sedang menyimpan data ${sheetName}...` } });
    try {
      const response = await fetchWithTimeout(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'insert', sheet: sheetName, payload }),
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
      
      set({ ...updateState, modal: { show: true, status: 'success', message: `Data ${sheetName} berhasil disimpan!` } });
      return true; 
    } catch (error) {
      set({ modal: { show: true, status: 'error', message: `Gagal: ${error.message}` } });
      return false; 
    }
  },

  handleUpdateData: async (timestamp, updates) => {
    set({ modal: { show: true, status: 'loading', message: 'Sedang memperbarui data...' } });
    try {
      const response = await fetchWithTimeout(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'update', sheet: 'RealisasiGU', payload: { timestamp: timestamp, updates } }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const result = await response.json();
      if (result.status !== 'success') throw new Error(result.message);

      const tsArray = Array.isArray(timestamp) ? timestamp.map(String) : [String(timestamp)];
      set({
        realisasiGU: get().realisasiGU.map(r => 
          tsArray.includes(String(r.timestamp)) ? { ...r, ...updates } : r
        ),
        modal: { show: true, status: 'success', message: result.message }
      });
      return true;
    } catch (error) {
      set({ modal: { show: true, status: 'error', message: `Gagal: ${error.message}` } });
      return false;
    }
  },

  // Manual setters for complex updates in components
  setRealisasiGU: (data) => set({ realisasiGU: data }),
  setDataSPJ: (data) => set({ dataSPJ: data }),
  setPrintedNotes: (data) => set({ printedNotes: data }),
}));
