'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Video, Sparkles, Shield, ArrowRight, Play, Lock, UserCheck } from 'lucide-react';
import { Button } from '../ui/Button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28">
      {/* Background glow accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/15 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-pink-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-purple-300 backdrop-blur-md"
            >
              <Sparkles className="h-3.5 w-3.5 text-pink-400" />
              <span>Next-Gen Omegle &amp; OmeTV Alternative (18+)</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]"
            >
              Talk to Strangers. <br />
              <span className="gradient-text">Instant Video &amp; Text.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            >
              Experience spontaneous 1:1 video conversations with real adults. Login is required to eliminate bots and ensure a strictly verified 18+ respectful community.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-1"
            >
              <Link href="/chat" className="w-full sm:w-auto">
                <Button variant="gradient" size="lg" className="w-full sm:w-auto shadow-xl shadow-purple-600/30 gap-2 font-bold">
                  <Play className="h-4 w-4 fill-white" />
                  Start Video Chat
                </Button>
              </Link>
              <Link href="/register" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto gap-2 font-semibold">
                  <UserCheck className="h-4 w-4 text-pink-400" />
                  Create Free Account (18+)
                </Button>
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-6 border-t border-white/5 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-slate-400"
            >
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 font-bold text-[10px]">
                  18+
                </div>
                <span>Login Required (Anti-Bot)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Shield className="h-3.5 w-3.5" />
                </div>
                <span>Strict Non-Explicit Safety</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Video className="h-3.5 w-3.5" />
                </div>
                <span>Zero Call Recording</span>
              </div>
            </motion.div>
          </div>

          {/* Omegle / OmeTV Split Screen Interactive Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative mx-auto max-w-lg rounded-3xl glass-panel p-3 shadow-2xl border border-white/15 bg-[#0e1628]/80">
              {/* Dual Screen Display */}
              <div className="grid grid-cols-2 gap-2 aspect-[16/10] rounded-2xl overflow-hidden bg-black p-1">
                {/* Left Screen: You */}
                <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-white/10">
                  <img
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80"
                    alt="You"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[9px] font-bold text-white flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    You
                  </div>
                </div>

                {/* Right Screen: Stranger */}
                <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-white/10">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
                    alt="Stranger"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[9px] font-bold text-pink-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-pink-500 animate-pulse" />
                    Stranger
                  </div>
                </div>
              </div>

              {/* Omegle-style Action Bar in Mockup */}
              <div className="mt-2.5 flex items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-white/5">
                <div className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold text-[10px] uppercase flex flex-col items-center leading-none">
                  <span>STOP</span>
                  <span className="text-[7px] opacity-70">ESC</span>
                </div>
                <div className="flex-1 text-[10px] text-slate-300 font-mono px-2 truncate">
                  <span className="text-blue-400 font-bold">You: </span>
                  <span>hey, how are you?</span>
                </div>
                <Link href="/chat">
                  <span className="text-[10px] font-bold text-purple-400 hover:text-purple-300 transition px-2">
                    Connect →
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
