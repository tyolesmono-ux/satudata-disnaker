import React, { useState, useMemo, useEffect } from 'react';
import { FormContainer, InputField, SelectField } from './SharedUI';
import { Search, Users, Building2, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const FormPegawaiASN = () => {
  const { handleSaveData, modal } = useAppStore();
  const isLoading = modal.show && modal.status === 'loading';
  const [formData, setFormData] = useState({ nip: '', nik: '', nitku: '', npwp: '', nama: '', golongan: '', peran_jabatan: '', kategori_pegawai: 'Internal' });
  
  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    const success = await handleSaveData('PegawaiASN', formData); 
    if(success) setFormData({ nip: '', nik: '', nitku: '', npwp: '', nama: '', golongan: '', peran_jabatan: '', kategori_pegawai: 'Internal' }); 
  };

  return (
    <FormContainer title="Input Data Pegawai ASN" onSubmit={handleSubmit} isSubmitting={isLoading}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="NIP" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value.replace(/[^0-9]/g, '').slice(0, 18)})} placeholder="1980..." required />
        <InputField label="Nama Lengkap" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value.replace(/[^a-zA-Z\s.,'-]/g, '')})} required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="NIK" value={formData.nik} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 16); setFormData({ ...formData, nik: val, nitku: val ? `${val}000000` : '' }) }} placeholder="16 Digit NIK" required />
        <InputField label="NITKU (Otomatis)" value={formData.nitku} readOnly disabled className="bg-gray-100" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="NPWP (Opsional)" value={formData.npwp} onChange={e => setFormData({...formData, npwp: e.target.value.replace(/[^0-9]/g, '').slice(0, 16)})} />
        <SelectField label="Golongan" value={formData.golongan} onChange={e => setFormData({...formData, golongan: e.target.value})} required>
          <option value="">-- Pilih Golongan --</option>
          <option value="I">Gol. I</option><option value="II">Gol. II</option><option value="III">Gol. III</option><option value="IV">Gol. IV</option>
        </SelectField>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField label="Peran Jabatan" value={formData.peran_jabatan} onChange={e => setFormData({...formData, peran_jabatan: e.target.value})} required>
          <option value="">-- Pilih Peran --</option>
          <option value="PA">PA</option><option value="PPK">PPK</option><option value="PPTK">PPTK</option><option value="Bendahara">Bendahara</option><option value="Staff">Staff</option>
        </SelectField>
        <SelectField label="Kategori Pegawai" value={formData.kategori_pegawai} onChange={e => setFormData({...formData, kategori_pegawai: e.target.value})} required>
          <option value="Internal">Internal</option>
          <option value="Eksternal">Eksternal</option>
        </SelectField>
      </div>
    </FormContainer>
  );
};

export const FormWPPribadi = () => {
  const { handleSaveData, modal } = useAppStore();
  const isLoading = modal.show && modal.status === 'loading';
  const [formData, setFormData] = useState({ nik: '', nitku: '', npwp: '', nama: '' });
  
  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    const success = await handleSaveData('WPPribadi', formData); 
    if(success) setFormData({ nik: '', nitku: '', npwp: '', nama: '' }); 
  };

  return (
    <FormContainer title="Input Data WP Pribadi" onSubmit={handleSubmit} isSubmitting={isLoading}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="NIK" value={formData.nik} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 16); setFormData({ ...formData, nik: val, nitku: val ? `${val}000000` : '' }) }} required />
        <InputField label="NITKU (Otomatis)" value={formData.nitku} readOnly disabled className="bg-gray-100" />
      </div>
      <InputField label="NPWP" value={formData.npwp} onChange={e => setFormData({...formData, npwp: e.target.value.replace(/[^0-9]/g, '').slice(0, 16)})} required />
      <InputField label="Nama Lengkap" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value.replace(/[^a-zA-Z\s.,'-]/g, '')})} required />
    </FormContainer>
  );
};

