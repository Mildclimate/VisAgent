import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToastStore } from '../../stores/toastStore';

const iconMap = {
  success: <CheckCircle2 size={16} className="text-green-400" />,
  error: <AlertCircle size={16} className="text-red-400" />,
  info: <Info size={16} className="text-blue-400" />,
  warning: <AlertTriangle size={16} className="text-amber-400" />,
};

const bgMap = {
  success: 'border-green-500/30 bg-green-900/30',
  error: 'border-red-500/30 bg-red-900/30',
  info: 'border-blue-500/30 bg-blue-900/30',
  warning: 'border-amber-500/30 bg-amber-900/30',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-xl backdrop-blur-sm animate-in slide-in-from-right ${bgMap[toast.type]}`}
        >
          <span className="shrink-0 mt-0.5">{iconMap[toast.type]}</span>
          <span className="text-sm text-white flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 text-surface-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
