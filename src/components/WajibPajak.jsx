// File: src/components/WajibPajak.jsx

import React, { useState } from 'react';
import { FormContainer, InputField, SelectField } from './SharedUI';

export const FormPegawaiASN = ({ onSave, isLoading }) => {
  const [formData, setFormData] = useState({ nip: '', nik: '', nitku: '', npwp: '', nama: '', golongan: '' });
  
  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    const success = await onSave('PegawaiASN', formData); 
    if(success) setFormData({ nip: '', nik: '', nitku: '', npwp: '', nama: '', golongan: '' }); 
  };

  return (
    <FormContainer title="Input Data Pegawai ASN" onSubmit={handleSubmit} isSubmitting={isLoading}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="NIP" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} placeholder="1980..." required />
        <InputField label="Nama Lengkap" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="NIK" type="number" value={formData.nik} onChange={e => setFormData({ ...formData, nik: e.target.value, nitku: e.target.value ? `${e.target.value}000000` : '' })} placeholder="16 Digit NIK" required />
        <InputField label="NITKU (Otomatis)" value={formData.nitku} readOnly disabled className="bg-gray-100" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="NPWP (Opsional)" value={formData.npwp} onChange={e => setFormData({...formData, npwp: e.target.value})} />
        <SelectField label="Golongan" value={formData.golongan} onChange={e => setFormData({...formData, golongan: e.target.value})} required>
          <option value="">-- Pilih Golongan --</option>
          <option value="I">Gol. I</option><option value="II">Gol. II</option><option value="III">Gol. III</option><option value="IV">Gol. IV</option>
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
        <InputField label="NIK" type="number" value={formData.nik} onChange={e => setFormData({ ...formData, nik: e.target.value, nitku: e.target.value ? `${e.target.value}000000` : '' })} required />
        <InputField label="NITKU (Otomatis)" value={formData.nitku} readOnly disabled className="bg-gray-100" />
      </div>
      <InputField label="NPWP" value={formData.npwp} onChange={e => setFormData({...formData, npwp: e.target.value})} required />
      <InputField label="Nama Lengkap" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} required />
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
      <InputField label="Nama Usaha (CV/PT)" value={formData.nama_usaha} onChange={e => setFormData({...formData, nama_usaha: e.target.value})} required />
      <InputField label="Nama Pemilik" value={formData.nama_pemilik} onChange={e => setFormData({...formData, nama_pemilik: e.target.value})} required />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="NIK Pemilik" type="number" value={formData.nik} onChange={e => setFormData({ ...formData, nik: e.target.value, nitku: e.target.value ? `${e.target.value}000000` : '' })} required />
        <InputField label="NITKU (Otomatis)" value={formData.nitku} readOnly disabled className="bg-gray-100" />
      </div>
      <InputField label="NPWP Badan/Usaha" value={formData.npwp} onChange={e => setFormData({...formData, npwp: e.target.value})} required />
    </FormContainer>
  );
};