export const FormWPPihakKetiga = () => {
  const { handleSaveData, modal } = useAppStore();
  const isLoading = modal.show && modal.status === 'loading';
  const [formData, setFormData] = useState({ nik: '', nitku: '', npwp: '', nama_pemilik: '', nama_usaha: '' });
  
  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    const success = await handleSaveData('WPPihakKetiga', formData); 
    if(success) setFormData({ nik: '', nitku: '', npwp: '', nama_pemilik: '', nama_usaha: '' }); 
  };

  return (
    <FormContainer title="Input Data WP Pihak Ketiga" onSubmit={handleSubmit} isSubmitting={isLoading}>
      <InputField label="Nama Usaha (CV/PT)" value={formData.nama_usaha} onChange={e => setFormData({...formData, nama_usaha: e.target.value.replace(/[^a-zA-Z0-9\s.,'-]/g, '')})} required />
      <InputField label="Nama Pemilik" value={formData.nama_pemilik} onChange={e => setFormData({...formData, nama_pemilik: e.target.value.replace(/[^a-zA-Z\s.,'-]/g, '')})} required />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="NIK Pemilik" value={formData.nik} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 16); setFormData({ ...formData, nik: val, nitku: val ? `${val}000000` : '' }) }} required />
        <InputField label="NITKU (Otomatis)" value={formData.nitku} readOnly disabled className="bg-gray-100" />
      </div>
      <InputField label="NPWP Badan/Usaha" value={formData.npwp} onChange={e => setFormData({...formData, npwp: e.target.value.replace(/[^0-9]/g, '').slice(0, 16)})} required />
    </FormContainer>
  );
};

export const DaftarWajibPajak = () => {
  const { pegawaiASN, wpPribadi, wpPihakKetiga } = useAppStore();
  const [activeTab, setActiveTab] = useState('asn');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredData = useMemo(() => {
    let data = [];
    if (activeTab === 'asn') data = pegawaiASN;
    else if (activeTab === 'pribadi') data = wpPribadi;
    else if (activeTab === 'pihak_ketiga') data = wpPihakKetiga;

    if (!searchTerm) return data;

    const kw = searchTerm.toLowerCase();
    return data.filter(item => 
      (item.nama || item.nama_usaha || item.nama_pemilik || '').toLowerCase().includes(kw) ||
      (item.nip || '').toLowerCase().includes(kw) ||
      (item.nik || '').toLowerCase().includes(kw) ||
      (item.npwp || '').toLowerCase().includes(kw)
    );
  }, [activeTab, searchTerm, pegawaiASN, wpPribadi, wpPihakKetiga]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const tabs = [
    { id: 'asn', label: 'Pegawai ASN', icon: <Users size={18} /> },
    { id: 'pribadi', label: 'WP Pribadi', icon: <User size={18} /> },
    { id: 'pihak_ketiga', label: 'Pihak Ketiga', icon: <Building2 size={18} /> },
  ];

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 border-b bg-gray-50/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-[#0A192F] flex items-center gap-2">
            <Users className="text-[#D4AF37]" /> Daftar Wajib Pajak / Penerima
          </h2>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari Nama/NIP/NIK/NPWP..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#0A192F] outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id 
                ? 'bg-[#0A192F] text-white shadow-lg shadow-[#0A192F]/20' 
                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {tab.id === 'asn' ? pegawaiASN.length : tab.id === 'pribadi' ? wpPribadi.length : wpPihakKetiga.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            {activeTab === 'asn' && (
              <tr>
                <th className="p-4 font-bold text-[#0A192F]">Nama / NIP</th>
                <th className="p-4 font-bold text-[#0A192F]">NIK / NITKU</th>
                <th className="p-4 font-bold text-[#0A192F]">Gol / Jabatan</th>
                <th className="p-4 font-bold text-[#0A192F]">Kategori</th>
                <th className="p-4 font-bold text-[#0A192F]">NPWP</th>
              </tr>
            )}
            {activeTab === 'pribadi' && (
              <tr>
                <th className="p-4 font-bold text-[#0A192F]">Nama Lengkap</th>
                <th className="p-4 font-bold text-[#0A192F]">NIK</th>
                <th className="p-4 font-bold text-[#0A192F]">NITKU</th>
                <th className="p-4 font-bold text-[#0A192F]">NPWP</th>
              </tr>
            )}
            {activeTab === 'pihak_ketiga' && (
              <tr>
                <th className="p-4 font-bold text-[#0A192F]">Nama Usaha (CV/PT)</th>
                <th className="p-4 font-bold text-[#0A192F]">Pemilik / NIK</th>
                <th className="p-4 font-bold text-[#0A192F]">NITKU</th>
                <th className="p-4 font-bold text-[#0A192F]">NPWP Badan</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-12 text-center text-gray-400 italic">
                  Belum ada data yang terinput untuk kategori ini.
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  {activeTab === 'asn' && (
                    <>
                      <td className="p-4">
                        <div className="font-bold text-[#0A192F]">{item.nama}</div>
                        <div className="text-xs text-gray-500 font-mono">{item.nip}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-700 font-medium">{item.nik}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{item.nitku}</div>
                      </td>
                      <td className="p-4">
                        <div className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold mr-2">Gol. {item.golongan}</div>
                        <span className="text-gray-600">{item.peran_jabatan}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${item.kategori_pegawai === 'Internal' ? 'bg-green-50 text-green-700' : 'bg-purple-50 text-purple-700'}`}>
                          {item.kategori_pegawai}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs text-gray-500">{item.npwp || '-'}</td>
                    </>
                  )}
                  {activeTab === 'pribadi' && (
                    <>
                      <td className="p-4 font-bold text-[#0A192F]">{item.nama}</td>
                      <td className="p-4 text-gray-700 font-medium">{item.nik}</td>
                      <td className="p-4 font-mono text-xs text-gray-400">{item.nitku}</td>
                      <td className="p-4 font-mono text-xs text-gray-500">{item.npwp}</td>
                    </>
                  )}
                  {activeTab === 'pihak_ketiga' && (
                    <>
                      <td className="p-4 font-bold text-[#0A192F]">{item.nama_usaha}</td>
                      <td className="p-4">
                        <div className="text-gray-700 font-medium">{item.nama_pemilik}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{item.nik}</div>
                      </td>
                      <td className="p-4 font-mono text-xs text-gray-400">{item.nitku}</td>
                      <td className="p-4 font-mono text-xs text-gray-500">{item.npwp}</td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t bg-gray-50/30 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Menampilkan <span className="font-bold text-[#0A192F]">{(currentPage - 1) * itemsPerPage + 1}</span> sampai <span className="font-bold text-[#0A192F]">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> dari <span className="font-bold text-[#0A192F]">{filteredData.length}</span> data
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-lg font-bold transition-all ${
                    currentPage === i + 1 
                    ? 'bg-[#0A192F] text-white shadow-md' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 border'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};