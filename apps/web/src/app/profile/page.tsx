'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
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
import {
  User as UserIcon,
  Shield,
  Coins,
  Crown,
  Camera,
  Upload,
  Plus,
  Trash2,
  Edit3,
  Globe,
  MapPin,
  Calendar,
  Sparkles,
  MessageCircle,
  Video,
  CheckCircle,
  Clock,
  Heart,
  Eye,
  Settings,
  X
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, setUser, setProfile, isInitialized } = useAuthStore();
  const { showToast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  // Edit form state
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [biography, setBiography] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState('');
  const [interestsText, setInterestsText] = useState('');
  const [languagesText, setLanguagesText] = useState('');
  const [discoveryEnabled, setDiscoveryEnabled] = useState(true);

  // Cloudinary / Photo file inputs
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isInitialized && !user) {
      router.push('/login');
    }
  }, [user, isInitialized, router]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
    }
    if (profile) {
      setAvatarUrl(profile.avatar || '');
      setBiography(profile.biography || '');
      setAge(profile.age || '');
      setGender(profile.gender || '');
      setCountry(profile.country || '');
      setInterestsText((profile.interests || []).join(', '));
      setLanguagesText((profile.languages || []).join(', '));
      setDiscoveryEnabled(profile.discoveryEnabled !== false);
    }
  }, [user, profile]);

  // Handle image upload to Cloudinary via backend endpoint
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'avatar' | 'gallery'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size must be less than 5MB', 'error');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Read file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = reader.result as string;

        // Upload to server -> Cloudinary
        const res = await api.post('/media/upload', {
          image: base64Data,
          folder: type === 'avatar' ? 'avatars' : 'photos',
        });

        if (res.data?.success && res.data.data?.url) {
          const uploadedUrl = res.data.data.url;

          if (type === 'avatar') {
            setAvatarUrl(uploadedUrl);
            // Immediately persist avatar
            const updateRes = await api.patch('/users/me', { avatar: uploadedUrl });
            if (updateRes.data?.success) {
              setProfile(updateRes.data.data.profile);
              showToast('Avatar updated via Cloudinary!', 'success');
            }
          } else {
            // Add to gallery photos
            const currentPhotos = profile?.photos || [];
            if (currentPhotos.length >= 6) {
              showToast('Maximum 6 photos allowed in gallery', 'error');
              return;
            }
            const updatedPhotos = [...currentPhotos, uploadedUrl];
            const updateRes = await api.patch('/users/me', { photos: updatedPhotos });
            if (updateRes.data?.success) {
              setProfile(updateRes.data.data.profile);
              showToast('Photo added to gallery!', 'success');
            }
          }
        }
      };
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to upload photo', 'error');
    } finally {
      setIsUploadingPhoto(false);
      // Reset input
      if (e.target) e.target.value = '';
    }
  };

  const handleDeletePhoto = async (indexToDelete: number) => {
    try {
      const currentPhotos = profile?.photos || [];
      const updatedPhotos = currentPhotos.filter((_, idx) => idx !== indexToDelete);
      const res = await api.patch('/users/me', { photos: updatedPhotos });
      if (res.data?.success) {
        setProfile(res.data.data.profile);
        showToast('Photo removed from gallery', 'info');
        if (selectedPhotoIndex === indexToDelete) {
          setSelectedPhotoIndex(null);
        }
      }
    } catch {
      showToast('Failed to delete photo', 'error');
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

      const payload: any = {
        displayName,
        avatar: avatarUrl,
        biography,
        country,
        gender,
        interests,
        languages: languages.length > 0 ? languages : ['English'],
        discoveryEnabled,
      };

      if (age && Number(age) >= 18) {
        payload.age = Number(age);
      }

      const res = await api.patch('/users/me', payload);

      if (res.data?.success) {
        setUser(res.data.data.user);
        setProfile(res.data.data.profile);
        showToast('Profile updated successfully!', 'success');
        setIsEditModalOpen(false);
      }
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  const galleryPhotos = profile?.photos || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Hidden file inputs for Cloudinary uploads */}
      <input
        type="file"
        ref={avatarFileInputRef}
        onChange={(e) => handleFileUpload(e, 'avatar')}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={galleryFileInputRef}
        onChange={(e) => handleFileUpload(e, 'gallery')}
        accept="image/*"
        className="hidden"
      />

      {/* Hero Profile Banner Card */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900/90 border border-white/10 shadow-2xl backdrop-blur-xl">
        {/* Colorful Gradient Header background */}
        <div className="h-44 sm:h-52 bg-gradient-to-r from-purple-900 via-indigo-900 to-pink-900 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(168,85,247,0.3),transparent)]" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Link href="/pricing">
              <Button variant="gradient" size="sm" className="shadow-lg shadow-purple-600/30">
                <Crown className="h-4 w-4" /> Upgrade to Pro
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" size="sm" className="bg-slate-900/60 backdrop-blur-md">
                <Settings className="h-4 w-4" /> Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Profile Content Details */}
        <div className="px-6 sm:px-8 pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 pb-6 border-b border-white/5">
            {/* Avatar with Cloudinary Upload Trigger */}
            <div className="relative group">
              <div className="p-1 rounded-full bg-slate-950 shadow-2xl inline-block border-2 border-purple-500/50">
                <Avatar
                  src={profile?.avatar || avatarUrl}
                  name={user.displayName}
                  size="xl"
                  isOnline={true}
                  className="h-28 w-28 sm:h-32 sm:w-32 text-3xl font-black ring-4 ring-slate-950"
                />
              </div>

              <button
                onClick={() => avatarFileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                title="Change Avatar (Cloudinary Upload)"
                className="absolute bottom-2 right-2 p-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-xl transition-transform transform group-hover:scale-110 active:scale-95 border-2 border-slate-950"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            {/* User Meta & Action Buttons */}
            <div className="flex-1 sm:pl-4 pt-2 sm:pt-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {user.displayName}
                </h1>
                {profile?.age && (
                  <span className="text-lg font-bold text-purple-400">, {profile.age}</span>
                )}
                {user.role === 'vip' ? (
                  <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-black text-xs font-black flex items-center gap-1 shadow-md shadow-amber-500/20 uppercase tracking-wide">
                    👑 VIP (500 Calls/Day)
                  </span>
                ) : user.role === 'premium' || user.isPremium ? (
                  <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-black flex items-center gap-1 shadow-md shadow-purple-500/20 uppercase tracking-wide">
                    ⭐ PRO (100 Calls/Day)
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
                    Free Plan (10 Calls/Day)
                  </span>
                )}
                <Badge variant="success" className="text-xs">
                  <CheckCircle className="h-3 w-3" /> 18+ Verified
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                {profile?.country && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-purple-400" /> {profile.country}
                  </span>
                )}
                {profile?.gender && (
                  <span className="flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5 text-pink-400" /> {profile.gender}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Coins className="h-3.5 w-3.5 text-amber-400" /> {user.creditBalance} Credits (₹{Math.round(user.creditBalance * 0.4)})
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Video className="h-3.5 w-3.5" /> Calls Today: {user.dailyCallsUsed || 0}/{user.dailyCallsLimit || (user.role === 'vip' ? 500 : user.role === 'premium' || user.isPremium ? 100 : 10)}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsEditModalOpen(true)}
                className="font-bold border border-white/10"
              >
                <Edit3 className="h-4 w-4" /> Edit Profile
              </Button>
              <Link href="/chat">
                <Button variant="gradient" size="md" className="font-bold shadow-lg shadow-purple-600/30">
                  <Video className="h-4 w-4" /> Start Video Chat
                </Button>
              </Link>
            </div>
          </div>

          {/* Bio & Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
            {/* Left 2 Columns: Bio, Photos, Interests */}
            <div className="lg:col-span-2 space-y-6">
              {/* About Me / Bio */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  About Me
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/40 p-4 rounded-2xl border border-white/5 whitespace-pre-wrap">
                  {profile?.biography ||
                    'No biography yet. Click "Edit Profile" to share your interests, vibe, and what you are looking for!'}
                </p>
              </div>

              {/* Photo Gallery (Cloudinary Powered) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                      Photo Gallery ({galleryPhotos.length}/6)
                    </h3>
                    <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 font-medium">
                      Cloudinary Storage
                    </span>
                  </div>
                  {galleryPhotos.length < 6 && (
                    <button
                      onClick={() => galleryFileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Photo
                    </button>
                  )}
                </div>

                {galleryPhotos.length === 0 ? (
                  <div
                    onClick={() => galleryFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700/80 hover:border-purple-500/80 rounded-2xl p-8 text-center cursor-pointer transition bg-slate-950/30 group"
                  >
                    <Upload className="h-8 w-8 mx-auto text-slate-500 group-hover:text-purple-400 transition" />
                    <p className="text-xs font-medium text-slate-300 mt-2">
                      Upload your favorite photos to your profile
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Supports JPG, PNG, WEBP up to 5MB (Stored securely on Cloudinary)
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {galleryPhotos.map((photo, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group bg-slate-950"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo}
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                          onClick={() => setSelectedPhotoIndex(index)}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePhoto(index);
                          }}
                          title="Delete photo"
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 hover:bg-red-600 text-slate-300 hover:text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    {galleryPhotos.length < 6 && (
                      <button
                        onClick={() => galleryFileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="aspect-square rounded-2xl border-2 border-dashed border-slate-700 hover:border-purple-500 flex flex-col items-center justify-center text-slate-500 hover:text-purple-400 bg-slate-950/20 transition group"
                      >
                        <Plus className="h-6 w-6 group-hover:scale-110 transition" />
                        <span className="text-[11px] font-medium mt-1">Add Photo</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Interests & Topics */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Shared Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(profile?.interests || []).length > 0 ? (
                    profile!.interests.map((tag) => (
                      <span
                        key={tag}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition cursor-default flex items-center gap-1.5"
                      >
                        <span className="text-pink-400">#</span>
                        {tag}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      No interests added. Add interests to find people with common hobbies!
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Profile Information & Quick Balance */}
            <div className="space-y-6">
              {/* Profile Card Summary */}
              <Card className="p-5 border border-white/10 space-y-4 bg-slate-900/60">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Profile Details
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-slate-400">Spoken Languages</span>
                    <span className="text-white font-medium">
                      {(profile?.languages || ['English']).join(', ')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-slate-400">Country</span>
                    <span className="text-white font-medium">{profile?.country || 'Not specified'}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-slate-400">Gender</span>
                    <span className="text-white font-medium">{profile?.gender || 'Not specified'}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-slate-400">Discovery Status</span>
                    <span
                      className={`font-semibold ${
                        profile?.discoveryEnabled !== false ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {profile?.discoveryEnabled !== false ? 'Visible on Discover' : 'Hidden'}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Credit Wallet Card */}
              <Card className="p-5 border border-purple-500/20 bg-gradient-to-br from-purple-950/30 to-slate-900/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                    Wallet &amp; Credits
                  </span>
                  <Coins className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <span className="text-3xl font-black text-white">{user.creditBalance}</span>
                  <span className="text-xs text-slate-400 ml-2">credits available</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Use credits for gender filters, VIP matching priority, and instant connections.
                </p>
                <Link href="/pricing" className="block pt-1">
                  <Button variant="gradient" size="sm" className="w-full font-bold">
                    Buy More Credits
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Gallery Photos */}
      {selectedPhotoIndex !== null && galleryPhotos[selectedPhotoIndex] && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPhotoIndex(null)}
          title={`Photo ${selectedPhotoIndex + 1} of ${galleryPhotos.length}`}
        >
          <div className="space-y-4">
            <div className="max-h-[65vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={galleryPhotos[selectedPhotoIndex]}
                alt="Profile gallery preview"
                className="max-h-[60vh] w-auto object-contain rounded-xl"
              />
            </div>
            <div className="flex justify-between items-center">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeletePhoto(selectedPhotoIndex)}
              >
                <Trash2 className="h-4 w-4" /> Remove Photo
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setSelectedPhotoIndex(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Your Profile"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Alex"
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Avatar Image URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://res.cloudinary.com/..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => avatarFileInputRef.current?.click()}
                disabled={isUploadingPhoto}
              >
                <Upload className="h-4 w-4" /> Upload
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Age (18+)"
              type="number"
              min={18}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value ? parseInt(e.target.value, 10) : '')}
              placeholder="e.g. 24"
            />
            <Input
              label="Gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              placeholder="e.g. Male, Female, Non-Binary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Biography (Max 300 chars)</label>
            <textarea
              rows={3}
              maxLength={300}
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              placeholder="Tell others about your hobbies, vibe, or what brings you to Omeglea..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          <Input
            label="Country / Region"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. United States, India, Germany"
          />

          <Input
            label="Interests (Comma separated)"
            value={interestsText}
            onChange={(e) => setInterestsText(e.target.value)}
            placeholder="e.g. Anime, Coding, Music, Gaming, Fitness"
          />

          <Input
            label="Languages Spoken (Comma separated)"
            value={languagesText}
            onChange={(e) => setLanguagesText(e.target.value)}
            placeholder="e.g. English, Spanish, Hindi"
          />

          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={discoveryEnabled}
              onChange={(e) => setDiscoveryEnabled(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-purple-600 mt-1"
            />
            <div>
              <span className="text-xs font-semibold text-white block">
                Show profile on Discover Page
              </span>
              <span className="text-[11px] text-slate-400">
                Allow other verified users to discover your profile and send connection requests.
              </span>
            </div>
          </label>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              size="md"
              isLoading={isSaving}
              className="flex-1 font-bold"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
