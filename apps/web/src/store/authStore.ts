'use client';

import { create } from 'zustand';
import { IUser, IUserProfile } from '@omeglea/shared';
import { api } from '../lib/api';
import { updateSocketAuthToken, disconnectSocket } from '../lib/socket';

interface AuthState {
  user: IUser | null;
  profile: IUserProfile | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  setAuth: (user: IUser, token: string, profile?: IUserProfile) => void;
  setUser: (user: IUser) => void;
  setProfile: (profile: IUserProfile) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateCredits: (newBalance: number) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  token: null,
  isLoading: true,
  isInitialized: false,

  setAuth: (user, token, profile) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('omeglea_token', token);
    }
    updateSocketAuthToken(token);
    set({ user, token, profile: profile || null, isLoading: false, isInitialized: true });
  },

  setUser: (user) => set({ user }),

  setProfile: (profile) => set({ profile }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('omeglea_token');
    }
    disconnectSocket();
    set({ user: null, profile: null, token: null, isLoading: false });
  },

  updateCredits: (newBalance) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, creditBalance: newBalance } });
    }
  },

  checkAuth: async () => {
    try {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('omeglea_token') : null;
      if (!storedToken) {
        set({ user: null, profile: null, token: null, isLoading: false, isInitialized: true });
        return;
      }

      const res = await api.get('/auth/me');
      if (res.data?.success && res.data.data) {
        set({
          user: res.data.data.user,
          profile: res.data.data.profile,
          token: storedToken,
          isLoading: false,
          isInitialized: true,
        });
      } else {
        get().logout();
      }
    } catch {
      get().logout();
    }
  },
}));
