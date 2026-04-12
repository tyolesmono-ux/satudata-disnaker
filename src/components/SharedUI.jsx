// File: src/components/SharedUI.jsx

import React from 'react';
import { Save } from 'lucide-react';
import { theme } from '../config/constants';

export const FormContainer = ({ title, children, onSubmit, isSubmitting }) => (
  <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border p-8 animate-in slide-in-from-bottom-4 duration-500" style={{ borderColor: theme.borderGray }}>
    <h2 className="text-xl font-bold mb-8 pb-3 border-b-2 border-gray-100 text-[#0A192F] relative">
      <span className="absolute bottom-[-2px] left-0 w-24 h-[2px] bg-[#D4AF37] transition-all duration-300"></span>
      {title}
    </h2>
    <form onSubmit={onSubmit} className="space-y-6">
      {children}
      <div className="pt-6 flex justify-end">
        <button type="submit" disabled={isSubmitting} className="flex items-center px-8 py-3 text-white bg-[#0A192F] rounded-lg transition-all duration-300 hover:bg-[#122442] hover:shadow-lg hover:shadow-[#0A192F]/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none group focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/30">
          {isSubmitting ? 'Menyimpan...' : <><Save size={18} className="mr-2 text-[#D4AF37] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3" /> Simpan Data</>}
        </button>
      </div>
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