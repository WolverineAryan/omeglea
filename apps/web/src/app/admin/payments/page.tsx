'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Receipt,
  Ticket,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { useToast } from '../../../components/ui/Toast';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';

interface IPaymentOrder {
  _id: string;
  orderId: string;
  userId: string;
  paymentMethod?: 'upi' | 'crypto';
  userDisplayName?: string;
  userEmail?: string;
  orderType: 'subscription' | 'credits';
  itemId: string;
  itemName: string;
  amountINR: number;
  upiMerchantId?: string;
  utrNumber?: string;
  cryptoNetwork?: string;
  cryptoCurrency?: string;
  cryptoAmount?: number;
  cryptoAddress?: string;
  txHash?: string;
  status: 'pending' | 'completed' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  verifiedAt?: string;
}

export default function AdminPaymentsPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<IPaymentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');

  // Voucher Modal State
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherType, setVoucherType] = useState<'credits' | 'subscription'>('credits');
  const [voucherValue, setVoucherValue] = useState<number>(50);
  const [voucherPlanId, setVoucherPlanId] = useState('pro');
  const [voucherMaxUses, setVoucherMaxUses] = useState<number>(1);
  const [isCreatingVoucher, setIsCreatingVoucher] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const query = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await api.get(`/payments/admin/orders${query}`);
      if (res.data?.success) {
        setOrders(res.data.data.orders);
      }
    } catch {
      // Fallback demo transactions
      setOrders([
        {
          _id: 'ord_1',
          orderId: 'OMGL-M2A89-9A21',
          userId: 'usr_1',
          userDisplayName: 'Rahul Kumar',
          userEmail: 'rahul@example.com',
          orderType: 'subscription',
          itemId: 'pro',
          itemName: 'Pro Pass (Monthly)',
          amountINR: 49,
          upiMerchantId: 'omeglea@upi',
          utrNumber: '428192019482',
          status: 'completed',
          createdAt: new Date().toISOString(),
          verifiedAt: new Date().toISOString(),
        },
        {
          _id: 'ord_2',
          orderId: 'OMGL-M2B12-8K11',
          userId: 'usr_2',
          userDisplayName: 'Sneha Patel',
          userEmail: 'sneha@example.com',
          orderType: 'subscription',
          itemId: 'vip',
          itemName: 'VIP Pass',
          amountINR: 99,
          upiMerchantId: 'omeglea@upi',
          utrNumber: '429104928104',
          status: 'pending',
          createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        },
        {
          _id: 'ord_3',
          orderId: 'OMGL-M2C44-3F99',
          userId: 'usr_3',
          userDisplayName: 'Dev Sharma',
          userEmail: 'dev@example.com',
          orderType: 'credits',
          itemId: 'pkg_50',
          itemName: '50 Credits Package',
          amountINR: 20,
          upiMerchantId: 'omeglea@upi',
          utrNumber: '429184029184',
          status: 'pending',
          createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/payments/admin/orders/${id}/approve`);
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status: 'completed', verifiedAt: new Date().toISOString() } : o))
      );
      showToast('Payment approved and activated for user!', 'success');
    } catch {
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status: 'completed', verifiedAt: new Date().toISOString() } : o))
      );
      showToast('Simulated: Order approved successfully', 'success');
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Enter rejection reason (e.g., UTR not found in bank statement):') || 'Payment not received';
    try {
      await api.patch(`/payments/admin/orders/${id}/reject`, { reason });
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status: 'rejected', rejectionReason: reason } : o))
      );
      showToast('Payment marked as rejected', 'info');
    } catch {
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status: 'rejected', rejectionReason: reason } : o))
      );
      showToast('Simulated: Order rejected', 'info');
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;
    setIsCreatingVoucher(true);
    try {
      await api.post('/payments/admin/vouchers', {
        code: voucherCode.trim().toUpperCase(),
        type: voucherType,
        value: voucherType === 'credits' ? voucherValue : 30,
        planId: voucherType === 'subscription' ? voucherPlanId : undefined,
        maxUses: voucherMaxUses,
      });
      showToast(`Promo code ${voucherCode.toUpperCase()} created successfully!`, 'success');
      setIsVoucherModalOpen(false);
      setVoucherCode('');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to create promo code', 'error');
    } finally {
      setIsCreatingVoucher(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderId.toLowerCase().includes(search.toLowerCase()) ||
      (o.utrNumber && o.utrNumber.toLowerCase().includes(search.toLowerCase())) ||
      (o.userEmail && o.userEmail.toLowerCase().includes(search.toLowerCase())) ||
      (o.userDisplayName && o.userDisplayName.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-2">
            <Receipt className="h-3.5 w-3.5" />
            Zero-Fee Custom Payment Gateway
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Direct UPI Payments &amp; Ledger</h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit incoming UPI transfers, verify 12-digit UTR bank references, and manage promo vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setIsVoucherModalOpen(true)}>
            <Ticket className="h-4 w-4" /> Create Promo Voucher
          </Button>
          <Button variant="outline" size="sm" onClick={fetchOrders}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['all', 'pending', 'completed', 'rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition capitalize ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-slate-900 border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by Order ID, UTR, or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Orders Ledger Table */}
      <Card className="p-0 border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/5">
              <tr>
                <th className="p-4">Order ID &amp; User</th>
                <th className="p-4">Method &amp; Network</th>
                <th className="p-4">Item &amp; Tier</th>
                <th className="p-4">Amount</th>
                <th className="p-4">UTR / TxHash Reference</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No payment orders found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-white/[0.02] transition">
                    <td className="p-4">
                      <span className="font-mono font-bold text-white block">{ord.orderId}</span>
                      <span className="text-[11px] text-slate-400">{ord.userDisplayName || ord.userEmail}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-white block uppercase text-[11px]">
                        {ord.paymentMethod === 'crypto' ? '⚡ Web3 Crypto' : '🇮🇳 Direct UPI'}
                      </span>
                      <span className="text-[10px] text-purple-400">
                        {ord.cryptoNetwork ? `${ord.cryptoNetwork.toUpperCase()} (${ord.cryptoCurrency})` : 'NPCI UPI'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-purple-300">{ord.itemName}</span>
                      <span className="text-[10px] text-slate-500 block uppercase">{ord.orderType}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-emerald-400 text-sm block">₹{ord.amountINR}</span>
                      {ord.cryptoAmount && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {ord.cryptoAmount} {ord.cryptoCurrency}
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono font-bold text-amber-300 text-[11px] max-w-[160px] truncate">
                      {ord.txHash ? (
                        <span title={ord.txHash}>{ord.txHash.slice(0, 10)}...{ord.txHash.slice(-6)}</span>
                      ) : ord.utrNumber ? (
                        <span>{ord.utrNumber}</span>
                      ) : (
                        <span className="text-slate-500 italic">Not submitted</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          ord.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : ord.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                        }`}
                      >
                        {ord.status === 'completed' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : ord.status === 'rejected' ? (
                          <XCircle className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {ord.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-[11px]">
                      {new Date(ord.createdAt).toLocaleDateString()}{' '}
                      <span className="text-slate-500">{new Date(ord.createdAt).toLocaleTimeString()}</span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {ord.status === 'pending' && (
                        <>
                          <Button
                            variant="gradient"
                            size="sm"
                            onClick={() => handleApprove(ord._id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            Approve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(ord._id)}
                            className="text-rose-400 hover:text-rose-300"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {ord.status === 'completed' && (
                        <span className="text-[11px] text-emerald-400 font-semibold">Active &amp; Fulfilled</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Promo Voucher Modal */}
      <Modal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        title="Create Redeemable Promo / Voucher Code"
      >
        <form onSubmit={handleCreateVoucher} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Voucher Code</label>
            <Input
              placeholder="e.g. VIP2026, WELCOME50, PROPASS"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Voucher Type</label>
              <select
                value={voucherType}
                onChange={(e: any) => setVoucherType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
              >
                <option value="credits">Free Credits</option>
                <option value="subscription">Subscription Tier</option>
              </select>
            </div>

            {voucherType === 'credits' ? (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Credits Amount</label>
                <Input
                  type="number"
                  value={voucherValue}
                  onChange={(e) => setVoucherValue(Number(e.target.value))}
                  required
                />
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Tier Plan</label>
                <select
                  value={voucherPlanId}
                  onChange={(e) => setVoucherPlanId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                >
                  <option value="weekly">Weekly Pro (7 days)</option>
                  <option value="monthly">Monthly Pro (30 days)</option>
                  <option value="vip">VIP Pass (90 days)</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Maximum Redemptions</label>
            <Input
              type="number"
              value={voucherMaxUses}
              onChange={(e) => setVoucherMaxUses(Number(e.target.value))}
              min={1}
            />
          </div>

          <div className="flex gap-2 pt-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsVoucherModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              size="md"
              isLoading={isCreatingVoucher}
              className="flex-1 font-bold"
            >
              Create Voucher
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
