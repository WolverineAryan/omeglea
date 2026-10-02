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
      name: 'Weekly Pass',
      price: 99,
      duration: '7 Days',
      features: [
        '100% Ad-free experience',
        'Interest-based matching priority',
        'Unlimited video connections',
        'PRO badge on profile',
      ],
    },
    {
      id: 'monthly',
      name: 'Monthly Pro',
      price: 199,
      duration: '30 Days',
      popular: true,
      features: [
        '100% Ad-free experience',
        'Interest & Language matching filters',
        'Priority queue placement',
        'PRO badge & glowing avatar border',
        '100 bonus credits included',
      ],
    },
    {
      id: 'quarterly',
      name: 'VIP 3-Month Pass',
      price: 499,
      duration: '90 Days (Save 16%)',
      features: [
        'All Monthly Pro features',
        'Country & Geo-preference matching',
        'VIP status badge on profile',
        'Highest matchmaking queue priority',
        '300 bonus credits included',
      ],
    },
  ];

  const creditPackages = [
    { id: 'pkg_50', credits: 50, price: 49, bonus: 0 },
    { id: 'pkg_150', credits: 150, price: 129, bonus: 20, popular: true },
    { id: 'pkg_500', credits: 500, price: 399, bonus: 100 },
  ];

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

      if (res.data?.success) {
        showToast(`Upgraded to ${selectedPlan.name}! (Simulated Purchase)`, 'success');
        triggerConfetti();
        if (user) {
          setUser({ ...user, isPremium: true, role: 'premium' });
        }
        setIsCheckoutOpen(false);
      }
    } catch {
      showToast('Simulation: Subscription activated successfully!', 'success');
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

      if (res.data?.success) {
        const total = selectedCreditPkg.credits + selectedCreditPkg.bonus;
        updateCredits((user?.creditBalance || 0) + total);
        showToast(`Added ${total} credits to wallet! (Simulated Purchase)`, 'success');
        triggerConfetti();
        setIsCheckoutOpen(false);
      }
    } catch {
      const total = selectedCreditPkg.credits + selectedCreditPkg.bonus;
      updateCredits((user?.creditBalance || 0) + total);
      showToast(`Simulation: Added ${total} credits!`, 'success');
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

        {/* Prototype simulation disclaimer */}
        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
          💡 <strong>Prototype Test Mode:</strong> All transactions operate under simulation mode with ₹0 real money charged.
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-400" /> Premium Subscription Plans
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
