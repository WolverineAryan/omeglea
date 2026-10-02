'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { useToast } from '../../../components/ui/Toast';
import { api } from '../../../lib/api';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import {
  User as UserIcon,
  Shield,
  MapPin,
  Globe,
  Sparkles,
  Video,
  UserPlus,
  UserX,
  Flag,
  ArrowLeft,
  CheckCircle,
  MessageCircle
} from 'lucide-react';
import { PublicUserProfile } from '@omeglea/shared';

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('inappropriate_behavior');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/users/${userId}`);
      if (res.data?.success) {
        setProfile(res.data.data);
      }
    } catch {
      showToast('User profile not found', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendConnection = async () => {
    try {
      await api.post(`/discover/connect/${userId}`);
      showToast('Connection request sent!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to send request', 'error');
    }
  };

  const handleBlockUser = async () => {
    try {
      await api.post('/blocks', {
        blockedUserId: userId,
        reason: 'User blocked from profile view',
      });
      showToast('User has been blocked', 'info');
      router.push('/discover');
    } catch {
      showToast('Failed to block user', 'error');
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    try {
      await api.post('/reports', {
        reportedUserId: userId,
        category: reportReason,
        description: reportDetails,
      });
      showToast('Report submitted to moderation team. Thank you.', 'success');
      setIsReportModalOpen(false);
    } catch {
      showToast('Failed to submit report', 'error');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Profile Not Found</h2>
        <p className="text-xs text-slate-400">
          This user profile either does not exist or has been deactivated.
        </p>
        <Link href="/discover">
          <Button variant="gradient" size="md">
            Back to Discover
          </Button>
        </Link>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;
  const galleryPhotos = profile.photos || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {!isOwnProfile && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReportModalOpen(true)}
              className="text-amber-400 border-amber-500/20 hover:bg-amber-500/10"
            >
              <Flag className="h-3.5 w-3.5" /> Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBlockUser}
              className="text-rose-400 border-rose-500/20 hover:bg-rose-500/10"
            >
              <UserX className="h-3.5 w-3.5" /> Block
            </Button>
          </div>
        )}
      </div>

      {/* Main Profile Card */}
      <Card className="overflow-hidden border border-white/10 shadow-2xl p-0">
        <div className="h-40 bg-gradient-to-r from-purple-900 via-indigo-900 to-pink-900 relative" />

        <div className="px-6 sm:px-8 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 gap-4 pb-6 border-b border-white/5">
            <div className="p-1 rounded-full bg-slate-950 shadow-2xl inline-block border-2 border-purple-500/50">
              <Avatar
                src={profile.avatar}
                name={profile.displayName}
                size="xl"
                className="h-28 w-28 sm:h-32 sm:w-32 text-3xl font-black ring-4 ring-slate-950"
              />
            </div>

            <div className="flex-1 sm:pl-4">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-white">{profile.displayName}</h1>
                {profile.age && (
                  <span className="text-lg font-bold text-purple-400">, {profile.age}</span>
                )}
                {profile.isPremium && (
                  <Badge variant="premium">
                    <Sparkles className="h-3 w-3" /> PRO
                  </Badge>
                )}
                <Badge variant="success">
                  <CheckCircle className="h-3 w-3" /> 18+ Verified
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                {profile.country && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-purple-400" /> {profile.country}
                  </span>
                )}
                {profile.gender && (
                  <span className="flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5 text-pink-400" /> {profile.gender}
                  </span>
                )}
              </div>
            </div>

            {!isOwnProfile && (
              <div className="flex items-center gap-2">
                <Button
                  variant="gradient"
                  size="md"
                  onClick={handleSendConnection}
                  className="font-bold shadow-lg shadow-purple-600/30"
                >
                  <UserPlus className="h-4 w-4" /> Connect
                </Button>
                <Link href="/chat">
                  <Button variant="secondary" size="md" className="font-bold">
                    <Video className="h-4 w-4" /> Video Chat
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="md:col-span-2 space-y-6">
              {/* Bio */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  About
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/40 p-4 rounded-2xl border border-white/5 whitespace-pre-wrap">
                  {profile.biography || 'No biography written yet.'}
                </p>
              </div>

              {/* Gallery */}
              {galleryPhotos.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Photos ({galleryPhotos.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {galleryPhotos.map((photo, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedPhotoIndex(index)}
                        className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group bg-slate-950 cursor-pointer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo}
                          alt={`${profile.displayName} photo ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.length > 0 ? (
                    profile.interests.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold"
                      >
                        #{tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">No interests listed</span>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Details */}
            <div className="space-y-4">
              <Card className="p-4 border border-white/10 bg-slate-900/60 space-y-3 text-xs">
                <h3 className="font-bold uppercase tracking-wider text-slate-400">
                  Languages
                </h3>
                <p className="text-white font-medium">{profile.languages.join(', ')}</p>
              </Card>
            </div>
          </div>
        </div>
      </Card>

      {/* Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title={`Report ${profile.displayName}`}
      >
        <form onSubmit={handleSubmitReport} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Reason for report</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
            >
              <option value="inappropriate_behavior">Inappropriate or offensive behavior</option>
              <option value="underage">Suspected underage user (&lt;18)</option>
              <option value="harassment">Harassment or bullying</option>
              <option value="explicit_content">Explicit / nudity violation</option>
              <option value="spam">Commercial spam or scam</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Additional details</label>
            <textarea
              rows={3}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Describe what occurred..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsReportModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="md"
              isLoading={isSubmittingReport}
              className="flex-1 font-bold"
            >
              Submit Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
