// File: src/components/SharedUI.jsx

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Save, ChevronDown, Lock, Search, X } from 'lucide-react';
import { theme } from '../config/constants';
import { useAppStore } from '../store/useAppStore';

export const FormContainer = ({ title, children, onSubmit, isSubmitting }) => {
  const { user } = useAppStore();
  const isReadOnly = user?.role === 'kepala_bidang';

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border p-8 animate-in slide-in-from-bottom-4 duration-500" style={{ borderColor: theme.borderGray }}>
      <div className="flex justify-between items-center mb-8 pb-3 border-b-2 border-gray-100 relative">
        <h2 className="text-xl font-bold text-[#0A192F]">
          <span className="absolute bottom-[-2px] left-0 w-24 h-[2px] bg-[#D4AF37]"></span>
          {title}
        </h2>
        {isReadOnly && (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
            <Lock size={12} />
            Mode Lihat Saja
          </div>
        )}
      </div>
      
      <form onSubmit={onSubmit} className="space-y-6">
        <fieldset disabled={isSubmitting || isReadOnly}>
          {children}
          {!isReadOnly && (
            <div className="pt-6 flex justify-end">
              <button type="submit" className="flex items-center px-8 py-3 text-white bg-[#0A192F] rounded-lg transition-all duration-300 hover:bg-[#122442] hover:shadow-lg hover:shadow-[#0A192F]/20 hover-scale hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none group focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/30">
                {isSubmitting ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> Menyimpan...</>
                ) : (
                  <><Save size={18} className="mr-2 text-[#D4AF37] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3" /> Simpan Data</>
                )}
              </button>
            </div>
          )}
        </fieldset>
      </form>
    </div>
  );
};

export const InputField = ({ label, className, ...props }) => (
  <div className="group">
    <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors duration-300 group-focus-within:text-[#0A192F]">{label}</label>
    <input className={`w-full px-4 py-2.5 bg-gray-50/50 border rounded-lg focus:ring-4 outline-none transition-all duration-300 hover:border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed border-gray-200 focus:bg-white focus:ring-[#D4AF37]/30 focus:border-[#0A192F] shadow-sm ${className||''}`} {...props} />
  </div>
);

// ==========================================
// PREMIUM GLASSMORPHISM SELECT COMPONENT
// ==========================================
const PremiumDropdown = ({ label, options, value, onChange, placeholder, required, disabled, isSearchableSelectApi }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  const safeOptions = useMemo(() => Array.isArray(options) ? options : [], [options]);

  const filteredOptions = useMemo(() => {
    const kw = searchTerm.toLowerCase();
    return safeOptions.filter(opt => 
      String(opt?.label || '').toLowerCase().includes(kw) ||
      String(opt?.value || '').toLowerCase().includes(kw)
    );
  }, [safeOptions, searchTerm]);

  const selectedOption = useMemo(() => safeOptions.find(opt => String(opt.value) === String(value)), [safeOptions, value]);

  // Handle Keyboard Navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Auto-scroll to highlighted item
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const el = listRef.current.children[highlightedIndex];
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  // Reset highlight when searching or opening
  useEffect(() => {
    setHighlightedIndex(filteredOptions.length > 0 ? 0 : -1);
  }, [searchTerm, isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (opt) => {
    if (isSearchableSelectApi) onChange(opt.value);
    else onChange({ target: { value: opt.value } }); // Simulate native event
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (isSearchableSelectApi) onChange('');
    else onChange({ target: { value: '' } });
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className="group relative" ref={containerRef} onKeyDown={handleKeyDown}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors duration-300 group-focus-within:text-[#0A192F]">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {/* Hidden native select for HTML5 Form Validation */}
      <select value={value || ''} onChange={() => {}} className="absolute opacity-0 w-full h-0 pointer-events-none" required={required} disabled={disabled}>
        <option value={value || ''}>{value}</option>
      </select>

      <div 
        className={`relative w-full px-4 py-3 bg-white/50 backdrop-blur-md border rounded-xl flex items-center justify-between cursor-pointer transition-all duration-300 ${disabled ? 'bg-gray-100/50 opacity-70 cursor-not-allowed border-gray-200' : isOpen ? 'border-[#0A192F] ring-4 ring-[#D4AF37]/20 bg-white shadow-lg' : 'border-gray-200 hover:border-[#D4AF37] hover:shadow-md'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
      >
        <div className={`truncate ${!selectedOption ? 'text-gray-400' : 'text-[#0A192F] font-semibold'}`}>
          {selectedOption ? selectedOption.label : (placeholder || '-- Pilih --')}
        </div>
        <div className="flex items-center gap-2">
          {selectedOption && !disabled && !required && (
             <div onClick={handleClear} className="p-1 hover:bg-red-50 rounded-full text-gray-300 hover:text-red-500 transition-colors">
               <X size={14} />
             </div>
          )}
          <ChevronDown size={18} className={`text-[#D4AF37] transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#0A192F]' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
          <div className="p-3 border-b border-gray-50 bg-gray-50/50 sticky top-0 backdrop-blur-md z-10">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#0A192F] transition-all font-medium"
                placeholder="Ketik untuk mencari..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <ul ref={listRef} className="max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-8 text-sm text-center text-gray-400 flex flex-col items-center gap-3">
                <span className="text-3xl opacity-50">🔍</span>
                <p>Data tidak ditemukan</p>
              </li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = idx === highlightedIndex;
                return (
                  <li 
                    key={idx}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-4 py-3 text-sm cursor-pointer rounded-xl transition-all flex items-center justify-between group ${isSelected ? 'bg-[#0A192F] text-[#D4AF37] shadow-md' : isHighlighted ? 'bg-blue-50 text-[#0A192F]' : 'hover:bg-blue-50/50 text-gray-700 hover:text-[#0A192F]'}`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-in zoom-in duration-300"></div>}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// ==========================================
// DROP-IN REPLACEMENT ADAPTERS
// ==========================================
export const SelectField = ({ label, children, ...props }) => {
  // Convert native <option> elements to custom options array
  const options = React.Children.toArray(children).map(child => {
    if (React.isValidElement(child) && child.type === 'option') {
      return { value: child.props.value, label: child.props.children };
    }
    return null;
  }).filter(Boolean);

  return <PremiumDropdown label={label} options={options} {...props} isSearchableSelectApi={false} />;
};

export const SearchableSelect = ({ label, options, ...props }) => {
  return <PremiumDropdown label={label} options={options} {...props} isSearchableSelectApi={true} />;
};