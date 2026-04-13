// File: src/components/WajibPajak.jsx

import React, { useState } from 'react';
import { FormContainer, InputField, SelectField } from './SharedUI';

export const FormPegawaiASN = ({ onSave, isLoading }) => {
  const [formData, setFormData] = useState({ nip: '', nik: '', nitku: '', npwp: '', nama: '', golongan: '', peran_jabatan: '', kategori_pegawai: 'Internal' });
  
  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    const success = await onSave('PegawaiASN', formData); 
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

export const FormWPPribadi = ({ onSave, isLoading }) => {
  const [formData, setFormData] = useState({ nik: '', nitku: '', npwp: '', nama: '' });
  
  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    const success = await onSave('WPPribadi', formData); 
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

export const FormWPPihakKetiga = ({ onSave, isLoading }) => {
  const [formData, setFormData] = useState({ nik: '', nitku: '', npwp: '', nama_pemilik: '', nama_usaha: '' });
  
  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    const success = await onSave('WPPihakKetiga', formData); 
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