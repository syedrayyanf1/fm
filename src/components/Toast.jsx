import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function Toast() {
  const toastMessage = useGameStore(state => state.toastMessage);


  if (!toastMessage) return null;

  const { title, message, type } = toastMessage;

  return (
    <div className="fixed top-16 right-4 z-50 max-w-xs w-full pointer-events-none">
      <div className="bg-zinc-900/90 backdrop-blur-md border border-white/[0.08] shadow-xl p-3 rounded-lg flex items-start gap-2.5 text-xs">
        {type === 'error' ? (
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        )}
        <div>
          <h5 className="font-medium text-zinc-100">{title}</h5>
          {message && <p className="text-zinc-400 text-[11px] mt-0.5 leading-snug">{message}</p>}
        </div>
      </div>
    </div>
  );
}
