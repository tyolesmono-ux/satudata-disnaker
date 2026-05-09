import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, User, Key, Users, Save, RefreshCw, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { InputField, SelectField } from '../components/SharedUI';

const ModernCard = ({ children, title, icon: Icon }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
    <div className="px-6 py-5 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-amber-100 rounded-lg">
          <Icon size={18} className="text-amber-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-800 font-['Roboto']">{title}</h2>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

export default function ManajemenUser() {
  const { appUsers, fetchUsers, addUser, deleteUser, user: currentUser, modal } = useAppStore();
  const isLoading = modal.show && modal.status === 'loading';
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'operator',
    nama_lengkap: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await addUser(formData);
    if (success) {
      setFormData({ username: '', password: '', role: 'operator', nama_lengkap: '' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-0 space-y-8 font-['Roboto']">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Form Tambah User */}
        <div className="lg:col-span-1">
          <ModernCard title="Tambah User Baru" icon={UserPlus}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <InputField
                label="Username"
                icon={<User size={18} />}
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                placeholder="operator_1"
                required
              />
              <InputField
                label="Password"
                type="password"
                icon={<Key size={18} />}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
              />
              <InputField
                label="Nama Lengkap"
                value={formData.nama_lengkap}
                onChange={e => setFormData({ ...formData, nama_lengkap: e.target.value })}
                placeholder="Budi Santoso"
                required
              />
              <SelectField
                label="Role / Hak Akses"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="operator">Operator (Input Data)</option>
                <option value="admin">Admin Bidang (Manajemen Data)</option>
                <option value="super_admin">Super Admin (Akses Penuh)</option>
                <option value="kepala_bidang">Kepala Bidang (View Only)</option>
              </SelectField>
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  {isLoading ? 'Menyimpan...' : 'Tambah User'}
                </button>
              </div>
            </form>
          </ModernCard>
        </div>

        {/* Daftar User */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Users size={18} className="text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">Daftar Pengguna Sistem</h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm font-['Roboto']">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Nama Lengkap</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {appUsers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                        <div className="flex flex-col items-center gap-2"><AlertCircle size={28} className="opacity-50" /><p className="text-sm">Belum ada pengguna terdaftar.</p></div>
                      </td>
                    </tr>
                  ) : (
                    appUsers.map((u, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-800">{u.nama_lengkap}</div>
                          {u.username === currentUser?.username && (
                            <span className="inline-block text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full mt-0.5">Anda</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-mono text-sm">{u.username}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                              u.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                                u.role === 'kepala_bidang' ? 'bg-orange-100 text-orange-700' :
                                  'bg-gray-100 text-gray-700'
                            }`}>
                            <Shield size={12} />
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {u.username !== 'admin' && u.username !== currentUser?.username && (
                            <button
                              onClick={() => deleteUser(u.username)}
                              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Hapus User"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {appUsers.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/30 text-right">
                <p className="text-[10px] text-gray-400">Total {appUsers.length} pengguna</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}