// File: src/components/Anggaran.jsx

import React, { useState, useMemo } from 'react';
import { FormContainer, InputField, SelectField } from './SharedUI';
import { theme } from '../config/constants';

export const FormProgram = ({ onSave, isLoading }) => {
  const [formData, setFormData] = useState({ kode_program: '', nama_program: '' });
  const handleSubmit = async (e) => { e.preventDefault(); const success = await onSave('Program', formData); if(success) setFormData({ kode_program: '', nama_program: '' }); };
  return (
    <FormContainer title="Input Data Program" onSubmit={handleSubmit} isSubmitting={isLoading}>
      <InputField label="Kode Program" value={formData.kode_program} onChange={e => setFormData({...formData, kode_program: e.target.value})} placeholder="Contoh: 1.01" required />
      <InputField label="Nama Program" value={formData.nama_program} onChange={e => setFormData({...formData, nama_program: e.target.value})} placeholder="Contoh: Program Penunjang..." required />
    </FormContainer>
  );
};

export const FormKegiatan = ({ onSave, isLoading, programs }) => {
  const [formData, setFormData] = useState({ kode_program: '', kode_kegiatan: '', nama_kegiatan: '' });
  const handleSubmit = async (e) => { e.preventDefault(); const success = await onSave('Kegiatan', formData); if(success) setFormData({ ...formData, kode_kegiatan: '', nama_kegiatan: '' }); };
  return (
    <FormContainer title="Input Data Kegiatan" onSubmit={handleSubmit} isSubmitting={isLoading}>
      <SelectField label="Pilih Program" value={formData.kode_program} onChange={e => setFormData({...formData, kode_program: e.target.value})} required>
        <option value="">-- Pilih Program --</option>
        {programs.map(p => <option key={p.kode_program} value={p.kode_program}>[{p.kode_program}] {p.nama_program}</option>)}
      </SelectField>
      <InputField label="Kode Kegiatan" value={formData.kode_kegiatan} onChange={e => setFormData({...formData, kode_kegiatan: e.target.value})} placeholder="Contoh: 1.01.01" required disabled={!formData.kode_program} />
      <InputField label="Nama Kegiatan" value={formData.nama_kegiatan} onChange={e => setFormData({...formData, nama_kegiatan: e.target.value})} required disabled={!formData.kode_program} />
    </FormContainer>
  );
};

export const FormSubKegiatan = ({ onSave, isLoading, kegiatans }) => {
  const [formData, setFormData] = useState({ kode_kegiatan: '', kode_subkegiatan: '', nama_subkegiatan: '' });
  const handleSubmit = async (e) => { e.preventDefault(); const success = await onSave('SubKegiatan', formData); if(success) setFormData({ ...formData, kode_subkegiatan: '', nama_subkegiatan: '' }); };
  return (
    <FormContainer title="Input Data Sub Kegiatan" onSubmit={handleSubmit} isSubmitting={isLoading}>
      <SelectField label="Pilih Kegiatan" value={formData.kode_kegiatan} onChange={e => setFormData({...formData, kode_kegiatan: e.target.value})} required>
        <option value="">-- Pilih Kegiatan --</option>
        {kegiatans.map(k => <option key={k.kode_kegiatan} value={k.kode_kegiatan}>[{k.kode_kegiatan}] {k.nama_kegiatan}</option>)}
      </SelectField>
      <InputField label="Kode Sub Kegiatan" value={formData.kode_subkegiatan} onChange={e => setFormData({...formData, kode_subkegiatan: e.target.value})} placeholder="Contoh: 1.01.01.2.01" required disabled={!formData.kode_kegiatan} />
      <InputField label="Nama Sub Kegiatan" value={formData.nama_subkegiatan} onChange={e => setFormData({...formData, nama_subkegiatan: e.target.value})} required disabled={!formData.kode_kegiatan} />
    </FormContainer>
  );
};

