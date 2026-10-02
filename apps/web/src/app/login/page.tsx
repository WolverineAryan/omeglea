'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@omeglea/shared';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Video, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      if (res.data?.success && res.data.data) {
        const { user, tokens } = res.data.data;
        setAuth(user, tokens.accessToken);
        showToast(`Welcome back, ${user.displayName}!`, 'success');
        router.push('/chat');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Login failed. Please check your credentials.';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 items-center justify-center text-white shadow-lg shadow-purple-600/30 mb-2">
            <Video className="h-6 w-6 fill-white/20" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Log in to Omeglea</h1>
          <p className="text-xs text-slate-400">
            Welcome back! Continue your spontaneous video conversations.
          </p>
        </div>

        <Card className="p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                <input
                  type="checkbox"
                  className="rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500"
                  {...register('rememberMe')}
                />
                <span>Remember me</span>
              </label>

              <Link
                href="/forgot-password"
                className="text-purple-400 hover:text-purple-300 font-medium transition"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link href="/register" className="text-pink-400 font-semibold hover:underline">
              Create free account (18+)
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
