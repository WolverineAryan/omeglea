'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Video, Shield, Sparkles, Compass, Menu, X, Coins, Crown, User as UserIcon, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, checkAuth } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'Video Chat', href: '/chat', icon: Video, highlight: true },
    { name: 'Discover', href: '/discover', icon: Compass },
    { name: 'Premium', href: '/pricing', icon: Crown },
    { name: 'Safety', href: '/safety', icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#0B1020]/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform duration-200">
            <Video className="h-5 w-5 fill-white/20" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
              Omeglea
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30">
                18+
              </span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`h-4 w-4 ${link.highlight ? 'text-pink-400' : 'text-purple-400'}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* User / Auth Controls */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Credits counter */}
              <Link
                href="/pricing"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition"
              >
                <Coins className="h-3.5 w-3.5 text-amber-400" />
                <span>{user.creditBalance} credits</span>
              </Link>

              {user.isPremium && (
                <Badge variant="premium">
                  <Sparkles className="h-3 w-3" /> PRO
                </Badge>
              )}

              {user.role === 'admin' && (
                <Link href="/admin">
                  <Badge variant="danger">Admin</Badge>
                </Link>
              )}

              {/* Profile Avatar link */}
              <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition group">
                <Avatar name={user.displayName} size="sm" isOnline={true} />
                <span className="text-sm font-medium text-slate-200 group-hover:text-white">{user.displayName}</span>
              </Link>

              <Link href="/settings" title="Account Settings" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition">
                <UserIcon className="h-4 w-4" />
              </Link>

              <button
                onClick={logout}
                title="Log Out"
                className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="gradient" size="sm">
                  Join Free
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-300 hover:bg-white/5 transition"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#0B1020] px-4 pt-3 pb-6 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                    isActive ? 'bg-purple-600/20 text-purple-300' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-4 w-4 text-purple-400" />
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-white/5">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <Link href="/profile" className="flex items-center gap-2">
                    <Avatar name={user.displayName} size="sm" isOnline={true} />
                    <span className="text-sm font-medium text-white">{user.displayName}</span>
                  </Link>
                  <Badge variant="primary">{user.creditBalance} credits</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Link href="/profile" className="w-full">
                    <Button variant="secondary" size="sm" className="w-full">
                      Profile
                    </Button>
                  </Link>
                  <Link href="/settings" className="w-full">
                    <Button variant="secondary" size="sm" className="w-full">
                      Settings
                    </Button>
                  </Link>
                  <Button variant="danger" size="sm" onClick={logout}>
                    Log Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" className="w-full">
                  <Button variant="secondary" size="sm" className="w-full">
                    Log in
                  </Button>
                </Link>
                <Link href="/register" className="w-full">
                  <Button variant="gradient" size="sm" className="w-full">
                    Join Free
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
