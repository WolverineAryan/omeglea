'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, UserX, AlertTriangle, EyeOff, CheckCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export function SafetySection() {
  const safetyRules = [
    {
      icon: ShieldCheck,
      title: '18+ Adult-Only Platform',
      description:
        'Omeglea is strictly for adults aged 18 and older. Underage users are strictly prohibited and permanently banned upon discovery.',
    },
    {
      icon: AlertTriangle,
      title: 'Strictly Non-Explicit',
      description:
        'Sexual acts, nudity, harassment, and explicit content are strictly prohibited. Zero tolerance is enforced.',
    },
    {
      icon: UserX,
      title: 'Instant Block & Skip',
      description:
        'Block anyone immediately with one tap. Blocked users can never be matched or message you again.',
    },
    {
      icon: EyeOff,
      title: 'Privacy Guaranteed',
      description:
        'We never record or store video calls. Your IP address and private details are safeguarded.',
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl glass-panel p-8 sm:p-12 lg:p-16 border border-white/10 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Safety First
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Your Safety &amp; Comfort are Our Top Priorities
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                We believe social discovery should be fun, respectful, and safe. We provide industry-leading moderation tools to ensure a welcoming environment for all adults.
              </p>

              <div className="pt-2">
                <Link href="/safety">
                  <Button variant="secondary" size="md">
                    Visit the Safety Center →
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {safetyRules.map((rule) => {
                const Icon = rule.icon;
                return (
                  <div
                    key={rule.title}
                    className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2.5"
                  >
                    <div className="h-9 w-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white">{rule.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{rule.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
