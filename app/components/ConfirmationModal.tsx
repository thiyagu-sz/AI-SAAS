'use client';

import React from 'react';
import { Trash2, X } from 'lucide-react';

interface ConfirmationModalProps {
  show: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmationModal({
  show,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmationModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-center w-14 h-14 mx-auto rounded-full mb-4 bg-red-100 text-red-600">
          <Trash2 className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">{title}</h3>
        <p className="text-center text-gray-600 mb-6 text-sm leading-relaxed whitespace-pre-wrap">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-xl font-bold transition-all border border-gray-200 hover:bg-gray-50 text-gray-700 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-xl font-bold transition-all bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
