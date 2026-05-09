import React, { useState, useMemo, useEffect } from 'react';
import { FormContainer, InputField, SelectField } from './SharedUI';
import { Search, Users, Building2, User, ChevronLeft, ChevronRight, Save, RefreshCw, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

// Shared form card style
const FormCard = ({ children, title, onSubmit, isSubmitting }) => (
  <div className="max-w-4xl mx-auto">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
      <div className="px-6 py-5 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white rounded-t-2xl">
        <h2 className="text-lg font-bold text-gray-800 font-['Roboto'] flex items-center gap-2">
          <div className="p-1.5 bg-amber-100 rounded-lg">
            <Users size={18} className="text-amber-600" />
          </div>
          {title}
        </h2>
      </div>
      <form onSubmit={onSubmit} className="p-6 space-y-5">
        {children}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

export const FormPegawaiASN = () => {
  const { handleSaveData, modal } = useAppStore();
  const isLoading = modal.show && modal.status === 'loading';
  const [formData, setFormData] = useState({
    nip: '', nik: '', nitku: '', npwp: '', nama: '',
    golongan: '', peran_jabatan: '', kategori_pegawai: 'Internal'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await handleSaveData('PegawaiASN', formData);
    if (success) setFormData({
      nip: '', nik: '', nitku: '', npwp: '', nama: '',
      golongan: '', peran_jabatan: '', kategori_pegawai: 'Internal'
    });
  };

  return (
    <FormCard title="Input Data Pegawai ASN" onSubmit={handleSubmit} isSubmitting={isLoading}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <InputField
          label="NIP"
          value={formData.nip}
          onChange={e => setFormData({ ...formData, nip: e.target.value.replace(/[^0-9]/g, '').slice(0, 18) })}
          placeholder="1980..."
          required
          className="font-['Roboto']"
        />
        <InputField
          label="Nama Lengkap"
          value={formData.nama}
          onChange={e => setFormData({ ...formData, nama: e.target.value.replace(/[^a-zA-Z\s.,'-]/g, '') })}
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <InputField
          label="NIK"
          value={formData.nik}
          onChange={e => {
            const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 16);
            setFormData({ ...formData, nik: val, nitku: val ? `${val}000000` : '' });
          }}
          placeholder="16 Digit NIK"
          required
        />
        <InputField
          label="NITKU (Otomatis)"
          value={formData.nitku}
          readOnly
          disabled
          className="bg-gray-50 text-gray-600 font-mono text-sm"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <InputField
          label="NPWP (Opsional)"
          value={formData.npwp}
          onChange={e => setFormData({ ...formData, npwp: e.target.value.replace(/[^0-9]/g, '').slice(0, 16) })}
        />
        <SelectField
          label="Golongan"
          value={formData.golongan}
          onChange={e => setFormData({ ...formData, golongan: e.target.value })}
          required
        >
          <option value="">-- Pilih Golongan --</option>
          <option value="I">Gol. I</option>
          <option value="II">Gol. II</option>
          <option value="III">Gol. III</option>
          <option value="IV">Gol. IV</option>
        </SelectField>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SelectField
          label="Peran Jabatan"
          value={formData.peran_jabatan}
          onChange={e => setFormData({ ...formData, peran_jabatan: e.target.value })}
          required
        >
          <option value="">-- Pilih Peran --</option>
          <option value="PA">PA</option>
          <option value="PPK">PPK</option>
          <option value="PPTK">PPTK</option>
          <option value="Bendahara">Bendahara</option>
          <option value="Staff">Staff</option>
        </SelectField>
        <SelectField
          label="Kategori Pegawai"
          value={formData.kategori_pegawai}
          onChange={e => setFormData({ ...formData, kategori_pegawai: e.target.value })}
          required
        >
          <option value="Internal">Internal</option>
          <option value="Eksternal">Eksternal</option>
        </SelectField>
      </div>
    </FormCard>
  );
};

export const FormWPPribadi = () => {
  const { handleSaveData, modal } = useAppStore();
  const isLoading = modal.show && modal.status === 'loading';
  const [formData, setFormData] = useState({ nik: '', nitku: '', npwp: '', nama: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await handleSaveData('WPPribadi', formData);
    if (success) setFormData({ nik: '', nitku: '', npwp: '', nama: '' });
  };

  return (
    <FormCard title="Input Data WP Pribadi" onSubmit={handleSubmit} isSubmitting={isLoading}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <InputField
          label="NIK"
          value={formData.nik}
          onChange={e => {
            const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 16);
            setFormData({ ...formData, nik: val, nitku: val ? `${val}000000` : '' });
          }}
          required
        />
        <InputField
          label="NITKU (Otomatis)"
          value={formData.nitku}
          readOnly
          disabled
          className="bg-gray-50 text-gray-600 font-mono text-sm"
        />
      </div>
      <InputField label="NPWP" value={formData.npwp} onChange={e => setFormData({ ...formData, npwp: e.target.value.replace(/[^0-9]/g, '').slice(0, 16) })} required />
      <InputField label="Nama Lengkap" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value.replace(/[^a-zA-Z\s.,'-]/g, '') })} required />
    </FormCard>
  );
};

export const FormWPPihakKetiga = () => {
  const { handleSaveData, modal } = useAppStore();
  const isLoading = modal.show && modal.status === 'loading';
  const [formData, setFormData] = useState({ nik: '', nitku: '', npwp: '', nama_pemilik: '', nama_usaha: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await handleSaveData('WPPihakKetiga', formData);
    if (success) setFormData({ nik: '', nitku: '', npwp: '', nama_pemilik: '', nama_usaha: '' });
  };

  return (
    <FormCard title="Input Data WP Pihak Ketiga" onSubmit={handleSubmit} isSubmitting={isLoading}>
      <InputField
        label="Nama Usaha (CV/PT)"
        value={formData.nama_usaha}
        onChange={e => setFormData({ ...formData, nama_usaha: e.target.value.replace(/[^a-zA-Z0-9\s.,'-]/g, '') })}
        required
      />
      <InputField
        label="Nama Pemilik"
        value={formData.nama_pemilik}
        onChange={e => setFormData({ ...formData, nama_pemilik: e.target.value.replace(/[^a-zA-Z\s.,'-]/g, '') })}
        required
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <InputField
          label="NIK Pemilik"
          value={formData.nik}
          onChange={e => {
            const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 16);
            setFormData({ ...formData, nik: val, nitku: val ? `${val}000000` : '' });
          }}
          required
        />
        <InputField
          label="NITKU (Otomatis)"
          value={formData.nitku}
          readOnly
          disabled
          className="bg-gray-50 text-gray-600 font-mono text-sm"
        />
      </div>
      <InputField
        label="NPWP Badan/Usaha"
        value={formData.npwp}
        onChange={e => setFormData({ ...formData, npwp: e.target.value.replace(/[^0-9]/g, '').slice(0, 16) })}
        required
      />
    </FormCard>
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
    { id: 'asn', label: 'Pegawai ASN', icon: <Users size={18} />, count: pegawaiASN.length },
    { id: 'pribadi', label: 'WP Pribadi', icon: <User size={18} />, count: wpPribadi.length },
    { id: 'pihak_ketiga', label: 'Pihak Ketiga', icon: <Building2 size={18} />, count: wpPihakKetiga.length },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
        <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white rounded-t-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <Users size={20} className="text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 font-['Roboto']">Daftar Wajib Pajak / Penerima</h2>
              </div>
              <p className="text-sm text-gray-500 ml-10">Kelola data pegawai dan wajib pajak untuk keperluan perpajakan</p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cari Nama/NIP/NIK/NPWP..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all font-['Roboto'] text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap text-sm
                  ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
                <span className={`
                  ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold
                  ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}
                `}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-['Roboto']">
            <thead className="bg-gray-50 border-b border-gray-100">
              {activeTab === 'asn' && (
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Nama / NIP</th>
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">NIK / NITKU</th>
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Gol / Jabatan</th>
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Kategori</th>
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">NPWP</th>
                </tr>
              )}
              {activeTab === 'pribadi' && (
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Nama Lengkap</th>
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">NIK</th>
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">NITKU</th>
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">NPWP</th>
                </tr>
              )}
              {activeTab === 'pihak_ketiga' && (
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Nama Usaha</th>
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Pemilik / NIK</th>
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">NITKU</th>
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">NPWP Badan</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <AlertCircle size={32} className="mb-2 opacity-50" />
                      <p className="text-sm font-medium">Belum ada data yang terinput untuk kategori ini.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors duration-150">
                    {activeTab === 'asn' && (
                      <>
                        <td className="px-5 py-4">
                          <div className="font-bold text-gray-800">{item.nama}</div>
                          <div className="text-[11px] text-gray-400 font-mono mt-0.5">{item.nip}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-gray-700 font-medium text-sm">{item.nik}</div>
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">{item.nitku}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">Gol. {item.golongan}</span>
                            <span className="text-sm text-gray-600">{item.peran_jabatan}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold ${item.kategori_pegawai === 'Internal' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'}`}>
                            {item.kategori_pegawai}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-gray-500">{item.npwp || '-'}</td>
                      </>
                    )}
                    {activeTab === 'pribadi' && (
                      <>
                        <td className="px-5 py-4 font-bold text-gray-800">{item.nama}</td>
                        <td className="px-5 py-4 text-gray-700 font-mono text-sm">{item.nik}</td>
                        <td className="px-5 py-4 font-mono text-xs text-gray-400">{item.nitku}</td>
                        <td className="px-5 py-4 font-mono text-xs text-gray-500">{item.npwp}</td>
                      </>
                    )}
                    {activeTab === 'pihak_ketiga' && (
                      <>
                        <td className="px-5 py-4 font-bold text-gray-800">{item.nama_usaha}</td>
                        <td className="px-5 py-4">
                          <div className="text-gray-700 font-medium">{item.nama_pemilik}</div>
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">{item.nik}</div>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-gray-400">{item.nitku}</td>
                        <td className="px-5 py-4 font-mono text-xs text-gray-500">{item.npwp}</td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-gray-500 font-['Roboto']">
              Menampilkan <span className="font-bold text-gray-700">{(currentPage - 1) * itemsPerPage + 1}</span> -{' '}
              <span className="font-bold text-gray-700">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span>{' '}
              dari <span className="font-bold text-gray-700">{filteredData.length}</span> data
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1.5">
                {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 7) pageNum = i + 1;
                  else if (currentPage <= 4) pageNum = i + 1;
                  else if (currentPage >= totalPages - 3) pageNum = totalPages - 6 + i;
                  else pageNum = currentPage - 3 + i;

                  if (pageNum < 1 || pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`
                        w-9 h-9 rounded-lg font-bold text-sm transition-all duration-200
                        ${currentPage === pageNum
                          ? 'bg-gray-900 text-white shadow-md'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }
                      `}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};