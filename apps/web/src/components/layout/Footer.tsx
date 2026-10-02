import React from 'react';
import Link from 'next/link';
import { Video, ShieldCheck, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0B1020]/90 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
                <Video className="h-4 w-4 fill-white/20" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Omeglea</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Spontaneous, high-quality 1:1 video conversations and dating discovery for adults (18+). Meet new people safely and effortlessly.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Strictly Non-Explicit &amp; Moderated</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/chat" className="hover:text-purple-400 transition">
                  Random Video Chat
                </Link>
              </li>
              <li>
                <Link href="/discover" className="hover:text-purple-400 transition">
                  Social Discovery
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-purple-400 transition">
                  Omeglea Premium
                </Link>
              </li>
              <li>
                <Link href="/pricing#credits" className="hover:text-purple-400 transition">
                  Credit Wallet
                </Link>
              </li>
            </ul>
          </div>

          {/* Safety & Guidelines */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Safety &amp; Trust
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/safety" className="hover:text-purple-400 transition">
                  Safety Center
                </Link>
              </li>
              <li>
                <Link href="/community-guidelines" className="hover:text-purple-400 transition">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link href="/safety#reporting" className="hover:text-purple-400 transition">
                  How to Report
                </Link>
              </li>
              <li>
                <Link href="/safety#age-verification" className="hover:text-purple-400 transition">
                  Age Policy (18+)
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/terms" className="hover:text-purple-400 transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-purple-400 transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a href="mailto:support@omeglea.com" className="hover:text-purple-400 transition">
                  Contact Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Omeglea. All rights reserved. 18+ Adult Social Platform.</p>
          <p className="flex items-center gap-1">
            Built with modern WebRTC &amp; Next.js
          </p>
        </div>
      </div>
    </footer>
  );
}
