import React, { useState, useMemo } from 'react';
import { Tag, Trash2, Plus, Info, LayoutGrid, Type, Save, RefreshCw, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { InputField } from '../components/SharedUI';

const MasterTagging = () => {
  const { taggings, handleSaveData, setModal, showToast, user, fetchAllData, GAS_URL } = useAppStore();
  const [activeTab, setActiveTab] = useState('Paket');
  const [newTagName, setNewTagName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const filteredTags = useMemo(() => {
    return taggings.filter(t => t.kategori === activeTab);
  }, [taggings, activeTab]);

  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return showToast('Nama tag tidak boleh kosong', 'error');
    const exists = taggings.some(t => t.kategori === activeTab && t.nama_tag.toLowerCase() === newTagName.toLowerCase());
    if (exists) return showToast(`Tag "${newTagName}" sudah ada di kategori ${activeTab}!`, 'error');
    setIsSubmitting(true);
    const success = await handleSaveData('Tagging', {
      kategori: activeTab,
      nama_tag: newTagName.trim()
    });
    if (success) setNewTagName('');
    setIsSubmitting(false);
  };

  const handleDeleteTag = async (tag) => {
    if (!confirm(`Hapus tag "${tag.nama_tag}"? Data yang sudah menggunakan tag ini tidak akan terhapus, tetapi tag tidak akan muncul lagi.`)) return;
    setDeletingId(tag.timestamp);
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'delete',
          sheet: 'Tagging',
          payload: { timestamp: tag.timestamp },
          token: localStorage.getItem('satuData_token')
        }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const result = await response.json();
      if (result.status === 'success') {
        showToast('Tag berhasil dihapus', 'success');
        fetchAllData();
      } else throw new Error(result.message);
    } catch (error) {
      showToast(`Gagal hapus: ${error.message}`, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto p-10 text-center text-gray-500 italic font-['Roboto']">
        <AlertCircle size={48} className="mx-auto mb-3 opacity-50" />
        Anda tidak memiliki akses ke halaman ini.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-0 space-y-6 font-['Roboto']">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 rounded-xl">
              <Tag size={28} className="text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Manajemen Master Tagging</h1>
              <p className="text-gray-400 text-sm mt-1">Kelola daftar Paket dan Keterangan belanja untuk konsistensi input data</p>
            </div>
          </div>
        </div>

        <div className="flex border-b border-gray-100">
          <button
            onClick={() => { setActiveTab('Paket'); setNewTagName(''); }}
            className={`flex-1 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'Paket' ? 'bg-white text-gray-900 border-b-2 border-amber-500' : 'bg-gray-50 text-gray-400 hover:text-gray-600'}`}
          >
            <LayoutGrid size={18} /> Paket / Kelompok Belanja
          </button>
          <button
            onClick={() => { setActiveTab('Keterangan'); setNewTagName(''); }}
            className={`flex-1 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'Keterangan' ? 'bg-white text-gray-900 border-b-2 border-amber-500' : 'bg-gray-50 text-gray-400 hover:text-gray-600'}`}
          >
            <Type size={18} /> Keterangan Belanja
          </button>
        </div>

        <div className="p-8 space-y-8">
          <form onSubmit={handleAddTag} className="flex flex-col sm:flex-row gap-4 items-end bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <div className="flex-1">
              <InputField
                label={`Tambah Master ${activeTab}`}
                placeholder={`Ketik nama ${activeTab.toLowerCase()}...`}
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                className="bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
              {isSubmitting ? 'Menyimpan...' : 'Tambah'}
            </button>
          </form>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Tag size={12} /> Daftar {activeTab} Terdaftar ({filteredTags.length})
              </h4>
            </div>

            {filteredTags.length === 0 ? (
              <div className="p-12 border-2 border-dashed border-gray-100 rounded-2xl text-center text-gray-300 italic text-sm">
                Belum ada data master untuk {activeTab.toLowerCase()}.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTags.map((tag, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-amber-500/50 hover:shadow-md transition-all group">
                    <span className="text-sm font-semibold text-gray-800">{tag.nama_tag}</span>
                    <button
                      onClick={() => handleDeleteTag(tag)}
                      disabled={deletingId === tag.timestamp}
                      className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    >
                      {deletingId === tag.timestamp ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
            <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>Tips:</strong> Gunakan penamaan singkat namun jelas. Tagging ini akan muncul sebagai pilihan utama saat user mengisi form rincian anggaran.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterTagging;