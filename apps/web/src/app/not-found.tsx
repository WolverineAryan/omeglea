'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Video, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6 border border-white/10 shadow-2xl">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-purple-600/30">
          <Video className="h-8 w-8 fill-white/20" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white">404</h1>
          <h2 className="text-lg font-bold text-slate-200">Page Not Found</h2>
          <p className="text-xs text-slate-400">
            The page or room you are looking for does not exist or has moved.
          </p>
        </div>
        <Link href="/">
          <Button variant="gradient" size="md" className="w-full gap-2">
            <Home className="h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </Card>
    </div>
  );
}
