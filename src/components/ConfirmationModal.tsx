import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, Trash2, HelpCircle, X, AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void; // Optional cancel, making it versatile for alert mode too!
  type?: 'danger' | 'warning' | 'info' | 'success';
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  type = 'info',
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 className="h-6 w-6 text-rose-600" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-amber-500" />;
      case 'success':
        return <AlertCircle className="h-6 w-6 text-emerald-600" />;
      case 'info':
      default:
        return <HelpCircle className="h-6 w-6 text-indigo-500" />;
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/10 focus:ring-rose-500';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/10 focus:ring-amber-400';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/10 focus:ring-emerald-500';
      case 'info':
      default:
        return 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10 focus:ring-indigo-500';
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-50';
      case 'warning':
        return 'bg-amber-50';
      case 'success':
        return 'bg-emerald-50';
      case 'info':
      default:
        return 'bg-indigo-50';
    }
  };

  const handleCancel = onCancel || onConfirm;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />

          {/* Dialog Container */}
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all my-8 w-full max-w-md p-6 border border-slate-100/80"
            >
              {/* Close pin */}
              <button
                type="button"
                onClick={handleCancel}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="flex items-start gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${getIconBg()}`}>
                  {getIcon()}
                </div>
                <div className="mt-0 text-left flex-1">
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {title}
                  </h3>
                  <div className="mt-2">
                    <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">
                      {message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action row */}
              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 text-xs">
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all cursor-pointer"
                  >
                    {cancelText}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onConfirm}
                  className={`w-full sm:w-auto px-4.5 py-2.5 rounded-lg font-semibold transition-all cursor-pointer ${getButtonClass()}`}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
