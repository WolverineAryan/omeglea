import React from 'react';
import { Card } from '../../components/ui/Card';
import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

export default function CommunityGuidelinesPage() {
  const allowed = [
    'Friendly, respectful, and consensual adult conversations',
    'Sharing hobbies, creative ideas, and everyday experiences',
    'Practicing new languages with native speakers worldwide',
    'Using reporting and blocking features to keep the community safe',
  ];

  const prohibited = [
    'Nudity, sexual activity, or sexually suggestive conduct',
    'Harassment, bullying, hate speech, or discrimination',
    'Underage usage — anyone under 18 is strictly barred',
    'Non-consensual recording, screenshots, or rebroadcasting',
    'Impersonation, scams, spamming, or fraudulent promotion',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="space-y-4 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-xs font-bold border border-pink-500/20">
          <ShieldAlert className="h-3.5 w-3.5" />
          Community Standards
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Community Guidelines
        </h1>
        <p className="text-slate-400 text-sm">
          Omeglea is committed to maintaining a safe, respectful, and non-explicit video community for adults.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="p-6 border border-emerald-500/30 bg-emerald-950/10">
          <h2 className="text-base font-bold text-emerald-400 flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5" /> What Is Encouraged
          </h2>
          <ul className="space-y-3 text-xs text-slate-300">
            {allowed.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6 border border-rose-500/30 bg-rose-950/10">
          <h2 className="text-base font-bold text-rose-400 flex items-center gap-2 mb-4">
            <XCircle className="h-5 w-5" /> What Is Strictly Prohibited
          </h2>
          <ul className="space-y-3 text-xs text-slate-300">
            {prohibited.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-6 text-xs text-slate-400 border border-white/10 space-y-2">
        <h3 className="font-bold text-white text-sm">Enforcement</h3>
        <p>
          Reports submitted by users are investigated promptly by our moderation team. Violators face immediate account suspension, device-level blacklisting, or permanent ban.
        </p>
      </Card>
    </div>
  );
}
