'use client';

import React from 'react';
import { UserPlus, Sliders, Video } from 'lucide-react';
import { Card } from '../ui/Card';

export function HowItWorks() {
  const steps = [
    {
      step: '01',
      icon: UserPlus,
      title: 'Join Omeglea in Seconds',
      description:
        'Create a free account or sign in quickly with self-attested 18+ age verification.',
    },
    {
      step: '02',
      icon: Sliders,
      title: 'Set Your Interests',
      description:
        'Choose your favorite topics, preferred languages, and optional location matching filters.',
    },
    {
      step: '03',
      icon: Video,
      title: 'Connect Instantly via Video',
      description:
        'Get matched in real time with eligible adults. Enjoy seamless video and text conversation with easy skip controls.',
    },
  ];

  return (
    <section className="py-20 bg-[#0B1020]/60 relative border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
            Simple 3-Step Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How Omeglea Works
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            No endless swiping or confusing questionnaires. Connect directly with people who share your vibe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, index) => {
            const Icon = s.icon;
            return (
              <Card key={s.step} hoverEffect className="p-8 relative overflow-hidden group">
                <div className="absolute top-4 right-4 text-4xl font-black text-white/5 group-hover:text-purple-500/10 transition-colors">
                  {s.step}
                </div>
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-pink-500/30 border border-purple-500/30 flex items-center justify-center text-purple-300 mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
