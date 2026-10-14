import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
          info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
        };

        const bg = {
          success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
          error: 'border-rose-200 bg-rose-50 text-rose-900',
          info: 'border-blue-200 bg-blue-50 text-blue-900',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between space-x-3 rounded-xl border p-3.5 shadow-lg backdrop-blur-sm transition-all duration-300 min-w-[300px] max-w-md ${
              bg[toast.type]
            }`}
          >
            <div className="flex items-center space-x-2.5">
              {icons[toast.type]}
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => onRemove(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
