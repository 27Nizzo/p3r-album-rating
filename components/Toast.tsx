'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-full px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`pointer-events-auto -skew-x-12 p-3.5 border-2 shadow-[0_0_20px_rgba(0,0,0,0.8)] flex items-start justify-between gap-3 ${
              toast.type === 'success'
                ? 'bg-persona-dark/95 border-persona-cyan text-persona-white shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                : toast.type === 'error'
                ? 'bg-persona-dark/95 border-red-500 text-persona-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                : 'bg-persona-dark/95 border-persona-blue text-persona-white shadow-[0_0_15px_rgba(0,102,255,0.3)]'
            }`}
          >
            <div className="skew-x-12 flex items-start gap-3">
              {toast.type === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-persona-cyan shrink-0 mt-0.5" />
              )}
              {toast.type === 'error' && (
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              )}
              {toast.type === 'info' && (
                <Info className="w-5 h-5 text-persona-cyan shrink-0 mt-0.5" />
              )}

              <div>
                <h4 className="font-black italic text-xs uppercase tracking-wider text-persona-cyan">
                  {toast.title}
                </h4>
                {toast.message && (
                  <p className="font-mono text-[11px] text-persona-white/80 uppercase mt-0.5">
                    {toast.message}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="skew-x-12 text-persona-cyan/60 hover:text-persona-cyan transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}