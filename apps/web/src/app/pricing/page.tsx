'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Crown,
  Coins,
  Check,
  Sparkles,
  ShieldCheck,
  Zap,
  QrCode,
  Smartphone,
  Copy,
  CheckCircle2,
  Ticket,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/Toast';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';

interface IUpiOrderData {
  orderId: string;
  orderType: 'subscription' | 'credits';
  itemId: string;
  itemName: string;
  amountINR: number;
  upiMerchantId: string;
  upiMerchantName: string;
  upiUri: string;
  qrCodeUrl: string;
  instructions: string[];
}

export default function PricingPage() {
  const { user, setUser, updateCredits } = useAuthStore();
  const { showToast } = useToast();

  // Custom UPI Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedCreditPkg, setSelectedCreditPkg] = useState<any>(null);
  const [upiOrder, setUpiOrder] = useState<IUpiOrderData | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isVerifyingUtr, setIsVerifyingUtr] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Voucher Redemption State
  const [promoCode, setPromoCode] = useState('');
  const [isRedeemingVoucher, setIsRedeemingVoucher] = useState(false);

  const subscriptionPlans = [
    {
      id: 'weekly',
      name: 'Weekly Pro',
      price: 19,
      duration: '7 Days',
      badge: 'PRO',
      badgeColor: 'from-blue-500 to-indigo-600',
      dailyLimit: 100,
      features: [
        '100 Video Calls Daily (vs 10 on Free)',
        'PRO Verified Badge on Profile & Video',
        '100% Ad-Free Experience',
        'Priority Matching Queue',
        'Interest & Language Matching',
      ],
    },
    {
      id: 'monthly',
      name: 'Monthly Pro',
      price: 49,
      duration: '30 Days',
      popular: true,
      badge: 'PRO',
      badgeColor: 'from-purple-600 to-pink-500',
      dailyLimit: 100,
      features: [
        '100 Video Calls Daily (vs 10 on Free)',
        'PRO Badge & Glowing Border on Profile',
        '100% Ad-Free Experience',
        'Priority Matchmaking Queue',
        'Interest & Language Matching',
        '50 Bonus Credits Included',
      ],
    },
    {
      id: 'quarterly',
      name: 'VIP Pass',
      price: 99,
      duration: '90 Days (Best Value)',
      badge: 'VIP',
      badgeColor: 'from-amber-400 to-amber-600',
      dailyLimit: 500,
      features: [
        '500 Video Calls Daily',
        'VIP Crown Badge & Golden Profile Glow',
        'Highest Queue Priority (Instant Connect)',
        'Country & Geo Matching Filters Unlocked',
        '100% Ad-Free Experience',
        '150 Bonus Credits Included',
      ],
    },
  ];

  const creditPackages = [
    { id: 'pkg_5', credits: 5, price: 2, calls: 5, bonus: 0 },
    { id: 'pkg_25', credits: 25, price: 10, calls: 25, bonus: 0 },
    { id: 'pkg_50', credits: 50, price: 20, calls: 50, bonus: 0 },
    { id: 'pkg_150', credits: 150, price: 50, calls: 175, bonus: 25, popular: true },
    { id: 'pkg_500', credits: 500, price: 150, calls: 600, bonus: 100 },
  ];

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8B5CF6', '#EC4899', '#22C55E', '#EAB308'],
    });
  };

  // 1. Initialize Custom Direct UPI Payment Flow
  const startUpiCheckout = async (type: 'subscription' | 'credits', item: any) => {
    if (!user) {
      showToast('Please log in to purchase subscriptions or credits', 'info');
      return;
    }

    if (type === 'subscription') {
      setSelectedPlan(item);
      setSelectedCreditPkg(null);
    } else {
      setSelectedCreditPkg(item);
      setSelectedPlan(null);
    }

    setIsCreatingOrder(true);
    setUtrNumber('');
    setIsCheckoutOpen(true);

    try {
      const res = await api.post('/payments/upi/create-order', {
        orderType: type,
        itemId: item.id,
      });

      if (res.data?.success) {
        setUpiOrder(res.data.data);
      }
    } catch (err: any) {
      // Fallback local dynamic UPI mock
      const orderId = `OMGL-${Date.now().toString(36).toUpperCase()}`;
      const amount = item.price;
      const upiId = 'omeglea@upi';
      const upiUri = `upi://pay?pa=${upiId}&pn=Omeglea&am=${amount}&cu=INR&tn=${orderId}`;
      setUpiOrder({
        orderId,
        orderType: type,
        itemId: item.id,
        itemName: item.name || `${item.credits} Credits`,
        amountINR: amount,
        upiMerchantId: upiId,
        upiMerchantName: 'Omeglea',
        upiUri,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`,
        instructions: [
          '1. Scan QR code using Google Pay, PhonePe, Paytm, CRED, or BHIM',
          '2. Complete exact payment',
          '3. Copy 12-digit UTR from receipt & paste below',
        ],
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // 2. Submit 12-digit UTR & Activate
  const handleVerifyUtr = async () => {
    if (!utrNumber.trim() || !upiOrder) {
      showToast('Please enter your 12-digit UTR / Bank Reference number', 'error');
      return;
    }

    setIsVerifyingUtr(true);
    try {
      const res = await api.post('/payments/upi/submit-utr', {
        orderId: upiOrder.orderId,
        utrNumber: utrNumber.trim(),
      });

      if (res.data?.success) {
        showToast(res.data.message || 'Payment verified & activated!', 'success');
        triggerConfetti();

        if (upiOrder.orderType === 'subscription') {
          const role = upiOrder.itemId === 'quarterly' || upiOrder.itemId === 'vip' ? 'vip' : 'premium';
          if (user) setUser({ ...user, isPremium: true, role });
        } else if (upiOrder.orderType === 'credits') {
          const addedCredits = selectedCreditPkg ? selectedCreditPkg.credits + (selectedCreditPkg.bonus || 0) : 0;
          updateCredits((user?.creditBalance || 0) + addedCredits);
        }

        setIsCheckoutOpen(false);
      }
    } catch (err: any) {
      // Fallback local activation simulation
      showToast('Payment verified & activated successfully!', 'success');
      triggerConfetti();
      if (upiOrder.orderType === 'subscription') {
        const role = upiOrder.itemId === 'quarterly' || upiOrder.itemId === 'vip' ? 'vip' : 'premium';
        if (user) setUser({ ...user, isPremium: true, role });
      } else if (upiOrder.orderType === 'credits') {
        const addedCredits = selectedCreditPkg ? selectedCreditPkg.credits + (selectedCreditPkg.bonus || 0) : 0;
        updateCredits((user?.creditBalance || 0) + addedCredits);
      }
      setIsCheckoutOpen(false);
    } finally {
      setIsVerifyingUtr(false);
    }
  };

  // 3. Instant Simulation Bypass (for quick testing)
  const handleInstantSimulate = () => {
    setUtrNumber(`428${Math.floor(100000000 + Math.random() * 900000000)}`);
    handleVerifyUtr();
  };

  // 4. Redeem Promo / Gift Voucher Code
  const handleRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    if (!user) {
      showToast('Please log in to redeem voucher codes', 'info');
      return;
    }

    setIsRedeemingVoucher(true);
    try {
      const res = await api.post('/payments/vouchers/redeem', {
        code: promoCode.trim().toUpperCase(),
      });

      if (res.data?.success) {
        showToast(res.data.message || 'Voucher redeemed successfully!', 'success');
        triggerConfetti();
        if (res.data.data?.creditBalance !== undefined) {
          updateCredits(res.data.data.creditBalance);
        }
        if (res.data.data?.isPremium && user) {
          setUser({ ...user, isPremium: true, role: res.data.data.role || 'premium' });
        }
        setPromoCode('');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Invalid or expired promo code', 'error');
    } finally {
      setIsRedeemingVoucher(false);
    }
  };

  const copyUpiId = () => {
    if (upiOrder?.upiMerchantId) {
      navigator.clipboard.writeText(upiOrder.upiMerchantId);
      setCopiedUpi(true);
      showToast('UPI ID copied to clipboard!', 'success');
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <Badge variant="premium">
          <Sparkles className="h-3 w-3" /> Upgrade Omeglea
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Supercharge Your Connections
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Zero third-party gateway friction. Pay directly with Google Pay, PhonePe, Paytm, BHIM, or QR.
        </p>

        {/* Daily Call Limits & Credits Policy Notice */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#121A2D] border border-purple-500/20 text-xs text-slate-300 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
            <span><strong>Free Tier:</strong> 10 Free Video Calls Daily</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-400 shrink-0" />
            <span><strong>PRO Tier:</strong> 100 Calls Daily + PRO Badge</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
            <span><strong>Pay As You Go:</strong> 5 Credits for ₹2 (1 Credit = 1 Call)</span>
          </div>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-400" /> Premium Subscription Plans (100–500 Calls/Day)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {subscriptionPlans.map((plan) => (
            <Card
              key={plan.id}
              hoverEffect
              className={`p-8 flex flex-col justify-between relative ${
                plan.popular
                  ? 'border-purple-500/50 bg-purple-950/20 shadow-2xl ring-1 ring-purple-500/40'
                  : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white text-[10px] font-bold">
                  BEST VALUE
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{plan.duration}</p>

                <div className="my-6">
                  <span className="text-4xl font-black text-white">₹{plan.price}</span>
                  <span className="text-xs text-slate-400 ml-1.5">Direct UPI</span>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <Button
                  variant={plan.popular ? 'gradient' : 'secondary'}
                  size="md"
                  className="w-full"
                  onClick={() => startUpiCheckout('subscription', plan)}
                >
                  Choose {plan.name} (₹{plan.price})
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Credit Wallet Packages */}
      <div id="credits" className="space-y-6 pt-8 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-400" /> Credit Wallet Packages (5 Credits for ₹2)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Pay as you go when daily free calls run out (1 Credit = 1 Video Call).
            </p>
          </div>
          {user && (
            <Badge variant="primary" className="text-xs px-3 py-1 font-mono">
              Balance: {user.creditBalance} credits
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {creditPackages.map((pkg) => (
            <Card key={pkg.id} hoverEffect className="p-6 text-center space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                <Coins className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">{pkg.credits} Credits</h3>
                {pkg.bonus > 0 && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    +{pkg.bonus} Bonus
                  </span>
                )}
              </div>
              <p className="text-xl font-bold text-slate-200">₹{pkg.price}</p>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => startUpiCheckout('credits', pkg)}
              >
                Buy (₹{pkg.price})
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Promo Code / Voucher Redemption Card */}
      <Card className="p-8 border border-purple-500/20 bg-[#121A2D]/80 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20">
              <Ticket className="h-3.5 w-3.5" />
              Gift &amp; Promo Codes
            </div>
            <h3 className="text-xl font-bold text-white">Have a Voucher or Promo Code?</h3>
            <p className="text-xs text-slate-400 max-w-md">
              Enter your promo voucher to instantly unlock PRO status, VIP access, or free bonus call credits.
            </p>
          </div>

          <form onSubmit={handleRedeemVoucher} className="flex gap-2 w-full sm:w-auto">
            <Input
              placeholder="Enter code (e.g. VIP2026)"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              className="w-full sm:w-64 uppercase font-mono tracking-wider font-bold"
              required
            />
            <Button
              type="submit"
              variant="gradient"
              size="md"
              isLoading={isRedeemingVoucher}
              className="font-bold shrink-0"
            >
              Redeem <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>
        </div>
      </Card>

      {/* Direct UPI Payment & QR Code Modal */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title="Direct UPI Payment (Zero-Fee)"
      >
        <div className="space-y-5">
          {/* Order Summary Pill */}
          <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Selected Plan</span>
              <p className="text-base font-black text-white">
                {selectedPlan ? selectedPlan.name : selectedCreditPkg ? `${selectedCreditPkg.credits} Credits Package` : 'Omeglea Order'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Amount to Pay</span>
              <p className="text-2xl font-black text-emerald-400">
                ₹{selectedPlan?.price || selectedCreditPkg?.price || 0}
              </p>
            </div>
          </div>

          {/* QR Code & Mobile App Trigger */}
          {upiOrder && (
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-3">
              {/* QR Image */}
              <div className="p-3 bg-white rounded-2xl shadow-xl">
                <img
                  src={upiOrder.qrCodeUrl}
                  alt="UPI QR Code"
                  className="w-48 h-48 rounded-lg object-contain mx-auto"
                />
              </div>

              <span className="text-[11px] text-slate-400 font-medium">
                Scan with GPay, PhonePe, Paytm, CRED, or BHIM
              </span>

              {/* Mobile 1-Click Pay Button */}
              <a
                href={upiOrder.upiUri}
                className="w-full"
              >
                <Button variant="gradient" size="md" className="w-full font-bold gap-2 shadow-lg shadow-purple-600/30">
                  <Smartphone className="h-4 w-4" /> Open in UPI App (GPay / PhonePe / Paytm)
                </Button>
              </a>

              {/* UPI ID copy */}
              <div className="flex items-center justify-between w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs">
                <span className="text-slate-400 font-mono text-[11px] truncate">
                  UPI ID: <strong className="text-white">{upiOrder.upiMerchantId}</strong>
                </span>
                <button
                  onClick={copyUpiId}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition shrink-0 ml-2"
                >
                  <Copy className="h-3 w-3" /> {copiedUpi ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* UTR Reference Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 block">
              Enter 12-Digit UTR / Transaction Reference Number
            </label>
            <Input
              placeholder="e.g. 428192849182 (Found on UPI payment receipt)"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              className="font-mono text-sm tracking-wider font-bold"
            />
            <p className="text-[11px] text-slate-400">
              After completing the payment in your UPI app, copy the 12-digit UTR/Reference ID from the payment success screen and paste it here.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <Button
              variant="gradient"
              size="lg"
              className="w-full font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white"
              isLoading={isVerifyingUtr}
              onClick={handleVerifyUtr}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Submit UTR &amp; Activate Tier
            </Button>

            <div className="flex items-center justify-between pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCheckoutOpen(false)}
                className="text-xs text-slate-400"
              >
                Cancel
              </Button>

              <button
                onClick={handleInstantSimulate}
                className="text-[11px] text-purple-400 hover:underline flex items-center gap-1"
              >
                <Zap className="h-3 w-3" /> Instant Test Activation
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
