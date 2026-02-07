import React, { createContext, useContext, useState, ReactNode } from 'react';
import { X, CheckCircle, Info, Mail, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'email';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`
              pointer-events-auto
              flex items-start gap-3 px-4 py-3 rounded-lg shadow-xl text-white min-w-[300px] max-w-md 
              transform transition-all duration-300 ease-in-out animate-in slide-in-from-right-full fade-in
              ${toast.type === 'success' ? 'bg-green-600' : 
                toast.type === 'error' ? 'bg-red-600' : 
                toast.type === 'email' ? 'bg-indigo-600' : 'bg-blue-600'}
            `}
          >
            <div className="mt-0.5">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {toast.type === 'email' && <Mail className="w-5 h-5" />}
              {toast.type === 'info' && <Info className="w-5 h-5" />}
              {toast.type === 'error' && <AlertTriangle className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium leading-5">{toast.message}</p>
            </div>
            <button 
              onClick={() => removeToast(toast.id)} 
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
