'use client';

import React from 'react';
import {
  Video,
  Sparkles,
  Compass,
  MessageSquare,
  Lock,
  Zap,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '../ui/Card';

export function FeaturesSection() {
  const features = [
    {
      icon: Video,
      title: 'Random 1:1 Video Chat',
      description: 'Ultra low-latency WebRTC video connections directly between peers with crisp HD quality.',
    },
    {
      icon: Sparkles,
      title: 'Interest-Based Matching',
      description: 'Find users who share your passions for music, travel, gaming, anime, tech, and more.',
    },
    {
      icon: Compass,
      title: 'Dating & Social Discovery',
      description: 'Browse eligible public profiles, send connection requests, and start meaningful 1:1 relationships.',
    },
    {
      icon: MessageSquare,
      title: 'Real-Time Text Messaging',
      description: 'Chat alongside video with instant message delivery, emojis, and typing indicators.',
    },
    {
      icon: Lock,
      title: 'Privacy & Control',
      description: 'No video recordings, customizable profile visibility, and unguessable session tokens.',
    },
    {
      icon: ShieldCheck,
      title: 'Active Moderation & Reporting',
      description: 'One-click user blocking, comprehensive report categories, and 24/7 moderation monitoring.',
    },
    {
      icon: Globe,
      title: 'Language Matching',
      description: 'Match with native speakers and language learners worldwide in English, Spanish, Hindi, and more.',
    },
    {
      icon: Zap,
      title: 'Premium Superpowers',
      description: 'Ad-free experience, unlimited queue priority, custom profile effects, and VIP badges.',
    },
  ];

  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
            Engineered For Connection
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Features Designed for Spontaneous Conversations
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Every feature is crafted to make your conversations effortless, engaging, and safe.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} hoverEffect className="p-6">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
