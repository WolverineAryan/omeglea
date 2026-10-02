'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  SkipForward,
  Flag,
  UserX,
  Send,
  MessageSquare,
  Sparkles,
  Shield,
  Loader2,
  AlertCircle,
  Lock,
  UserPlus,
  LogIn,
  Info,
} from 'lucide-react';
import { getSocket } from '../../lib/socket';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { formatTime } from '../../lib/utils';
import { api, getCleanBackendUrl, updateApiBaseUrl } from '../../lib/api';
import { reconnectSocketWithUrl } from '../../lib/socket';
import { IChatMessage, MatchFoundPayload, ReportCategory } from '@omeglea/shared';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
  iceCandidatePoolSize: 10,
};

export default function VideoChatPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const { showToast } = useToast();

  const {
    matchState,
    setMatchState,
    activeMatch,
    setActiveMatch,
    messages,
    addMessage,
    clearMessages,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    callDuration,
    incrementDuration,
    resetDuration,
    preferences,
    setPreferences,
    resetSession,
  } = useChatStore();

  // Media Streams & Peer Connection refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidatesRef = useRef<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Local state
  const [chatInput, setChatInput] = useState('');
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [interestInput, setInterestInput] = useState('');
  const [confirmDisconnectState, setConfirmDisconnectState] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [peerIsTyping, setPeerIsTyping] = useState(false);

  // Modals & Diagnostics
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState<ReportCategory>('inappropriate_behavior');
  const [reportDescription, setReportDescription] = useState('');
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [activeQueueCount, setActiveQueueCount] = useState<number>(0);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [backendUrlInput, setBackendUrlInput] = useState('');

  useEffect(() => {
    setBackendUrlInput(getCleanBackendUrl());
  }, []);

  const handleSaveBackendUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!backendUrlInput.trim()) return;
    const clean = backendUrlInput.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '');
    updateApiBaseUrl(clean);
    reconnectSocketWithUrl(clean);
    showToast(`Connecting to ${clean}...`, 'info');
    setTimeout(() => {
      handleRunDiagnostics();
    }, 1500);
  };

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (matchState === 'connected') {
      interval = setInterval(() => {
        incrementDuration();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [matchState, incrementDuration]);

  // Periodic heartbeat while in searching state to guarantee instant pairing
  useEffect(() => {
    let searchInterval: NodeJS.Timeout;
    if (matchState === 'searching' && user) {
      searchInterval = setInterval(() => {
        const socket = getSocket();
        if (socket.connected) {
          socket.emit('matching:join', { preferences });
        }
      }, 3000);
    }
    return () => clearInterval(searchInterval);
  }, [matchState, user, preferences]);

  // Scroll chat to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, peerIsTyping]);

  // 1. Initialize User Media (Webcam & Microphone)
  const initializeMedia = useCallback(async () => {
    try {
      setMediaError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsCameraReady(true);
    } catch (err: any) {
      console.error('Error accessing camera/mic:', err);
      let msg = 'Camera/Microphone permission denied. Please allow access in browser settings.';
      if (err.name === 'NotFoundError') {
        msg = 'No camera or microphone found on your device.';
      }
      setMediaError(msg);
      showToast(msg, 'error');
    }
  }, [showToast]);

  // 2. Cleanup WebRTC Peer Connection
  const cleanupPeerConnection = useCallback(() => {
    pendingCandidatesRef.current = [];
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }, []);

  // Helper to drain pending ICE candidates once remoteDescription is ready
  const drainPendingCandidates = async (pc: RTCPeerConnection) => {
    while (pendingCandidatesRef.current.length > 0) {
      const candidate = pendingCandidatesRef.current.shift();
      if (candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('Could not add queued ICE candidate:', e);
        }
      }
    }
  };

  // 3. Create WebRTC Peer Connection
  const createPeerConnection = useCallback(
    (sessionId: string) => {
      cleanupPeerConnection();

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;
      pendingCandidatesRef.current = [];

      // Add local stream tracks to WebRTC connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          if (localStreamRef.current) {
            pc.addTrack(track, localStreamRef.current);
          }
        });
      }

      // Handle incoming remote stream tracks
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0] && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteVideoRef.current.play().catch((err) => {
            console.log('Remote video auto-play caught:', err);
          });
        }
      };

      // ICE Candidates Relay
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const socket = getSocket();
          socket.emit('call:ice-candidate', {
            sessionId,
            candidate: event.candidate,
          });
        }
      };

      return pc;
    },
    [cleanupPeerConnection]
  );

  // 4. Socket.IO Listeners & WebRTC Signaling
  useEffect(() => {
    if (!user) return;

    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    // Socket Connection Status Listeners
    setSocketConnected(socket.connected);

    socket.on('connect', () => {
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('matching:waiting', (data) => {
      if (data?.position !== undefined) {
        setActiveQueueCount(data.position);
      }
    });

    // Match Found
    socket.on('matching:found', async (data: MatchFoundPayload) => {
      setActiveMatch(data);
      setMatchState('connected');
      resetDuration();
      clearMessages();
      setConfirmDisconnectState(false);
      showToast(`Connected with stranger!`, 'success');

      const pc = createPeerConnection(data.sessionId);

      if (data.initiator) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('call:offer', {
            sessionId: data.sessionId,
            sdp: offer,
          });
        } catch (err) {
          console.error('Failed to create WebRTC offer:', err);
        }
      }
    });

    // Call Offer Received
    socket.on('call:offer', async (data: { sessionId: string; sdp: any }) => {
      const pc = peerConnectionRef.current || createPeerConnection(data.sessionId);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        await drainPendingCandidates(pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('call:answer', {
          sessionId: data.sessionId,
          sdp: answer,
        });
      } catch (err) {
        console.error('Failed to handle WebRTC offer:', err);
      }
    });

    // Call Answer Received
    socket.on('call:answer', async (data: { sessionId: string; sdp: any }) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        await drainPendingCandidates(pc);
      } catch (err) {
        console.error('Failed to set remote answer:', err);
      }
    });

    // Call ICE Candidate Received
    socket.on('call:ice-candidate', async (data: { sessionId: string; candidate: any }) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      if (pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('Failed to add ICE candidate:', err);
        }
      } else {
        // Queue candidate until setRemoteDescription is complete
        pendingCandidatesRef.current.push(data.candidate);
      }
    });

    // Call Ended by Peer
    socket.on('call:ended', () => {
      cleanupPeerConnection();
      setMatchState('disconnected');
      setConfirmDisconnectState(false);
      showToast('Stranger has disconnected.', 'info');
    });

    // Chat Message Received
    socket.on('chat:message', (msg: IChatMessage) => {
      addMessage(msg);
      setPeerIsTyping(false);
    });

    // User Typing Indicator
    socket.on('user:typing', (data: { senderId: string; isTyping: boolean }) => {
      if (data.senderId !== user.id) {
        setPeerIsTyping(data.isTyping);
      }
    });

    // Auth Required Error
    socket.on('error', (err: { code: string; message: string }) => {
      if (err.code === 'AUTH_REQUIRED') {
        showToast('Login required for 18+ video chat', 'error');
      }
    });

    // Timeout
    socket.on('matching:timeout', () => {
      setMatchState('timeout');
      showToast('No match found. Try again or add more interests.', 'info');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('matching:waiting');
      socket.off('matching:found');
      socket.off('call:offer');
      socket.off('call:answer');
      socket.off('call:ice-candidate');
      socket.off('call:ended');
      socket.off('chat:message');
      socket.off('user:typing');
      socket.off('error');
      socket.off('matching:timeout');
    };
  }, [
    user,
    createPeerConnection,
    cleanupPeerConnection,
    setActiveMatch,
    setMatchState,
    resetDuration,
    clearMessages,
    addMessage,
    showToast,
  ]);

  // Run full system diagnostics test
  const handleRunDiagnostics = async () => {
    setIsPinging(true);
    const startHttp = Date.now();
    let httpOk = false;
    let httpLatency = 0;
    let httpData = null;

    try {
      const res = await api.get('/health');
      httpLatency = Date.now() - startHttp;
      httpOk = res.status === 200;
      httpData = res.data;
    } catch (e: any) {
      httpLatency = Date.now() - startHttp;
      httpData = { error: e.message };
    }

    const socket = getSocket();
    const startSocket = Date.now();
    let socketLatency = 0;
    let socketData: any = null;

    if (socket.connected) {
      socket.emit('diagnostic:ping' as any, (response: any) => {
        socketLatency = Date.now() - startSocket;
        socketData = response;
        setDiagnosticResult({
          httpOk,
          httpLatency,
          httpData,
          socketOk: true,
          socketLatency,
          socketData,
          cameraReady: isCameraReady,
          userId: user?.id,
          userDisplayName: user?.displayName,
          testedAt: new Date().toLocaleTimeString(),
        });
        setIsPinging(false);
      });
      // Fallback timeout in case callback isn't supported on old server build
      setTimeout(() => {
        setIsPinging((prev) => {
          if (prev) {
            setDiagnosticResult({
              httpOk,
              httpLatency,
              httpData,
              socketOk: socket.connected,
              socketLatency: socket.connected ? Date.now() - startSocket : 0,
              socketData: { socketId: socket.id, connected: socket.connected },
              cameraReady: isCameraReady,
              userId: user?.id,
              userDisplayName: user?.displayName,
              testedAt: new Date().toLocaleTimeString(),
            });
            return false;
          }
          return false;
        });
      }, 2000);
    } else {
      setDiagnosticResult({
        httpOk,
        httpLatency,
        httpData,
        socketOk: false,
        socketLatency: 0,
        socketData: { error: 'Socket is not connected' },
        cameraReady: isCameraReady,
        userId: user?.id,
        userDisplayName: user?.displayName,
        testedAt: new Date().toLocaleTimeString(),
      });
      setIsPinging(false);
    }
  };

  // Initial media setup on mount
  useEffect(() => {
    if (user) {
      initializeMedia();
    }
    return () => {
      cleanupPeerConnection();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [user, initializeMedia, cleanupPeerConnection]);

  // Global ESC shortcut to trigger Stop / Next like classic Omegle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && user) {
        handleMainActionButton();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Handle Mute & Video Toggles
  const handleToggleAudio = () => {
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getAudioTracks();
      tracks.forEach((t) => (t.enabled = !isAudioEnabled));
      toggleAudio();
    }
  };

  const handleToggleVideo = () => {
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getVideoTracks();
      tracks.forEach((t) => (t.enabled = !isVideoEnabled));
      toggleVideo();
    }
  };

  // Start Matching Queue
  const handleStartMatching = () => {
    if (!user) return;
    if (!isCameraReady) {
      initializeMedia();
      return;
    }

    cleanupPeerConnection();
    setMatchState('searching');
    resetDuration();
    clearMessages();
    setConfirmDisconnectState(false);

    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
      socket.once('connect', () => {
        socket.emit('matching:join', { preferences });
      });
    } else {
      socket.emit('matching:join', { preferences });
    }
  };

  // Classic Omegle Multi-State Stop/Really/Next Button Logic
  const handleMainActionButton = () => {
    const socket = getSocket();

    if (matchState === 'idle' || matchState === 'timeout' || matchState === 'disconnected') {
      // "New [ESC]" -> Start
      handleStartMatching();
    } else if (matchState === 'searching') {
      // "Stop [ESC]" -> Cancel search
      socket.emit('matching:leave');
      setMatchState('idle');
      setConfirmDisconnectState(false);
    } else if (matchState === 'connected') {
      if (!confirmDisconnectState) {
        // First click -> "Really? [ESC]"
        setConfirmDisconnectState(true);
      } else {
        // Second click -> Disconnect & skip to new partner
        if (activeMatch) {
          socket.emit('call:end', { sessionId: activeMatch.sessionId, reason: 'skipped' });
        }
        handleStartMatching();
      }
    }
  };

  // Stop completely
  const handleStopCompletely = () => {
    const socket = getSocket();
    if (activeMatch) {
      socket.emit('call:end', { sessionId: activeMatch.sessionId, reason: 'user_ended' });
    } else {
      socket.emit('matching:leave');
    }
    cleanupPeerConnection();
    resetSession();
    setConfirmDisconnectState(false);
  };

  // Send Text Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeMatch) return;

    const socket = getSocket();
    socket.emit('chat:message', {
      sessionId: activeMatch.sessionId,
      content: chatInput.trim(),
    });
    socket.emit('user:typing', {
      sessionId: activeMatch.sessionId,
      isTyping: false,
    });
    setIsTyping(false);
    setChatInput('');
  };

  const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
    if (activeMatch) {
      const socket = getSocket();
      if (!isTyping && e.target.value.length > 0) {
        setIsTyping(true);
        socket.emit('user:typing', { sessionId: activeMatch.sessionId, isTyping: true });
      } else if (isTyping && e.target.value.length === 0) {
        setIsTyping(false);
        socket.emit('user:typing', { sessionId: activeMatch.sessionId, isTyping: false });
      }
    }
  };

  // Interest Tags
  const handleAddInterest = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && interestInput.trim()) {
      e.preventDefault();
      const newInterest = interestInput.trim().replace(/^#/, '');
      if (!preferences.interests?.includes(newInterest)) {
        const updated = [...(preferences.interests || []), newInterest].slice(0, 5);
        setPreferences({
          ...preferences,
          mode: 'interests',
          interests: updated,
        });
      }
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (item: string) => {
    const updated = preferences.interests?.filter((i) => i !== item) || [];
    setPreferences({
      ...preferences,
      mode: updated.length > 0 ? 'interests' : 'random',
      interests: updated,
    });
  };

  // Submit Report
  const handleSubmitReport = async () => {
    if (!activeMatch) return;
    try {
      await api.post('/reports', {
        reportedUserId: activeMatch.peerId,
        sessionId: activeMatch.sessionId,
        category: reportCategory,
        description: reportDescription,
      });
      showToast('User reported. Skipping to next conversation...', 'success');
      setIsReportModalOpen(false);
      setReportDescription('');
      handleMainActionButton();
    } catch {
      showToast('Failed to submit report', 'error');
    }
  };

  // Block User
  const handleConfirmBlock = async () => {
    if (!activeMatch) return;
    try {
      await api.post('/blocks', {
        blockedUserId: activeMatch.peerId,
      });
      showToast(`User blocked. You will never be matched again.`, 'success');
      setIsBlockModalOpen(false);
      handleMainActionButton();
    } catch {
      showToast('Failed to block user', 'error');
    }
  };

  // -------------------------------------------------------------
  // VIEW: Gated Screen If User Is Not Logged In
  // -------------------------------------------------------------
  if (!user && isInitialized) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#0B1020]">
        <Card className="max-w-lg w-full p-8 text-center space-y-6 border border-purple-500/30 bg-[#121A2D]/90 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400" />

          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-purple-600/30">
            <Lock className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-400 text-xs font-bold border border-pink-500/30">
              18+ Verification Gate
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Login Required for Video Chat
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
              To keep Omeglea safe, eliminate bot spam, and protect our adult community, you must be logged in with verified 18+ status before accessing live video chat.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5 text-left text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Shield className="h-4 w-4 shrink-0" />
              <span>Safety &amp; Privacy Protections Active:</span>
            </div>
            <ul className="space-y-1.5 pl-6 list-disc text-slate-400 text-[11px]">
              <li>Zero video recordings or server interception</li>
              <li>Instant one-click blocking &amp; anti-harassment reporting</li>
              <li>Strict non-explicit community enforcement</li>
            </ul>
          </div>

          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/login" className="w-full">
                <Button variant="secondary" size="lg" className="w-full gap-2 font-bold">
                  <LogIn className="h-4 w-4" /> Log In
                </Button>
              </Link>
              <Link href="/register" className="w-full">
                <Button variant="gradient" size="lg" className="w-full gap-2 font-bold shadow-lg shadow-purple-600/30">
                  <UserPlus className="h-4 w-4" /> Sign Up (18+)
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: Classic Omegle / OmeTV Dual-Screen Video Interface
  // -------------------------------------------------------------
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#070B16] text-slate-100 overflow-hidden select-none">
      {/* Omegle-style Safety Warning Banner & Live Connection Health */}
      <div className="px-4 py-1.5 bg-[#0e1628] border-b border-white/5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="font-bold text-pink-400 shrink-0">Omeglea (18+):</span>
          <span className="truncate text-[11px] text-slate-300 hidden sm:inline">
            Video chat is moderated for community safety. Explicit content, harassment, and under-18 users are strictly prohibited.
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setIsDiagnosticOpen(true);
              handleRunDiagnostics();
            }}
            title="Click to check connection health & server status"
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-semibold text-slate-300 transition"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span>{socketConnected ? 'Server Connected' : 'Connecting to Server...'}</span>
          </button>

          <Link href="/safety" className="text-purple-400 hover:underline text-[11px]">
            Safety Center →
          </Link>
        </div>
      </div>

      {/* Main Omegle / OmeTV Split Stage */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2 p-2 sm:p-3 overflow-hidden">
        {/* Left Video: "YOU" */}
        <div className="lg:col-span-4 flex flex-col rounded-2xl overflow-hidden bg-slate-900 border border-white/10 relative shadow-xl">
          <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover video-mirror"
            />

            {/* Overlay Status Pill */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-xs font-bold text-white flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isVideoEnabled ? 'bg-emerald-400' : 'bg-red-400'}`} />
              You ({user?.displayName || 'Me'})
            </div>

            {/* Local Cam Controls (Mute / Cam off) */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
              <button
                onClick={handleToggleAudio}
                title={isAudioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
                className={`p-2 rounded-xl text-xs font-medium transition ${
                  isAudioEnabled
                    ? 'bg-black/60 hover:bg-black/80 text-white'
                    : 'bg-red-600 text-white'
                }`}
              >
                {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </button>

              <button
                onClick={handleToggleVideo}
                title={isVideoEnabled ? 'Turn Off Video' : 'Turn On Video'}
                className={`p-2 rounded-xl text-xs font-medium transition ${
                  isVideoEnabled
                    ? 'bg-black/60 hover:bg-black/80 text-white'
                    : 'bg-red-600 text-white'
                }`}
              >
                {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Video: "STRANGER" */}
        <div className="lg:col-span-4 flex flex-col rounded-2xl overflow-hidden bg-slate-900 border border-white/10 relative shadow-xl">
          <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
            {/* Remote Video Stream */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${
                matchState === 'connected' ? 'opacity-100' : 'opacity-0 absolute'
              }`}
            />

            {/* OmeTV-style Searching / Idle Screen */}
            {matchState !== 'connected' && (
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
                {matchState === 'searching' ? (
                  <div className="space-y-3">
                    <div className="h-16 w-16 rounded-full bg-purple-600/20 border-2 border-purple-500 flex items-center justify-center text-purple-400 animate-pulse mx-auto shadow-xl">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                    <h3 className="text-base font-bold text-white">Looking for a stranger...</h3>
                    <p className="text-[11px] text-slate-400">Connecting you with an active user</p>
                  </div>
                ) : matchState === 'disconnected' ? (
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-slate-300">Stranger has disconnected</h3>
                    <p className="text-[11px] text-slate-400">Click &quot;New&quot; or press ESC to start another chat</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white mx-auto shadow-lg">
                      <Video className="h-8 w-8 fill-white/20" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Stranger Video Screen</h3>
                    <p className="text-[11px] text-slate-400">
                      Press &quot;Start&quot; or hit ESC on your keyboard to connect.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Overlay Stranger Info & Controls */}
            {matchState === 'connected' && (
              <>
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-xs font-bold text-pink-400 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
                  Stranger ({activeMatch?.peerDisplayName || 'User'})
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    title="Report Stranger"
                    className="p-1.5 rounded-lg bg-black/60 hover:bg-amber-600 text-slate-300 hover:text-white transition"
                  >
                    <Flag className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setIsBlockModalOpen(true)}
                    title="Block Stranger"
                    className="p-1.5 rounded-lg bg-black/60 hover:bg-red-600 text-slate-300 hover:text-white transition"
                  >
                    <UserX className="h-4 w-4" />
                  </button>
                </div>

                <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/70 font-mono text-[11px] text-emerald-400">
                  {formatTime(callDuration)}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right / Side: Classic Omegle Text Chat Box */}
        <div className="lg:col-span-4 flex flex-col rounded-2xl bg-[#0B1020] border border-white/10 overflow-hidden shadow-xl">
          {/* Topic / Interests Header */}
          <div className="p-3 bg-slate-900 border-b border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" /> Interests:
              </span>
              <span className="text-[10px] text-slate-500">Press ESC to skip</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {preferences.interests?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-medium"
                >
                  #{tag}
                  <button onClick={() => handleRemoveInterest(tag)} className="hover:text-white text-slate-400">
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Add topics (e.g. Gaming, Anime)..."
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={handleAddInterest}
                className="bg-transparent border-none text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-0 text-xs py-0.5 px-1 flex-1 min-w-[120px]"
              />
            </div>
          </div>

          {/* Classic Omegle Message Transcript Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 font-sans text-xs bg-[#090D1A]">
            {/* System Intro */}
            <div className="space-y-1 text-slate-400 pb-2 border-b border-white/5">
              <p className="font-semibold text-purple-300">
                You&apos;re now chatting with a random stranger. Say hi!
              </p>
              {preferences.interests && preferences.interests.length > 0 && (
                <p className="text-amber-300/90 text-[11px]">
                  You both like: {preferences.interests.join(', ')}
                </p>
              )}
            </div>

            {/* Message Stream */}
            {messages.map((m) => {
              const isMe = m.senderId === user?.id;
              return (
                <div key={m.id} className="leading-relaxed">
                  <strong className={isMe ? 'text-blue-400 font-bold' : 'text-red-400 font-bold'}>
                    {isMe ? 'You: ' : 'Stranger: '}
                  </strong>
                  <span className="text-slate-100">{m.content}</span>
                </div>
              );
            })}

            {/* Stranger Typing */}
            {peerIsTyping && (
              <div className="text-slate-400 italic text-[11px]">
                Stranger is typing...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Bar with Classic Omegle "STOP / NEXT [ESC]" Button */}
          <div className="p-2.5 bg-slate-900 border-t border-white/10 flex items-center gap-2">
            {/* The Famous Omegle STOP/REALLY/NEXT multi-state button */}
            <button
              onClick={handleMainActionButton}
              className={`h-11 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-150 flex flex-col items-center justify-center min-w-[90px] cursor-pointer ${
                confirmDisconnectState
                  ? 'bg-amber-500 hover:bg-amber-400 text-black font-black animate-pulse'
                  : matchState === 'connected'
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : matchState === 'searching'
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                  : 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg'
              }`}
            >
              <span>
                {confirmDisconnectState
                  ? 'Really?'
                  : matchState === 'connected'
                  ? 'Stop'
                  : matchState === 'searching'
                  ? 'Cancel'
                  : 'Start'}
              </span>
              <span className="text-[9px] font-normal opacity-70 leading-none">ESC</span>
            </button>

            {/* Text Message Input */}
            <form onSubmit={handleSendMessage} className="flex-1 flex gap-1.5">
              <input
                type="text"
                value={chatInput}
                onChange={handleChatInputChange}
                disabled={matchState !== 'connected'}
                placeholder={
                  matchState === 'connected'
                    ? 'Type your message and press Enter...'
                    : 'Connect with a stranger to start typing'
                }
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-40"
              />
              <Button
                type="submit"
                variant="gradient"
                size="sm"
                disabled={matchState !== 'connected' || !chatInput.trim()}
                className="px-3.5 h-11"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Safety: Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Report Stranger for Violation"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Reports are reviewed immediately. Any violations of 18+ non-explicit policies result in permanent bans.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Category</label>
            <select
              value={reportCategory}
              onChange={(e) => setReportCategory(e.target.value as ReportCategory)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="inappropriate_behavior">Inappropriate Behavior</option>
              <option value="harassment">Harassment / Abusive Speech</option>
              <option value="suspected_underage">Suspected Underage (&lt;18)</option>
              <option value="explicit_content">Explicit / Nudity / Sexual Content</option>
              <option value="spam">Spam / Bot Activity</option>
              <option value="other">Other Community Violation</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Description (Optional)</label>
            <textarea
              rows={3}
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="What happened during this call..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => setIsReportModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="danger" size="md" onClick={handleSubmitReport} className="flex-1 font-bold">
              Submit &amp; Next
            </Button>
          </div>
        </div>
      </Modal>

      {/* Safety: Block Modal */}
      <Modal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        title="Block Stranger?"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            You will disconnect immediately and will never be paired with this user again.
          </p>

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => setIsBlockModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="danger" size="md" onClick={handleConfirmBlock} className="flex-1 font-bold">
              Yes, Block &amp; Next
            </Button>
          </div>
        </div>
      </Modal>

      {/* Live System & Network Diagnostics Modal */}
      <Modal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        title="Live Server & Connection Diagnostics"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            Use this panel to verify real-time connectivity between your device, the Render WebSocket server, and WebRTC media streams.
          </p>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-slate-400">WebSocket Socket.IO:</span>
              <span className={`font-bold flex items-center gap-1.5 ${socketConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                <span className={`h-2 w-2 rounded-full ${socketConnected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                {socketConnected ? 'Connected & Ready' : 'Disconnected / Reconnecting'}
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-slate-400">Authenticated As:</span>
              <span className="font-semibold text-white">
                {user?.displayName ? `${user.displayName} (18+ Verified)` : 'Not Logged In'}
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-slate-400">Local Camera &amp; Mic:</span>
              <span className={`font-bold ${isCameraReady ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isCameraReady ? 'Access Granted' : 'Waiting for Permission'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Active Match State:</span>
              <span className="font-mono text-purple-400 font-semibold uppercase">{matchState}</span>
            </div>
          </div>

          {diagnosticResult && (
            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">HTTP API Latency:</span>
                <span className="font-mono text-white">{diagnosticResult.httpLatency}ms {diagnosticResult.httpOk ? '✅' : '❌'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Socket Latency:</span>
                <span className="font-mono text-white">{diagnosticResult.socketLatency}ms {diagnosticResult.socketOk ? '✅' : '❌'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Matchmaking Queue Size:</span>
                <span className="font-mono text-emerald-400">{diagnosticResult.socketData?.queueSize ?? activeQueueCount} user(s) waiting</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Ping Tested:</span>
                <span className="text-slate-300">{diagnosticResult.testedAt}</span>
              </div>
            </div>
          )}

          {/* Backend Server URL Config Form */}
          <form onSubmit={handleSaveBackendUrl} className="p-3 rounded-xl bg-slate-900/90 border border-white/10 space-y-2">
            <label className="text-[11px] font-semibold text-slate-300 block">
              Backend Server URL (Render / Production / Local)
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={backendUrlInput}
                onChange={(e) => setBackendUrlInput(e.target.value)}
                placeholder="https://your-server.onrender.com"
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <Button type="submit" variant="gradient" size="sm" className="px-3 text-xs">
                Save &amp; Connect
              </Button>
            </div>
            <p className="text-[10px] text-slate-500">
              Enter your live Render backend URL if your Vercel deployment has a typo or DNS issue.
            </p>
          </form>

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              size="md"
              onClick={handleRunDiagnostics}
              isLoading={isPinging}
              className="flex-1"
            >
              Run Test Again
            </Button>
            <Button
              variant="gradient"
              size="md"
              onClick={() => setIsDiagnosticOpen(false)}
              className="flex-1 font-bold"
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
