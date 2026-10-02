'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { User, Shield, UserX, Crown, Trash2, Save, Sparkles } from 'lucide-react';
import { IBlockedUser } from '@omeglea/shared';

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, setUser, setProfile, logout } = useAuthStore();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'blocks' | 'account'>('profile');
  const [displayName, setDisplayName] = useState('');
  const [biography, setBiography] = useState('');
  const [country, setCountry] = useState('');
  const [interestsText, setInterestsText] = useState('');
  const [languagesText, setLanguagesText] = useState('');
  const [discoveryEnabled, setDiscoveryEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState<IBlockedUser[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
    }
    if (profile) {
      setBiography(profile.biography || '');
      setCountry(profile.country || '');
      setInterestsText((profile.interests || []).join(', '));
      setLanguagesText((profile.languages || []).join(', '));
      setDiscoveryEnabled(profile.discoveryEnabled !== false);
    }
  }, [user, profile]);

  useEffect(() => {
    if (activeTab === 'blocks') {
      fetchBlockedUsers();
    }
  }, [activeTab]);

  const fetchBlockedUsers = async () => {
    try {
      const res = await api.get('/blocks');
      if (res.data?.success) {
        setBlockedUsers(res.data.data);
      }
    } catch {
      // Fallback
    }
  };

  const handleUnblock = async (blockedUserId: string) => {
    try {
      await api.delete(`/blocks/${blockedUserId}`);
      setBlockedUsers((prev) => prev.filter((b) => b.blockedUserId !== blockedUserId));
      showToast('User unblocked', 'info');
    } catch {
      showToast('Failed to unblock user', 'error');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const interests = interestsText
        .split(',')
        .map((i) => i.trim().replace(/^#/, ''))
        .filter(Boolean);
      const languages = languagesText
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      const res = await api.patch('/users/me', {
        displayName,
        biography,
        country,
        interests,
        languages: languages.length > 0 ? languages : ['English'],
        discoveryEnabled,
      });

      if (res.data?.success) {
        setUser(res.data.data.user);
        setProfile(res.data.data.profile);
        showToast('Profile updated successfully!', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/users/me');
      showToast('Account has been deleted.', 'info');
      logout();
      router.push('/');
    } catch {
      showToast('Failed to delete account', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Account &amp; Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal profile, discovery preferences, and security.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'profile'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <User className="h-4 w-4" /> Profile
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'privacy'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Shield className="h-4 w-4" /> Privacy &amp; Discovery
        </button>

        <button
          onClick={() => setActiveTab('blocks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'blocks'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <UserX className="h-4 w-4" /> Blocked Users
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'account'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Trash2 className="h-4 w-4" /> Danger Zone
        </button>
      </div>

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <Card className="p-8 border border-white/10 shadow-xl space-y-6">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-white/5">
              <Avatar name={displayName || 'User'} size="xl" isOnline={true} />
              <div>
                <h3 className="text-lg font-bold text-white">{displayName || 'Your Profile'}</h3>
                <p className="text-xs text-slate-400">
                  {user?.isPremium ? 'PRO Member' : 'Free Member'} • {user?.creditBalance} credits
                </p>
              </div>
            </div>

            <Input
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Biography</label>
              <textarea
                rows={3}
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
                placeholder="Tell others about yourself..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            <Input
              label="Interests (Comma separated)"
              value={interestsText}
              onChange={(e) => setInterestsText(e.target.value)}
              placeholder="e.g. Music, Gaming, Tech, Travel"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Country / Region"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Canada"
              />

              <Input
                label="Languages Spoken (Comma separated)"
                value={languagesText}
                onChange={(e) => setLanguagesText(e.target.value)}
                placeholder="e.g. English, Spanish"
              />
            </div>

            <Button type="submit" variant="gradient" size="md" isLoading={isSaving} className="mt-2">
              <Save className="h-4 w-4" /> Save Profile
            </Button>
          </form>
        </Card>
      )}

      {/* Tab: Privacy & Discovery */}
      {activeTab === 'privacy' && (
        <Card className="p-8 border border-white/10 space-y-6">
          <h3 className="text-lg font-bold text-white">Discovery Settings</h3>

          <div className="space-y-4">
            <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={discoveryEnabled}
                onChange={(e) => setDiscoveryEnabled(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-purple-600 mt-1"
              />
              <div>
                <span className="text-sm font-semibold text-white block">
                  Enable Profile Discovery
                </span>
                <span className="text-xs text-slate-400">
                  Allow other users to find your profile on the Discover page.
                </span>
              </div>
            </label>
          </div>

          <Button variant="gradient" size="md" onClick={handleSaveProfile} isLoading={isSaving}>
            <Save className="h-4 w-4" /> Save Preferences
          </Button>
        </Card>
      )}

      {/* Tab: Blocked Users */}
      {activeTab === 'blocks' && (
        <Card className="p-8 border border-white/10 space-y-4">
          <h3 className="text-lg font-bold text-white">Blocked Users</h3>
          <p className="text-xs text-slate-400">
            Blocked users cannot match with you in video chat or view your discovery card.
          </p>

          {blockedUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              You have not blocked any users.
            </div>
          ) : (
            <div className="space-y-2">
              {blockedUsers.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800"
                >
                  <span className="text-sm font-medium text-slate-200">{b.blockedUserName}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblock(b.blockedUserId)}
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab: Danger Zone */}
      {activeTab === 'account' && (
        <Card className="p-8 border border-red-500/20 bg-red-950/10 space-y-4">
          <h3 className="text-lg font-bold text-rose-400">Delete Account</h3>
          <p className="text-xs text-slate-300">
            Permanently delete your profile, credit balance, and connection history. This action cannot be undone.
          </p>
          <Button variant="danger" size="md" onClick={() => setIsDeleteModalOpen(true)}>
            <Trash2 className="h-4 w-4" /> Delete My Account
          </Button>
        </Card>
      )}

      {/* Confirmation Modal for Account Deletion */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Account Deletion"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Are you sure you want to permanently delete your account? All remaining credits and subscription benefits will be lost.
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleDeleteAccount}
              className="flex-1 font-bold"
            >
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
