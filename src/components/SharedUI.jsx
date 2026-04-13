// File: src/components/SharedUI.jsx

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Save, ChevronDown } from 'lucide-react';
import { theme } from '../config/constants';

export const FormContainer = ({ title, children, onSubmit, isSubmitting }) => (
  <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border p-8 animate-in slide-in-from-bottom-4 duration-500" style={{ borderColor: theme.borderGray }}>
    <h2 className="text-xl font-bold mb-8 pb-3 border-b-2 border-gray-100 text-[#0A192F] relative">
      <span className="absolute bottom-[-2px] left-0 w-24 h-[2px] bg-[#D4AF37] transition-all duration-300"></span>
      {title}
    </h2>
    <form onSubmit={onSubmit} className="space-y-6">
      <fieldset disabled={isSubmitting}>
        {children}
        <div className="pt-6 flex justify-end">
          <button type="submit" className="flex items-center px-8 py-3 text-white bg-[#0A192F] rounded-lg transition-all duration-300 hover:bg-[#122442] hover:shadow-lg hover:shadow-[#0A192F]/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none group focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/30">
            {isSubmitting ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> Menyimpan...</>
            ) : (
              <><Save size={18} className="mr-2 text-[#D4AF37] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3" /> Simpan Data</>
            )}
          </button>
        </div>
      </fieldset>
    </form>
  </div>
);

export const InputField = ({ label, className, ...props }) => (
  <div className="group">
    <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors duration-300 group-focus-within:text-[#0A192F]">{label}</label>
    <input className={`w-full px-4 py-2.5 bg-gray-50/50 border rounded-lg focus:ring-4 outline-none transition-all duration-300 hover:border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed border-gray-200 focus:bg-white focus:ring-[#D4AF37]/30 focus:border-[#0A192F] shadow-sm ${className||''}`} {...props} />
  </div>
);

export const SelectField = ({ label, children, ...props }) => (
  <div className="group">
    <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors duration-300 group-focus-within:text-[#0A192F]">{label}</label>
    <select className="w-full px-4 py-2.5 bg-gray-50/50 border rounded-lg focus:ring-4 outline-none transition-all duration-300 hover:border-gray-300 border-gray-200 focus:bg-white focus:ring-[#D4AF37]/30 focus:border-[#0A192F] shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed" {...props}>
      {children}
    </select>
  </div>
);

export const SearchableSelect = ({ label, options = [], value, onChange, placeholder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const safeOptions = useMemo(() => Array.isArray(options) ? options : [], [options]);

  const filteredOptions = useMemo(() => {
    const kw = searchTerm.toLowerCase();
    return safeOptions.filter(opt => 
      String(opt?.label || '').toLowerCase().includes(kw) ||
      String(opt?.value || '').toLowerCase().includes(kw)
    );
  }, [safeOptions, searchTerm]);

  const selectedOption = useMemo(() => safeOptions.find(opt => opt.value === value), [safeOptions, value]);

  useEffect(() => {
    // Sync searchTerm with value only when NOT open
    if (!isOpen) {
      if (selectedOption) setSearchTerm(selectedOption.label);
      else if (!value) setSearchTerm('');
    }
  }, [selectedOption, value, isOpen]);

  return (
    <div className="group relative" ref={containerRef}>
      <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors duration-300 group-focus-within:text-[#0A192F]">{label}</label>
      <div className="relative">
        <input 
          type="text"
          value={searchTerm}
          className="w-full px-4 py-2.5 bg-gray-50/50 border rounded-lg focus:ring-4 outline-none transition-all duration-300 hover:border-gray-300 border-gray-200 focus:bg-white focus:ring-[#D4AF37]/30 focus:border-[#0A192F] shadow-sm"
          placeholder={placeholder}
          onFocus={() => {
            setSearchTerm(''); // Clear on focus per request
            setIsOpen(true);
          }}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (!e.target.value) onChange('');
          }}
          onBlur={() => {
            // Delay to let onMouseDown fires
            setTimeout(() => {
              setIsOpen(false);
              // Restore if nothing selected
              if (selectedOption) setSearchTerm(selectedOption.label);
              else if (!value) setSearchTerm('');
            }, 200);
          }}
        />
        <ChevronDown size={18} className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <ul className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5">
          {filteredOptions.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-500 italic">Data tidak ditemukan</li>
          ) : (
            filteredOptions.map((opt, idx) => (
              <li 
                key={idx}
                onMouseDown={() => {
                  onChange(opt.value);
                  setSearchTerm(opt.label);
                  setIsOpen(false);
                }}
                className={`px-4 py-2.5 text-sm cursor-pointer border-b last:border-0 transition-colors ${opt.value === value ? 'bg-blue-50 text-[#0A192F] font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                {opt.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};