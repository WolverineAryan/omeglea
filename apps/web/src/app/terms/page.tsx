import React from 'react';
import { Card } from '../../components/ui/Card';
import { ShieldCheck, FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="space-y-4 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20">
          <FileText className="h-3.5 w-3.5" />
          Legal Agreement
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Terms of Service
        </h1>
        <p className="text-xs text-slate-400">Last updated: October 2026</p>
      </div>

      <Card className="p-8 space-y-6 text-slate-300 text-sm leading-relaxed border border-white/10">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">1. Age Requirement &amp; Eligibility</h2>
          <p>
            Omeglea is strictly intended for individuals who are at least eighteen (18) years of age or the age of legal majority in their jurisdiction. By registering, accessing, or using the Service, you represent and warrant that you meet this age requirement. Any use of the platform by minors is strictly forbidden and constitutes a violation of these Terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">2. Non-Explicit Platform Policy</h2>
          <p>
            Omeglea is a strictly non-explicit social networking platform. You agree not to broadcast, transmit, display, or share any sexually explicit content, nudity, pornography, acts of sexual violence, non-consensual imagery, or sexual solicitation. Violations result in immediate permanent account termination.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">3. User Conduct and Prohibited Activities</h2>
          <p>
            You agree not to engage in harassment, hate speech, bullying, stalking, threats, identity theft, commercial spamming, unauthorized recording or rebroadcasting of other users, or distribution of malicious software.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">4. Subscriptions and Virtual Credits</h2>
          <p>
            Omeglea offers both free access and optional paid subscriptions and credit packages. During development and testing phases, purchases operate under a simulation mode without financial charges. In commercial operation, all purchases are subject to the applicable cancellation and billing terms disclosed at checkout.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">5. Account Termination</h2>
          <p>
            Omeglea reserves the right to suspend or permanently ban any user account that violates these Terms or our Community Guidelines without prior notice.
          </p>
        </section>
      </Card>
    </div>
  );
}
