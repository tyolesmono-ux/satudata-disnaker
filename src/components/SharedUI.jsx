// File: src/components/SharedUI.jsx

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Save, ChevronDown, Lock, Search, X, AlertCircle } from 'lucide-react';
import { theme } from '../config/constants';
import { useAppStore } from '../store/useAppStore';

// ==========================================
// PREMIUM CONFIRMATION DIALOG (MODAL)
// ==========================================
export const ConfirmDialog = ({ show, title, message, onConfirm, onCancel, confirmText = 'Ya, Lanjutkan', cancelText = 'Batal' }) => {
  if (!show) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300 px-4">
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-amber-100/50">
            <AlertCircle size={40} className="text-[#D4AF37] animate-bounce" />
          </div>
          <h3 className="text-2xl font-black text-[#0A192F] mb-3">{title}</h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-8 px-4">{message}</p>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={onCancel}
              className="px-6 py-3.5 border-2 border-gray-100 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all active:scale-95"
            >
              {cancelText}
            </button>
            <button 
              onClick={onConfirm}
              className="px-6 py-3.5 bg-[#0A192F] text-[#D4AF37] rounded-xl font-black shadow-lg shadow-[#0A192F]/20 hover:bg-[#122442] hover:-translate-y-1 transition-all active:scale-95"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const FormContainer = ({ title, children, onSubmit, isSubmitting }) => {
  const { user } = useAppStore();
  const isReadOnly = user?.role === 'kepala_bidang';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md font-['Roboto']">
      <div className="px-6 py-5 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-gray-800 tracking-tight">{title}</h2>
          </div>
          {isReadOnly && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-200 uppercase tracking-wider">
              <Lock size={12} /> Mode Lihat Saja
            </div>
          )}
        </div>
      </div>
      <form onSubmit={onSubmit} className="p-6 space-y-6">
        <fieldset disabled={isSubmitting || isReadOnly} className="space-y-6">
          {children}
          {!isReadOnly && (
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:translate-y-0 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Save size={16} className="text-amber-400" />
                )}
                <span className="text-sm uppercase tracking-wider">Simpan</span>
              </button>
            </div>
          )}
        </fieldset>
      </form>
    </div>
  );
};

export const InputField = ({ label, className, icon: Icon, ...props }) => (
  <div className="group">
    {label && (
      <label className="block text-sm font-semibold text-gray-700 mb-1.5 transition-colors duration-200 group-focus-within:text-gray-900">
        {label} {props.required && <span className="text-rose-500 text-xs ml-0.5">*</span>}
      </label>
    )}
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors">
          <Icon size={18} />
        </div>
      )}
      <input
        className={`w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all duration-200 hover:border-gray-300 disabled:bg-gray-50 disabled:text-gray-500 font-['Roboto'] text-sm ${Icon ? 'pl-10' : ''} ${className || ''}`}
        {...props}
      />
    </div>
  </div>
);

// ==========================================
// PREMIUM GLASS SELECT WITH SEARCH (MODERN)
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

  // Keyboard navigation
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
  }, [searchTerm, filteredOptions.length]);

  // Click outside
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
    else onChange({ target: { value: opt.value } });
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
    <div className="group relative font-['Roboto']" ref={containerRef} onKeyDown={handleKeyDown}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-1.5 transition-colors duration-200 group-focus-within:text-gray-900">
          {label} {required && <span className="text-rose-500 text-xs ml-0.5">*</span>}
        </label>
      )}

      {/* Hidden native select for HTML5 form validation */}
      <select value={value || ''} onChange={() => { }} className="absolute opacity-0 w-full h-0 pointer-events-none" required={required} disabled={disabled}>
        <option value={value || ''}>{value}</option>
      </select>

      <div
        className={`relative w-full px-4 py-2.5 bg-white border rounded-xl flex items-center justify-between cursor-pointer transition-all duration-200 ${disabled
            ? 'bg-gray-50 opacity-70 cursor-not-allowed border-gray-200'
            : isOpen
              ? 'border-amber-500 ring-2 ring-amber-500/30 bg-white shadow-sm'
              : 'border-gray-200 hover:border-amber-300 hover:shadow-sm'
          }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
      >
        <div className={`truncate text-sm ${!selectedOption ? 'text-gray-400' : 'text-gray-800 font-medium'}`}>
          {selectedOption ? selectedOption.label : (placeholder || '-- Pilih --')}
        </div>
        <div className="flex items-center gap-2">
          {selectedOption && !disabled && !required && (
            <div onClick={handleClear} className="p-1 hover:bg-rose-50 rounded-full text-gray-300 hover:text-rose-500 transition-colors">
              <X size={14} />
            </div>
          )}
          <ChevronDown size={18} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-500' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full min-w-[200px] mt-2 bg-white/95 backdrop-blur-md border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
          {safeOptions.length > 8 && (
            <div className="p-3 border-b border-gray-100 bg-gray-50/50 sticky top-0">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  autoFocus
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
                  placeholder="Ketik untuk mencari..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          )}
          <ul ref={listRef} className="max-h-80 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-8 text-sm text-center text-gray-400 flex flex-col items-center gap-2">
                <Search size={24} className="opacity-40" />
                <p>Data tidak ditemukan</p>
              </li>
            ) : (
              filteredOptions.slice(0, 150).map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = idx === highlightedIndex;
                return (
                  <li
                    key={idx}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-4 py-2.5 text-sm cursor-pointer rounded-lg transition-all flex items-center justify-between gap-3 ${isSelected
                        ? 'bg-gray-900 text-white shadow-sm'
                        : isHighlighted
                          ? 'bg-gray-100 text-gray-900'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <span className="font-medium truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className={`text-[10px] truncate ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></div>
                    )}
                  </li>
                );
              })
            )}
            {filteredOptions.length > 150 && (
              <li className="px-4 py-2 text-[10px] text-center text-gray-400 italic bg-gray-50 rounded-lg mt-1 border border-dashed border-gray-200">
                Menampilkan 150 dari {filteredOptions.length} data. Persempit pencarian.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SELECT WRAPPERS (compatible with existing code)
// ==========================================
export const SelectField = ({ label, children, ...props }) => {
  const options = React.Children.toArray(children)
    .filter(child => React.isValidElement(child) && child.type === 'option')
    .map(child => ({ value: child.props.value, label: child.props.children }));
  return <PremiumDropdown label={label} options={options} {...props} isSearchableSelectApi={false} />;
};

export const SearchableSelect = ({ label, options, ...props }) => {
  return <PremiumDropdown label={label} options={options} {...props} isSearchableSelectApi={true} />;
};