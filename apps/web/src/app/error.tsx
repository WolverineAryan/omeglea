'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6 border border-white/10 shadow-2xl">
        <div className="h-16 w-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">Something Went Wrong</h1>
          <p className="text-xs text-slate-400">
            An unexpected error occurred while loading this page.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="md" onClick={() => reset()} className="flex-1 gap-1.5">
            <RotateCcw className="h-4 w-4" /> Try Again
          </Button>
          <Link href="/" className="flex-1">
            <Button variant="gradient" size="md" className="w-full gap-1.5">
              <Home className="h-4 w-4" /> Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
