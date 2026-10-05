'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function AdminModal({ open, onClose, title, subtitle, children, maxWidth = 'max-w-md' }: AdminModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18 }}
            className={`w-full ${maxWidth} max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-xl`}
            style={{ background: 'var(--a-surface)', color: 'var(--a-fg)', border: '1px solid var(--a-line)', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}
          >
            <div
              className="sticky top-0 z-10 flex items-start gap-3 px-5 py-4"
              style={{ background: 'var(--a-surface)', borderBottom: '1px solid var(--a-line)' }}
            >
              <div className="min-w-0 flex-1">
                <div className="admin-display text-lg font-bold">{title}</div>
                {subtitle && <div className="text-sm" style={{ color: 'var(--a-muted)' }}>{subtitle}</div>}
              </div>
              <button type="button" onClick={onClose} aria-label="Cerrar" className="admin-icon-btn shrink-0">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 py-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
