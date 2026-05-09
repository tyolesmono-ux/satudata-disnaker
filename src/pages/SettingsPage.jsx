import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertTriangle, Calendar, Layers, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { FormContainer, SelectField } from '../components/SharedUI';

export default function SettingsPage() {
  const { settings, handleUpdateSettings, modal, user } = useAppStore();
  const [formData, setFormData] = useState({
    activeTahap: settings.activeTahap || 'APBD',
    activeTahun: settings.activeTahun || new Date().getFullYear().toString()
  });

  const isLoading = modal.show && modal.status === 'loading';

  useEffect(() => {
    setFormData({
      activeTahap: settings.activeTahap,
      activeTahun: settings.activeTahun
    });
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleUpdateSettings(formData);
  };

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <ShieldCheck size={64} className="mb-4 opacity-20" />
        <h2 className="text-xl font-bold">Akses Terbatas</h2>
        <p>Hanya Super Admin yang dapat mengakses halaman ini.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-['Roboto'] animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-2">
        <div className="p-3 bg-gray-900 text-white rounded-2xl shadow-lg">
          <Settings size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Konfigurasi Sistem</h1>
          <p className="text-sm text-gray-500">Atur parameter global aplikasi SatuData</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white">
              <h2 className="text-lg font-bold text-gray-800">Tahap Anggaran Aktif</h2>
              <p className="text-xs text-gray-400 mt-1">Tahap yang dipilih akan menjadi default di seluruh form input</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <Layers size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Tahap Berjalan</span>
                  </div>
                  <SelectField 
                    label="Pilih Tahap Anggaran" 
                    value={formData.activeTahap} 
                    onChange={e => setFormData({ ...formData, activeTahap: e.target.value })}
                    required
                  >
                    <option value="APBD">APBD (Murni)</option>
                    <option value="Pergeseran 1">Pergeseran 1</option>
                    <option value="Pergeseran 2">Pergeseran 2</option>
                    <option value="Perubahan">Perubahan (PAK)</option>
                  </SelectField>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <Calendar size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Tahun Anggaran</span>
                  </div>
                  <SelectField 
                    label="Pilih Tahun Anggaran" 
                    value={formData.activeTahun} 
                    onChange={e => setFormData({ ...formData, activeTahun: e.target.value })}
                    required
                  >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </SelectField>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-50 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-3 px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all hover:-translate-y-1 active:scale-95 shadow-xl shadow-gray-900/20 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Save size={20} className="text-amber-400" />
                  )}
                  <span>Simpan Konfigurasi</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6">
            <div className="flex items-center gap-2 text-amber-700 mb-4">
              <AlertTriangle size={20} />
              <h3 className="font-bold">Perhatian</h3>
            </div>
            <p className="text-sm text-amber-800 leading-relaxed">
              Mengubah **Tahap Anggaran Aktif** akan mempengaruhi nilai default pada:
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center gap-2 text-xs text-amber-900">
                <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                Input Rincian Anggaran
              </li>
              <li className="flex items-center gap-2 text-xs text-amber-900">
                <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                Input Realisasi / SPJ
              </li>
              <li className="flex items-center gap-2 text-xs text-amber-900">
                <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                Filter Laporan Coretax/SIMDTH
              </li>
            </ul>
            <p className="text-[10px] text-amber-600 mt-6 italic">
              Pastikan seluruh operator sudah selesai menginput data di tahap sebelumnya sebelum melakukan perpindahan tahap secara global.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
