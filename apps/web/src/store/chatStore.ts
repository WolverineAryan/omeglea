'use client';

import { create } from 'zustand';
import { IChatMessage, MatchFoundPayload, MatchingPreferences } from '@omeglea/shared';

export type MatchState = 'idle' | 'searching' | 'connected' | 'disconnected' | 'timeout';

interface ChatStore {
  matchState: MatchState;
  activeMatch: MatchFoundPayload | null;
  messages: IChatMessage[];
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  peerTyping: boolean;
  callDuration: number;
  preferences: MatchingPreferences;
  
  setMatchState: (state: MatchState) => void;
  setActiveMatch: (match: MatchFoundPayload | null) => void;
  addMessage: (message: IChatMessage) => void;
  clearMessages: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  setAudioEnabled: (enabled: boolean) => void;
  setVideoEnabled: (enabled: boolean) => void;
  setPeerTyping: (typing: boolean) => void;
  incrementDuration: () => void;
  resetDuration: () => void;
  setPreferences: (pref: MatchingPreferences) => void;
  resetSession: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  matchState: 'idle',
  activeMatch: null,
  messages: [],
  isAudioEnabled: true,
  isVideoEnabled: true,
  peerTyping: false,
  callDuration: 0,
  preferences: { mode: 'random', interests: [] },

  setMatchState: (matchState) => set({ matchState }),
  setActiveMatch: (activeMatch) => set({ activeMatch }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  toggleAudio: () => set((state) => ({ isAudioEnabled: !state.isAudioEnabled })),
  toggleVideo: () => set((state) => ({ isVideoEnabled: !state.isVideoEnabled })),
  setAudioEnabled: (isAudioEnabled) => set({ isAudioEnabled }),
  setVideoEnabled: (isVideoEnabled) => set({ isVideoEnabled }),
  setPeerTyping: (peerTyping) => set({ peerTyping }),
  incrementDuration: () => set((state) => ({ callDuration: state.callDuration + 1 })),
  resetDuration: () => set({ callDuration: 0 }),
  setPreferences: (preferences) => set({ preferences }),
  resetSession: () =>
    set({
      matchState: 'idle',
      activeMatch: null,
      messages: [],
      peerTyping: false,
      callDuration: 0,
    }),
}));
