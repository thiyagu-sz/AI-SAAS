'use client';

import React from 'react';
import { CheckCircle2, X, AlertCircle } from 'lucide-react';

interface StatusModalProps {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  onClose: () => void;
}

export default function StatusModal({ show, type, title, message, onClose }: StatusModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <div className={`flex items-center justify-center w-14 h-14 mx-auto rounded-full mb-4 ${
          type === 'success' ? 'bg-green-100 text-green-600' :
          type === 'error' ? 'bg-red-100 text-red-600' :
          type === 'warning' ? 'bg-amber-100 text-amber-600' :
          'bg-blue-100 text-blue-600'
        }`}>
          {type === 'success' ? <CheckCircle2 className="w-8 h-8" /> :
           type === 'error' ? <X className="w-8 h-8" /> :
           <AlertCircle className="w-8 h-8" />}
        </div>
        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">{title}</h3>
        <p className="text-center text-gray-600 mb-6 text-sm leading-relaxed whitespace-pre-wrap">
          {message}
        </p>
        <button
          onClick={onClose}
          className={`w-full py-3 px-4 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] ${
            type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-200' :
            type === 'error' ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200' :
            type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200' :
            'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
          }`}
        >
          OK
        </button>
      </div>
    </div>
  );
}
