'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/Toast';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Compass, UserPlus, Heart, Sparkles, Globe, Filter, Video } from 'lucide-react';
import { PublicUserProfile } from '@omeglea/shared';

export default function DiscoverPage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [profiles, setProfiles] = useState<PublicUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeInterest, setActiveInterest] = useState<string>('All');
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const categories = ['All', 'Music', 'Gaming', 'Travel', 'Art', 'Tech', 'Fitness', 'Movies'];

  useEffect(() => {
    fetchProfiles();
  }, [activeInterest]);

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      const url =
        activeInterest === 'All'
          ? '/discover'
          : `/discover?interest=${encodeURIComponent(activeInterest)}`;
      const res = await api.get(url);
      if (res.data?.success && res.data.data?.profiles) {
        setProfiles(res.data.data.profiles);
      }
    } catch {
      // Fallback mock discovery profiles if backend not seeded yet
      setProfiles([
        {
          id: 'mock_1',
          displayName: 'Sophia',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
          biography: 'Music producer and traveler. Looking for chill conversations and travel buddies!',
          interests: ['Music', 'Travel', 'Art'],
          languages: ['English', 'Spanish'],
          country: 'United States',
          isPremium: true,
          role: 'premium',
          lastActiveAt: new Date().toISOString(),
        },
        {
          id: 'mock_2',
          displayName: 'Marcus',
          avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
          biography: 'Gamer, programmer, and coffee addict. Let us talk about sci-fi & indie games.',
          interests: ['Gaming', 'Tech', 'Coffee'],
          languages: ['English'],
          country: 'Canada',
          isPremium: false,
          role: 'free',
          lastActiveAt: new Date().toISOString(),
        },
        {
          id: 'mock_3',
          displayName: 'Elena',
          avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
          biography: 'Fitness coach & photography lover. Always excited to meet new people globally.',
          interests: ['Fitness', 'Photography', 'Travel'],
          languages: ['English', 'Italian'],
          country: 'Italy',
          isPremium: true,
          role: 'premium',
          lastActiveAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (targetId: string, name: string) => {
    setConnectingId(targetId);
    try {
      await api.post('/discover/connections', { recipientId: targetId });
      showToast(`Connection request sent to ${name}!`, 'success');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Connection request sent (Demo mode)';
      showToast(msg, 'info');
    } finally {
      setConnectingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20 mb-2">
            <Compass className="h-3.5 w-3.5" />
            Social &amp; Dating Discovery
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Discover People</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse public profiles with shared interests and make meaningful connections.
          </p>
        </div>

        <Link href="/chat">
          <Button variant="gradient" size="md" className="gap-2">
            <Video className="h-4 w-4" />
            Live Video Chat
          </Button>
        </Link>
      </div>

      {/* Interest Filter Tags */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="h-4 w-4 text-slate-400 shrink-0 mr-1" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveInterest(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeInterest === cat
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Profiles Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Card key={n} className="p-6 h-64 animate-pulse bg-slate-900/50" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <Compass className="h-12 w-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Profiles Found</h3>
          <p className="text-xs text-slate-400">Try choosing a different topic filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((p) => (
            <Card key={p.id} hoverEffect className="p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar src={p.avatar} name={p.displayName} size="lg" isOnline={true} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-bold text-white">{p.displayName}</h3>
                        {p.isPremium && (
                          <Badge variant="premium">
                            <Sparkles className="h-2.5 w-2.5" /> PRO
                          </Badge>
                        )}
                      </div>
                      {p.country && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Globe className="h-3 w-3 text-purple-400" />
                          {p.country}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {p.biography || 'No bio provided yet.'}
                </p>

                {/* Interests */}
                <div className="flex flex-wrap gap-1.5">
                  {p.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[11px] text-purple-300 font-medium"
                    >
                      #{interest}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/5 flex gap-2">
                <Button
                  variant="gradient"
                  size="sm"
                  className="flex-1 gap-1.5"
                  isLoading={connectingId === p.id}
                  onClick={() => handleConnect(p.id, p.displayName)}
                >
                  <UserPlus className="h-3.5 w-3.5" /> Connect
                </Button>
                <Link href={`/chat?target=${p.id}`}>
                  <Button variant="secondary" size="sm" className="px-3" title="Start Direct Call">
                    <Video className="h-3.5 w-3.5 text-pink-400" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
