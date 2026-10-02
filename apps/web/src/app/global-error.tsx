'use client';

import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B1020] text-[#F8FAFC] min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 text-center space-y-6 bg-slate-900 rounded-2xl border border-white/10 shadow-2xl">
          <div className="h-16 w-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white">Application Error</h1>
            <p className="text-xs text-slate-400">
              A critical error occurred. Please reload the application.
            </p>
          </div>
          <button
            onClick={() => reset()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4" /> Reload Omeglea
          </button>
        </div>
      </body>
    </html>
  );
}
