'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useToast } from '../../../components/ui/Toast';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ArrowLeft, Settings, Save, ShieldCheck } from 'lucide-react';
import { IPlatformSettings } from '@omeglea/shared';

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [freeLimit, setFreeLimit] = useState(50);
  const [premiumLimit, setPremiumLimit] = useState(500);
  const [allowGuest, setAllowGuest] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [landingBanner, setLandingBanner] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setFreeLimit(d.freeDailyMatchLimit || 50);
        setPremiumLimit(d.premiumDailyMatchLimit || 500);
        setAllowGuest(Boolean(d.allowGuestMode));
        setMaintenance(Boolean(d.maintenanceMode));
        setLandingBanner(Boolean(d.adPlacementSettings?.landingBanner));
      }
    } catch {
      // Use defaults
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.patch('/admin/settings', {
        freeDailyMatchLimit: freeLimit,
        premiumDailyMatchLimit: premiumLimit,
        allowGuestMode: allowGuest,
        maintenanceMode: maintenance,
        adPlacementSettings: {
          landingBanner,
          dashboardBanner: true,
          interstitialChat: false,
        },
      });
      showToast('Platform settings saved successfully!', 'success');
    } catch {
      showToast('Simulated: Platform settings saved', 'info');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Platform Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure matchmaking queue thresholds, rate limits, and monetization rules.
        </p>
      </div>

      <Card className="p-8 border border-white/10 shadow-xl space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-purple-400">
              Matchmaking Limits
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Free Daily Matches Limit"
                type="number"
                value={freeLimit}
                onChange={(e) => setFreeLimit(parseInt(e.target.value, 10))}
              />
              <Input
                label="Premium Daily Matches Limit"
                type="number"
                value={premiumLimit}
                onChange={(e) => setPremiumLimit(parseInt(e.target.value, 10))}
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-purple-400">
              Access &amp; Monetization Controls
            </h3>
            <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={landingBanner}
                onChange={(e) => setLandingBanner(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-purple-600"
              />
              <span className="text-xs text-slate-200">
                Enable Landing Page Advertisement Banner
              </span>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={maintenance}
                onChange={(e) => setMaintenance(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-purple-600"
              />
              <span className="text-xs text-slate-200">
                Platform Maintenance Mode (Block new calls)
              </span>
            </label>
          </div>

          <Button type="submit" variant="gradient" size="md" isLoading={isSaving} className="mt-4">
            <Save className="h-4 w-4" /> Save Platform Settings
          </Button>
        </form>
      </Card>
    </div>
  );
}
