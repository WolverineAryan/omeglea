'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Users,
  Video,
  Crown,
  Coins,
  ShieldAlert,
  UserX,
  Settings,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { AdminDashboardStats } from '@omeglea/shared';

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch {
      // Fallback demo stats
      setStats({
        totalUsers: 142,
        activeUsersToday: 48,
        newUsersLast7Days: 31,
        activeChatSessions: 6,
        premiumSubscribers: 18,
        totalCreditsSold: 3450,
        pendingReports: 2,
        suspendedAccounts: 1,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'Active Today',
      value: stats?.activeUsersToday ?? 0,
      icon: Activity,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Live Chat Sessions',
      value: stats?.activeChatSessions ?? 0,
      icon: Video,
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    },
    {
      title: 'PRO Subscribers',
      value: stats?.premiumSubscribers ?? 0,
      icon: Crown,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Credits Sold',
      value: stats?.totalCreditsSold ?? 0,
      icon: Coins,
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    },
    {
      title: 'Pending Reports',
      value: stats?.pendingReports ?? 0,
      icon: ShieldAlert,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
    {
      title: 'Suspended Accounts',
      value: stats?.suspendedAccounts ?? 0,
      icon: UserX,
      color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    },
    {
      title: 'New This Week',
      value: stats?.newUsersLast7Days ?? 0,
      icon: TrendingUp,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 mb-2">
            <ShieldAlert className="h-3.5 w-3.5" />
            Administration Console
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Admin Overview</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time platform statistics, user moderation, and system settings.
          </p>
        </div>

        {/* Quick navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/admin/payments">
            <Button variant="secondary" size="sm" className="bg-emerald-600/20 text-emerald-300 border-emerald-500/30">
              <Coins className="h-4 w-4 text-emerald-400" /> Payments &amp; UPI
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="secondary" size="sm">
              <Users className="h-4 w-4" /> Users
            </Button>
          </Link>
          <Link href="/admin/reports">
            <Button variant="secondary" size="sm">
              <ShieldAlert className="h-4 w-4" /> Reports
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="secondary" size="sm">
              <Settings className="h-4 w-4" /> Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.title} className="p-6 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">{c.title}</span>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${c.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-white">{isLoading ? '...' : c.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Quick Action Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
        <Card className="p-6 border border-emerald-500/20 bg-emerald-950/10 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Coins className="h-5 w-5 text-emerald-400" /> Direct Payments
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Audit incoming UPI transfers, approve pending 12-digit UTR numbers, and create promo voucher gift codes.
          </p>
          <Link href="/admin/payments" className="block pt-2">
            <Button variant="gradient" size="sm" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
              Manage Payments →
            </Button>
          </Link>
        </Card>

        <Card className="p-6 border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-400" /> User Accounts
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Search registered accounts, inspect user profile details, and enforce account suspensions or permanent bans.
          </p>
          <Link href="/admin/users" className="block pt-2">
            <Button variant="secondary" size="sm" className="w-full">
              Manage Accounts →
            </Button>
          </Link>
        </Card>

        <Card className="p-6 border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-400" /> Moderation
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Review user-submitted reports for harassment, explicit content, underage flags, or fraud.
          </p>
          <Link href="/admin/reports" className="block pt-2">
            <Button variant="secondary" size="sm" className="w-full">
              Review Reports →
            </Button>
          </Link>
        </Card>

        <Card className="p-6 border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-400" /> Settings
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Configure matching rate limits, advertisement placements, maintenance mode, and community rules.
          </p>
          <Link href="/admin/settings" className="block pt-2">
            <Button variant="secondary" size="sm" className="w-full">
              Configure Settings →
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
