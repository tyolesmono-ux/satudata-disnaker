import React, { useState, useMemo } from 'react';
import { Tag, Trash2, Plus, Info, LayoutGrid, Type } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { FormContainer, InputField, SelectField } from '../components/SharedUI';
import { theme } from '../config/constants';

const MasterTagging = () => {
  const { taggings, handleSaveData, setModal, showToast, user } = useAppStore();
  const [activeTab, setActiveTab] = useState('Paket');
  const [newTagName, setNewTagName] = useState('');

  const filteredTags = useMemo(() => {
    return taggings.filter(t => t.kategori === activeTab);
  }, [taggings, activeTab]);

  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    const exists = taggings.some(t => t.kategori === activeTab && t.nama_tag.toLowerCase() === newTagName.toLowerCase());
    if (exists) {
      return showToast(`Tag "${newTagName}" sudah ada di kategori ${activeTab}!`, 'error');
    }

    const payload = {
      kategori: activeTab,
      nama_tag: newTagName.trim()
    };

    const success = await handleSaveData('Tagging', payload);
    if (success) {
      setNewTagName('');
    }
  };

  const handleDeleteTag = async (tag) => {
    if (!confirm(`Hapus tag "${tag.nama_tag}"? Data anggaran yang sudah menggunakan tag ini tidak akan terhapus, tapi tag ini tidak akan muncul lagi di pilihan.`)) return;
    
    setModal({ show: true, status: 'loading', message: 'Menghapus tag...' });
    try {
      // Kita asumsikan ada fungsi delete di store yang mendukung sheet 'Tagging'
      // Jika belum ada, kita bisa gunakan endpoint insert dengan flag delete atau action khusus
      // Untuk saat ini saya gunakan handleSaveData dengan logic khusus atau placeholder
      // Namun biasanya kita butuh timestamp untuk delete
      // Saya akan panggil fetch ke GAS langsung jika handleDeleteData belum generic
      const { GAS_URL, token, fetchAllData } = useAppStore.getState();
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'delete', 
          sheet: 'Tagging', 
          payload: { timestamp: tag.timestamp },
          token 
        }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const result = await response.json();
      if (result.status === 'success') {
        showToast('Tag berhasil dihapus', 'success');
        fetchAllData();
        setModal({ show: false, status: 'loading', message: '' });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      setModal({ show: true, status: 'error', message: error.message });
    }
  };

  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return (
      <div className="p-10 text-center text-gray-500 italic">
        Anda tidak memiliki akses ke halaman ini.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-[#0A192F] p-8 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
           <h2 className="text-2xl font-black flex items-center gap-3">
             <Tag className="text-[#D4AF37]" /> Manajemen Master Tagging
           </h2>
           <p className="text-gray-400 text-sm mt-2 max-w-xl">
             Kelola daftar Paket dan Keterangan belanja untuk memastikan konsistensi input data di seluruh modul penganggaran.
           </p>
        </div>

        <div className="flex border-b">
           <button 
             onClick={() => setActiveTab('Paket')}
             className={`flex-1 py-4 text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'Paket' ? 'bg-white text-[#0A192F] border-b-2 border-[#D4AF37]' : 'bg-gray-50 text-gray-400 hover:text-gray-600'}`}
           >
             <LayoutGrid size={18} /> Paket / Kelompok Belanja
           </button>
           <button 
             onClick={() => setActiveTab('Keterangan')}
             className={`flex-1 py-4 text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'Keterangan' ? 'bg-white text-[#0A192F] border-b-2 border-[#D4AF37]' : 'bg-gray-50 text-gray-400 hover:text-gray-600'}`}
           >
             <Type size={18} /> Keterangan Belanja
           </button>
        </div>

        <div className="p-8 space-y-8">
           {/* Form Input */}
           <form onSubmit={handleAddTag} className="flex gap-4 items-end bg-gray-50 p-6 rounded-2xl border border-gray-100">
             <div className="flex-1">
                <InputField 
                  label={`Tambah Master ${activeTab}`}
                  placeholder={`Ketik nama ${activeTab.toLowerCase()}...`}
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  className="!bg-white"
                />
             </div>
             <button 
               type="submit"
               className="bg-[#0A192F] text-white p-3 rounded-xl hover:bg-black transition-all hover:-translate-y-1 active:scale-95 shadow-lg shadow-[#0A192F]/20"
             >
               <Plus size={24} />
             </button>
           </form>

           {/* List Data */}
           <div className="space-y-3">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                Daftar {activeTab} Terdaftar ({filteredTags.length})
              </h4>
              
              {filteredTags.length === 0 ? (
                <div className="p-10 border-2 border-dashed border-gray-100 rounded-2xl text-center text-gray-300 italic text-sm">
                  Belum ada data master untuk {activeTab.toLowerCase()}.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {filteredTags.map((tag, idx) => (
                     <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-[#D4AF37]/50 hover:shadow-md transition-all group">
                        <span className="text-sm font-bold text-[#0A192F]">{tag.nama_tag}</span>
                        <button 
                          onClick={() => handleDeleteTag(tag)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                     </div>
                   ))}
                </div>
              )}
           </div>

           <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
              <Info className="text-blue-500 shrink-0" size={18} />
              <p className="text-[11px] text-blue-700 leading-relaxed">
                <strong>Tips:</strong> Gunakan penamaan yang singkat namun jelas. Tagging ini akan muncul sebagai pilihan utama saat user mengisi form rincian anggaran.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MasterTagging;
