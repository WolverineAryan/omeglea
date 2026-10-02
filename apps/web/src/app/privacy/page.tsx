import React from 'react';
import { Card } from '../../components/ui/Card';
import { Shield, Lock } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="space-y-4 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
          <Lock className="h-3.5 w-3.5" />
          Privacy &amp; Data Protection
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-400">Last updated: October 2026</p>
      </div>

      <Card className="p-8 space-y-6 text-slate-300 text-sm leading-relaxed border border-white/10">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">1. Video and Audio Data</h2>
          <p>
            Omeglea uses peer-to-peer WebRTC technology for real-time video conversations. We do NOT record, intercept, or store your live audio or video streams on our servers. Your video is streamed directly between you and your conversation partner.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">2. Information We Collect</h2>
          <p>
            When you create an account, we collect your display name, email address, password hash, and self-attested date of birth to enforce age limits. Profile details such as biography, interests, and languages are voluntarily provided and can be edited or removed at any time.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">3. How We Use Information</h2>
          <p>
            We use account data solely to authenticate users, facilitate interest-based matchmaking, enforce safety guidelines, and deliver requested services. We never sell your personal data to third parties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">4. Data Retention and Account Deletion</h2>
          <p>
            Ephemeral chat logs and matching sessions are automatically purged after retention periods to conserve space and maintain privacy. You may request full deletion of your account and personal profile at any time in Account Settings.
          </p>
        </section>
      </Card>
    </div>
  );
}
