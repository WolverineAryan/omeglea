'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '@omeglea/shared';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Video, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', data);
      if (res.data?.success && res.data.data) {
        const { user, tokens } = res.data.data;
        setAuth(user, tokens.accessToken);
        showToast('Welcome to Omeglea! 10 free credits added to your wallet.', 'success');
        router.push('/chat');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Registration failed. Please try again.';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 items-center justify-center text-white shadow-lg shadow-purple-600/30 mb-2">
            <Video className="h-6 w-6 fill-white/20" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Create Your Omeglea Account</h1>
          <p className="text-xs text-slate-400">
            Join the 18+ adult social video community. Free forever.
          </p>
        </div>

        <Card className="p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Display Name"
              placeholder="e.g. Alex_99"
              error={errors.displayName?.message}
              {...register('displayName')}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                error={errors.password?.message}
                {...register('password')}
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Repeat password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </div>

            <Input
              label="Date of Birth (Must be 18+)"
              type="date"
              error={errors.dateOfBirth?.message}
              {...register('dateOfBirth')}
            />

            {/* Checkboxes for 18+, ToS and Privacy */}
            <div className="space-y-2.5 pt-2 border-t border-white/5 text-xs text-slate-300">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-700 bg-slate-800 text-purple-600 mt-0.5"
                  {...register('ageConfirmed')}
                />
                <span>
                  I confirm that I am at least <strong className="text-pink-400">18 years of age</strong>.
                </span>
              </label>
              {errors.ageConfirmed && (
                <p className="text-xs text-red-400 pl-6">{errors.ageConfirmed.message}</p>
              )}

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-700 bg-slate-800 text-purple-600 mt-0.5"
                  {...register('termsAccepted')}
                />
                <span>
                  I agree to the{' '}
                  <Link href="/terms" target="_blank" className="text-purple-400 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/community-guidelines"
                    target="_blank"
                    className="text-purple-400 hover:underline"
                  >
                    Community Guidelines
                  </Link>
                  .
                </span>
              </label>
              {errors.termsAccepted && (
                <p className="text-xs text-red-400 pl-6">{errors.termsAccepted.message}</p>
              )}

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-700 bg-slate-800 text-purple-600 mt-0.5"
                  {...register('privacyAccepted')}
                />
                <span>
                  I acknowledge and accept the{' '}
                  <Link href="/privacy" target="_blank" className="text-purple-400 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              {errors.privacyAccepted && (
                <p className="text-xs text-red-400 pl-6">{errors.privacyAccepted.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full mt-4 shadow-xl shadow-purple-600/30"
              isLoading={isLoading}
            >
              Complete Registration (18+)
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-purple-400 font-semibold hover:underline">
              Log in here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
