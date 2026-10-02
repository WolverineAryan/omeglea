'use client';

import React from 'react';
import Link from 'next/link';
import { Crown, Check, Sparkles, Zap, Shield } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export function PremiumSection() {
  const plans = [
    {
      name: 'Free Plan',
      price: '₹0',
      period: 'Forever free',
      description: 'Essential random video chat and basic social discovery for everyone.',
      features: [
        'Random 1:1 video calls',
        'Real-time text chat in calls',
        'Basic profile & interests',
        'Full safety & blocking tools',
        'Access to community guidelines',
      ],
      cta: 'Get Started Free',
      href: '/register',
      popular: false,
    },
    {
      name: 'Omeglea Pro (Monthly)',
      price: '₹199',
      period: 'per month',
      description: 'Complete freedom with interest filters, ad-free calling, and priority queue.',
      features: [
        '100% Ad-free experience',
        'Expanded interest & language filters',
        'Unlimited video connections',
        'Pro profile badge & glow effect',
        'Priority matchmaking queue',
        '100 bonus credits included',
      ],
      cta: 'Upgrade to Pro',
      href: '/pricing',
      popular: true,
    },
    {
      name: 'VIP Pass (Quarterly)',
      price: '₹499',
      period: 'per 3 months (Save 16%)',
      description: 'Ultimate experience with highest priority and 300 bonus credits.',
      features: [
        'Everything in Monthly Pro',
        'Country & location matching filters',
        'VIP status badge on profile',
        'Highest priority queue',
        '300 bonus credits included',
        'Priority support',
      ],
      cta: 'Get VIP Pass',
      href: '/pricing',
      popular: false,
    },
  ];

  return (
    <section className="py-24 bg-[#0B1020]/80 relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-xs font-bold border border-pink-500/20">
            <Crown className="h-3.5 w-3.5" />
            Transparent Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Choose the Perfect Membership
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Free forever for essential video chat. Upgrade whenever you want advanced filters and an ad-free experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((p) => (
            <Card
              key={p.name}
              hoverEffect
              className={`p-8 flex flex-col justify-between relative ${
                p.popular
                  ? 'border-purple-500/50 bg-purple-950/20 shadow-2xl shadow-purple-600/15 ring-1 ring-purple-500/40'
                  : ''
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white text-[11px] font-bold tracking-wide shadow-md">
                  MOST POPULAR
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-white">{p.name}</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{p.description}</p>

                <div className="mt-6 mb-6">
                  <span className="text-4xl font-black text-white">{p.price}</span>
                  <span className="text-xs text-slate-400 ml-2">{p.period}</span>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                  {p.features.map((f) => (
                    <div key={f} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Link href={p.href} className="w-full block">
                  <Button
                    variant={p.popular ? 'gradient' : 'secondary'}
                    size="md"
                    className="w-full"
                  >
                    {p.cta}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
