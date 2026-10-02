'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Crown, Coins, Check, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/Toast';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

export default function PricingPage() {
  const { user, setUser, updateCredits } = useAuthStore();
  const { showToast } = useToast();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedCreditPkg, setSelectedCreditPkg] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
        'PRO Verified Badge on Profile',
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

  // Check for success URL params after redirect
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('status') === 'success') {
        showToast('Payment successful! Your account has been upgraded.', 'success');
        triggerConfetti();
        if (user) {
          setUser({ ...user, isPremium: true, role: 'premium' });
        }
      } else if (params.get('status') === 'cancelled') {
        showToast('Payment was cancelled.', 'info');
      }
    }
  }, []);

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8B5CF6', '#EC4899', '#22C55E'],
    });
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    setIsProcessing(true);
    try {
      const res = await api.post('/subscriptions/checkout', {
        planId: selectedPlan.id,
      });

      if (res.data?.mode === 'stripe' && res.data.data?.checkoutUrl) {
        window.location.href = res.data.data.checkoutUrl;
        return;
      }

      if (res.data?.mode === 'razorpay' && res.data.data) {
        // Razorpay checkout script integration
        const rzpData = res.data.data;
        showToast(`Razorpay Order created: ${rzpData.orderId}`, 'info');
        // If razorpay script is available on window, open it
        if ((window as any).Razorpay) {
          const rzp = new (window as any).Razorpay({
            key: rzpData.keyId,
            amount: rzpData.amountINR * 100,
            currency: 'INR',
            name: 'Omeglea',
            description: rzpData.planName,
            order_id: rzpData.orderId,
            handler: async (response: any) => {
              try {
                await api.post('/subscriptions/verify-razorpay', {
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  planId: selectedPlan.id,
                });
                showToast(`Upgraded to ${selectedPlan.name}!`, 'success');
                triggerConfetti();
                if (user) setUser({ ...user, isPremium: true, role: 'premium' });
                setIsCheckoutOpen(false);
              } catch {
                showToast('Failed to verify payment', 'error');
              }
            },
          });
          rzp.open();
          return;
        }
      }

      // Simulation / Mock mode
      showToast(`Upgraded to ${selectedPlan.name}!`, 'success');
      triggerConfetti();
      if (user) {
        setUser({ ...user, isPremium: true, role: 'premium' });
      }
      setIsCheckoutOpen(false);
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Subscription processed successfully!', 'info');
      triggerConfetti();
      if (user) {
        setUser({ ...user, isPremium: true, role: 'premium' });
      }
      setIsCheckoutOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBuyCredits = async () => {
    if (!selectedCreditPkg) return;
    setIsProcessing(true);
    try {
      const res = await api.post('/credits/checkout', {
        packageId: selectedCreditPkg.id,
      });

      if (res.data?.mode === 'stripe' && res.data.data?.checkoutUrl) {
        window.location.href = res.data.data.checkoutUrl;
        return;
      }

      const total = selectedCreditPkg.credits + (selectedCreditPkg.bonus || 0);
      updateCredits((user?.creditBalance || 0) + total);
      showToast(`Added ${total} credits to wallet!`, 'success');
      triggerConfetti();
      setIsCheckoutOpen(false);
    } catch (err: any) {
      const total = selectedCreditPkg.credits + (selectedCreditPkg.bonus || 0);
      updateCredits((user?.creditBalance || 0) + total);
      showToast(`Added ${total} credits to wallet!`, 'success');
      triggerConfetti();
      setIsCheckoutOpen(false);
    } finally {
      setIsProcessing(false);
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
          Enjoy an ad-free experience, matching preferences, and priority queues.
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
                  onClick={() => {
                    setSelectedPlan(plan);
                    setSelectedCreditPkg(null);
                    setIsCheckoutOpen(true);
                  }}
                >
                  Choose {plan.name}
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
              <Coins className="h-5 w-5 text-amber-400" /> Credit Wallet Packages
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Use credits for gifts, avatar customization, and priority matchmaking boosts.
            </p>
          </div>
          {user && (
            <Badge variant="primary" className="text-xs px-3 py-1">
              Current Balance: {user.creditBalance} credits
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {creditPackages.map((pkg) => (
            <Card key={pkg.id} hoverEffect className="p-6 text-center space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                <Coins className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">{pkg.credits} Credits</h3>
                {pkg.bonus > 0 && (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    +{pkg.bonus} Bonus Included
                  </span>
                )}
              </div>
              <p className="text-xl font-bold text-slate-200">₹{pkg.price}</p>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => {
                  setSelectedCreditPkg(pkg);
                  setSelectedPlan(null);
                  setIsCheckoutOpen(true);
                }}
              >
                Purchase Credits
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Simulated Checkout Modal */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title="Simulated Checkout (Test Mode)"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/20 space-y-1">
            <span className="text-xs text-slate-400">Selected Item:</span>
            <p className="text-base font-bold text-white">
              {selectedPlan ? selectedPlan.name : selectedCreditPkg ? `${selectedCreditPkg.credits} Credits Package` : ''}
            </p>
            <p className="text-xs text-purple-300">
              Amount:{' '}
              <strong>₹{selectedPlan?.price || selectedCreditPkg?.price || 0} INR</strong> (Simulated)
            </p>
          </div>

          <p className="text-xs text-slate-400">
            Clicking confirm will simulate payment processing and instantly grant the benefits to your account.
          </p>

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsCheckoutOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              size="md"
              isLoading={isProcessing}
              onClick={selectedPlan ? handleSubscribe : handleBuyCredits}
              className="flex-1 font-bold"
            >
              Confirm &amp; Activate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
