import React, { useEffect } from 'react';
import { Activity, ShieldAlert, History, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatRupiah } from '../utils/helpers'; // Just in case, usually not needed here but good to have

export default function LogAktivitas() {
  const { auditLogs, fetchAuditLogs } = useAppStore();

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const formatDate = (dateString) => {
    try {
      const d = new Date(dateString);
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).format(d);
    } catch {
      return dateString;
    }
  };

  const getActionColor = (action) => {
    if (action.includes('LOGIN_FAILED') || action.includes('DELETE') || action.includes('TOLAK')) return 'bg-red-100 text-red-700';
    if (action.includes('LOGIN')) return 'bg-green-100 text-green-700';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'bg-amber-100 text-amber-700';
    if (action.includes('INSERT') || action.includes('ADD')) return 'bg-blue-100 text-blue-700';
    if (action.includes('VERIFY') || action.includes('BUNDLE')) return 'bg-purple-100 text-purple-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-[#0A192F] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg text-[#D4AF37]">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Audit Log Sistem</h2>
              <p className="text-xs text-gray-400">Rekam jejak seluruh aktivitas krusial pengguna</p>
            </div>
          </div>
          <button 
            onClick={() => fetchAuditLogs()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-semibold transition-colors"
          >
            Refresh Log
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Pengguna</th>
                <th className="px-6 py-4">Aktivitas</th>
                <th className="px-6 py-4">Modul</th>
                <th className="px-6 py-4">Detail Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">
                    Belum ada log aktivitas yang tercatat.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-xs">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 uppercase">
                          {log.username?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{log.username}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider">{log.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-current/20 ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-600">
                      {log.module}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {log.details ? log.details.replace(/\"/g, '') : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
