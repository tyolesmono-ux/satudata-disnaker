import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, User, Key, Users } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { FormContainer, InputField, SelectField } from '../components/SharedUI';

export default function ManajemenUser() {
  const { appUsers, fetchUsers, addUser, deleteUser, user: currentUser } = useAppStore();
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Tambah User */}
        <div className="lg:col-span-1">
          <FormContainer title="Tambah User Baru" onSubmit={handleSubmit}>
            <InputField 
              label="Username" 
              icon={<User size={18}/>}
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
              placeholder="operator_1"
              required
            />
            <InputField 
              label="Password" 
              type="password"
              icon={<Key size={18}/>}
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              placeholder="••••••••"
              required
            />
            <InputField 
              label="Nama Lengkap" 
              value={formData.nama_lengkap}
              onChange={e => setFormData({...formData, nama_lengkap: e.target.value})}
              placeholder="Budi Santoso"
              required
            />
            <SelectField 
              label="Role / Hak Akses" 
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value})}
            >
              <option value="operator">Operator (Input Data)</option>
              <option value="admin">Admin Bidang (Manajemen Data)</option>
              <option value="super_admin">Super Admin (Akses Penuh)</option>
              <option value="kepala_bidang">Kepala Bidang (View Only)</option>
            </SelectField>
          </FormContainer>
        </div>

        {/* Daftar User */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-[#0A192F]">
                <Users size={20} />
              </div>
              <h2 className="text-lg font-bold text-[#0A192F]">Daftar Pengguna Sistem</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-4">Nama Lengkap</th>
                    <th className="px-6 py-4">Username</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {appUsers.map((u, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{u.nama_lengkap}</div>
                        {u.username === currentUser?.username && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Anda</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-sm">{u.username}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
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
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Hapus User"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
