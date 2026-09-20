import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  kind: ToastKind;
  message: string;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  resolve?: (value: boolean) => void;
}

interface FeedbackApi {
  notify: (message: string, kind?: ToastKind) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackApi | null>(null);

const KIND_STYLES: Record<ToastKind, { icon: React.ElementType; ring: string; iconColor: string }> = {
  success: { icon: CheckCircle2, ring: 'border-green-200 bg-green-50', iconColor: 'text-green-600' },
  error: { icon: XCircle, ring: 'border-rose-200 bg-rose-50', iconColor: 'text-rose-600' },
  warning: { icon: AlertTriangle, ring: 'border-amber-200 bg-amber-50', iconColor: 'text-amber-600' },
  info: { icon: Info, ring: 'border-sky-200 bg-sky-50', iconColor: 'text-sky-600' },
};

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>({ open: false, message: '' });

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setToasts((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...options, open: true, resolve });
    });
  }, []);

  const closeConfirm = (result: boolean) => {
    confirmState.resolve?.(result);
    setConfirmState((prev) => ({ ...prev, open: false, resolve: undefined }));
  };

  return (
    <FeedbackContext.Provider value={{ notify, confirm }}>
      {children}

      {/* Toast stack */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[min(92vw,22rem)]">
        {toasts.map((toast) => {
          const style = KIND_STYLES[toast.kind];
          const Icon = style.icon;
          return (
            <div
              key={toast.id}
              role="status"
              className={`flex items-start gap-3 rounded-xl border ${style.ring} px-4 py-3 shadow-lg shadow-black/5 animate-fade-in`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${style.iconColor}`} />
              <p className="text-sm text-stone-700 leading-snug flex-1">{toast.message}</p>
              <button
                onClick={() => dismiss(toast.id)}
                className="text-stone-400 hover:text-stone-600 transition cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirm dialog */}
      {confirmState.open && (
        <div className="fixed inset-0 z-[9998] flex min-h-full items-center justify-center overflow-y-auto bg-stone-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-fade-in">
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${confirmState.danger ? 'bg-rose-100' : 'bg-amber-100'}`}>
                  <AlertTriangle className={`w-5 h-5 ${confirmState.danger ? 'text-rose-600' : 'text-amber-600'}`} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-800">{confirmState.title || 'Please confirm'}</h3>
                  <p className="text-sm text-stone-500 mt-1 leading-snug">{confirmState.message}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 bg-stone-50 border-t border-stone-100">
              <button
                onClick={() => closeConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-stone-600 hover:bg-stone-200/60 transition cursor-pointer"
              >
                {confirmState.cancelLabel || 'Cancel'}
              </button>
              <button
                onClick={() => closeConfirm(true)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition cursor-pointer ${
                  confirmState.danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-saffron-600 hover:bg-saffron-700'
                }`}
              >
                {confirmState.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = (): FeedbackApi => {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return ctx;
};
