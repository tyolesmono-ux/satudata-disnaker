import React, { useEffect, useState } from 'react';
import { Activity, ShieldAlert, History, User, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function LogAktivitas() {
  const { auditLogs, fetchAuditLogs } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAuditLogs();
    setRefreshing(false);
  };

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
    if (action.includes('LOGIN_FAILED') || action.includes('DELETE') || action.includes('TOLAK')) return { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' };
    if (action.includes('LOGIN')) return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' };
    if (action.includes('UPDATE') || action.includes('EDIT')) return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' };
    if (action.includes('INSERT') || action.includes('ADD')) return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
    if (action.includes('VERIFY') || action.includes('BUNDLE')) return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' };
    return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-0 space-y-6 font-['Roboto']">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="px-6 py-5 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <History size={20} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Audit Log Sistem</h2>
              <p className="text-xs text-gray-500">Rekam jejak seluruh aktivitas krusial pengguna</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Memuat...' : 'Refresh Log'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Waktu</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Pengguna</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Aktivitas</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Modul</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Detail Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <AlertCircle size={32} className="mb-2 opacity-50" />
                      <p className="text-sm font-medium">Belum ada log aktivitas yang tercatat.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                auditLogs.map((log, idx) => {
                  const actionStyle = getActionColor(log.action);
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-xs">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 uppercase">
                            {log.username?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{log.username}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{log.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${actionStyle.bg} ${actionStyle.text} ${actionStyle.border}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-600 text-sm">
                        {log.module}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm max-w-md truncate">
                        {log.details ? log.details.replace(/"/g, '') : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {auditLogs.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/30 text-right">
            <p className="text-[10px] text-gray-400">Total {auditLogs.length} log aktivitas</p>
          </div>
        )}
      </div>
    </div>
  );
}