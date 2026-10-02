import React from 'react';
import { cn } from '../../lib/utils';

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  className?: string;
}

export function Avatar({ src, name = 'User', size = 'md', isOnline, className }: AvatarProps) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-20 w-20 text-xl font-bold',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative inline-block">
      <div
        className={cn(
          'rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-tr from-purple-700 to-pink-600 text-white font-semibold border-2 border-slate-800 shadow-md',
          sizes[size],
          className
        )}
      >
        {src ? (
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {isOnline !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-slate-900',
            size === 'sm' ? 'h-2 w-2' : 'h-3 w-3',
            isOnline ? 'bg-emerald-500' : 'bg-slate-500'
          )}
        />
      )}
    </div>
  );
}
