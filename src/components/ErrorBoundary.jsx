import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-50 p-6 rounded-2xl border border-red-100 m-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-[#0A192F] mb-3">Terjadi Kesalahan Sistem</h2>
            <p className="text-gray-500 mb-6 text-sm">
              Komponen ini mengalami kegagalan saat dimuat. Hal ini mungkin terjadi karena gangguan jaringan atau bug pada aplikasi.
            </p>
            {this.state.error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg text-xs font-mono text-left mb-6 overflow-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0A192F] text-white rounded-xl font-bold hover:bg-[#122442] transition-colors"
            >
              <RefreshCw size={18} /> Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
