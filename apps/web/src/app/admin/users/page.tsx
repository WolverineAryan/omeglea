'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useToast } from '../../../components/ui/Toast';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { ArrowLeft, Search, ShieldCheck, UserX, CheckCircle, Ban } from 'lucide-react';
import { IUser } from '@omeglea/shared';

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<IUser[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const url = search ? `/admin/users?search=${encodeURIComponent(search)}` : '/admin/users';
      const res = await api.get(url);
      if (res.data?.success && res.data.data?.users) {
        setUsers(res.data.data.users);
      }
    } catch {
      // Fallback demo users
      setUsers([
        {
          id: 'u_1',
          displayName: 'Aryan Sharma',
          email: 'aryan@example.com',
          role: 'admin',
          accountStatus: 'active',
          ageVerificationStatus: 'verified_self_attested',
          emailVerified: true,
          creditBalance: 500,
          dailyCallsUsed: 5,
          dailyCallsLimit: 500,
          tier: 'vip',
          isPremium: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        },
        {
          id: 'u_2',
          displayName: 'Jessica_M',
          email: 'jessica@example.com',
          role: 'free',
          accountStatus: 'active',
          ageVerificationStatus: 'verified_self_attested',
          emailVerified: true,
          creditBalance: 25,
          dailyCallsUsed: 3,
          dailyCallsLimit: 10,
          tier: 'free',
          isPremium: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        },
        {
          id: 'u_3',
          displayName: 'SpamBot_404',
          email: 'spammer@bot.com',
          role: 'free',
          accountStatus: 'banned',
          ageVerificationStatus: 'unverified',
          emailVerified: false,
          creditBalance: 0,
          dailyCallsUsed: 10,
          dailyCallsLimit: 10,
          tier: 'free',
          isPremium: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (userId: string, status: 'active' | 'suspended' | 'banned') => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { status, reason: 'Admin action' });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, accountStatus: status } : u))
      );
      showToast(`User status updated to ${status}`, 'success');
    } catch {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, accountStatus: status } : u))
      );
      showToast(`Simulated: User status updated to ${status}`, 'info');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">User Accounts</h1>
          <p className="text-xs text-slate-400 mt-1">
            Search, inspect, and enforce moderation policies on registered accounts.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="p-0 border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/5">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Credits</th>
                <th className="p-4">Created</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition">
                  <td className="p-4">
                    <span className="font-bold text-white block">{u.displayName}</span>
                    <span className="text-[11px] text-slate-500">{u.email}</span>
                  </td>
                  <td className="p-4">
                    <Badge variant={u.role === 'admin' ? 'danger' : u.isPremium ? 'premium' : 'secondary'}>
                      {u.role.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        u.accountStatus === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : u.accountStatus === 'banned'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {u.accountStatus}
                    </span>
                  </td>
                  <td className="p-4 font-mono">{u.creditBalance}</td>
                  <td className="p-4 text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {u.accountStatus !== 'active' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateStatus(u.id, 'active')}
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        Restore
                      </Button>
                    )}
                    {u.accountStatus !== 'suspended' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateStatus(u.id, 'suspended')}
                        className="text-amber-400 hover:text-amber-300"
                      >
                        Suspend
                      </Button>
                    )}
                    {u.accountStatus !== 'banned' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateStatus(u.id, 'banned')}
                        className="text-rose-400 hover:text-rose-300"
                      >
                        Ban
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
