import React from 'react';
import Link from 'next/link';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, UserX, AlertOctagon, PhoneCall, HelpCircle } from 'lucide-react';

export default function SafetyCenterPage() {
  const tips = [
    {
      title: 'Keep Personal Information Private',
      description:
        'Never share your full legal name, home address, workplace, phone number, or financial details with strangers online.',
    },
    {
      title: 'Use the Next & Block Buttons Promptly',
      description:
        'If a conversation makes you uncomfortable at any point, click "Next" or tap "Block & Report" immediately.',
    },
    {
      title: 'Beware of Scams and External Links',
      description:
        'Do not open suspicious links or send money/gifts to individuals you have just met in video chat.',
    },
    {
      title: 'Report Any Inappropriate Behavior',
      description:
        'When you file a report, our moderation team reviews the incident history to take corrective action.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
          <ShieldCheck className="h-3.5 w-3.5" />
          Omeglea Safety Center
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          How We Protect You
        </h1>
        <p className="text-slate-400 text-sm">
          Everything you need to know about staying safe, protected, and in control during your video chat sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tips.map((t, i) => (
          <Card key={t.title} className="p-6 border border-white/10 space-y-2.5">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold text-sm">
              0{i + 1}
            </div>
            <h3 className="text-sm font-bold text-white">{t.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{t.description}</p>
          </Card>
        ))}
      </div>

      <Card className="p-8 border border-purple-500/30 bg-purple-950/20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Need to Report a Violation?</h2>
        <p className="text-xs text-slate-300 max-w-lg mx-auto">
          You can report any active conversation directly inside the video chat interface using the flag icon, or reach out to our team at support@omeglea.com.
        </p>
        <Link href="/chat">
          <Button variant="gradient" size="md">
            Go to Video Chat
          </Button>
        </Link>
      </Card>
    </div>
  );
}