export const FormRekening = ({ onSave, isLoading, subKegiatans, rekenings }) => {
  const [formData, setFormData] = useState({ kode_subkegiatan: '', kode_rekening: '', nama_rekening: '', pagu: '', tahun_anggaran: new Date().getFullYear().toString(), tahap_anggaran: 'Induk' });
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const masterRekening = useMemo(() => {
    const unique = []; const map = new Map();
    rekenings.forEach(item => { if (item.kode_rekening && !map.has(item.kode_rekening)) { map.set(item.kode_rekening, true); unique.push({ kode_rekening: item.kode_rekening, nama_rekening: item.nama_rekening }); } });
    return unique;
  }, [rekenings]);

  const filteredSuggestions = useMemo(() => {
    if (!formData.kode_rekening) return []; const kw = String(formData.kode_rekening).toLowerCase();
    return masterRekening.filter(item => String(item.kode_rekening).toLowerCase().includes(kw) || String(item.nama_rekening).toLowerCase().includes(kw));
  }, [formData.kode_rekening, masterRekening]);

  const handleSubmit = async (e) => { e.preventDefault(); const success = await onSave('Rekening', formData); if(success) setFormData({ ...formData, kode_rekening: '', nama_rekening: '', pagu: '' }); };

  return (
    <FormContainer title="Input Data Rekening (Pagu)" onSubmit={handleSubmit} isSubmitting={isLoading}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2 p-4 rounded-lg bg-gray-50 border" style={{ borderColor: theme.borderGray }}>
        <SelectField label="Tahun Anggaran" value={formData.tahun_anggaran} onChange={e => setFormData({...formData, tahun_anggaran: e.target.value})} required>
          <option value="2025">2025</option><option value="2026">2026</option><option value="2027">2027</option>
        </SelectField>
        <SelectField label="Tahap Anggaran" value={formData.tahap_anggaran} onChange={e => setFormData({...formData, tahap_anggaran: e.target.value})} required>
          <option value="Induk">Induk (Murni)</option><option value="Pergeseran 1">Pergeseran 1</option><option value="Perubahan">Perubahan (PAK)</option>
        </SelectField>
      </div>
      <SelectField label="Pilih Sub Kegiatan" value={formData.kode_subkegiatan} onChange={e => setFormData({...formData, kode_subkegiatan: e.target.value})} required>
        <option value="">-- Pilih Sub Kegiatan --</option>
        {subKegiatans.map(s => <option key={s.kode_subkegiatan} value={s.kode_subkegiatan}>[{s.kode_subkegiatan}] {s.nama_subkegiatan}</option>)}
      </SelectField>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <InputField label="Kode / Cari Rekening" value={formData.kode_rekening} onChange={e => { setFormData({...formData, kode_rekening: e.target.value}); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} placeholder="Ketik 5.1... atau 'Belanja...'" required disabled={!formData.kode_subkegiatan} autoComplete="off" />
          {showSuggestions && filteredSuggestions.length > 0 && formData.kode_subkegiatan && (
            <ul className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-auto">
              {filteredSuggestions.map((s, idx) => (
                <li key={idx} onClick={() => { setFormData({...formData, kode_rekening: s.kode_rekening, nama_rekening: s.nama_rekening}); setShowSuggestions(false); }} className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b text-sm">
                  <span className="font-bold">{s.kode_rekening}</span> <br/> <span className="text-gray-500">{s.nama_rekening}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <InputField label="Pagu Anggaran (Rp)" type="number" value={formData.pagu} onChange={e => setFormData({...formData, pagu: e.target.value})} required disabled={!formData.kode_subkegiatan} />
      </div>
      <InputField label="Nama Rekening (Uraian)" value={formData.nama_rekening} onChange={e => setFormData({...formData, nama_rekening: e.target.value})} required disabled={!formData.kode_subkegiatan} />
    </FormContainer>
  );
};