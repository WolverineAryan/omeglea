'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useToast } from '../../../components/ui/Toast';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ArrowLeft, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { IReport } from '@omeglea/shared';

export default function AdminReportsPage() {
  const { showToast } = useToast();
  const [reports, setReports] = useState<IReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/reports');
      if (res.data?.success && res.data.data?.reports) {
        setReports(res.data.data.reports);
      }
    } catch {
      // Fallback demo reports
      setReports([
        {
          id: 'rep_1',
          reporterId: 'u_1',
          reporterName: 'Aryan',
          reportedUserId: 'u_3',
          reportedUserName: 'SpamBot_404',
          category: 'spam',
          description: 'User is continuously spamming external links in chat.',
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'rep_2',
          reporterId: 'u_2',
          reporterName: 'Jessica',
          reportedUserId: 'u_9',
          reportedUserName: 'TrollUser',
          category: 'harassment',
          description: 'Used offensive language and refused to stop.',
          status: 'under_review',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateReport = async (reportId: string, status: 'resolved' | 'rejected') => {
    try {
      await api.patch(`/admin/reports/${reportId}`, {
        status,
        resolution: `Marked as ${status} by admin`,
      });
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status, resolution: status } : r))
      );
      showToast(`Report marked as ${status}`, 'success');
    } catch {
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status, resolution: status } : r))
      );
      showToast(`Simulated: Report marked as ${status}`, 'info');
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

      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Moderation Reports</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review community reports for harassment, inappropriate behavior, or underage suspicion.
        </p>
      </div>

      <Card className="p-0 border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/5">
              <tr>
                <th className="p-4">Reported User</th>
                <th className="p-4">Reporter</th>
                <th className="p-4">Category</th>
                <th className="p-4">Description</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition">
                  <td className="p-4 font-bold text-rose-300">{r.reportedUserName || r.reportedUserId}</td>
                  <td className="p-4 text-slate-400">{r.reporterName || r.reporterId}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold text-[11px]">
                      {r.category.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 max-w-xs truncate text-slate-300">
                    {r.description || 'No description provided'}
                  </td>
                  <td className="p-4">
                    <span className="text-[11px] font-semibold text-amber-400">{r.status}</span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {r.status !== 'resolved' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateReport(r.id, 'resolved')}
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        Resolve
                      </Button>
                    )}
                    {r.status !== 'rejected' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateReport(r.id, 'rejected')}
                        className="text-slate-400 hover:text-slate-300"
                      >
                        Dismiss
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
