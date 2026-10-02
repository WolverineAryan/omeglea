# Omeglea 🎥

> **AI-Powered Random Video Chat, Social Discovery, and Dating Platform (18+)**  
> Built with Next.js (App Router), Tailwind CSS v4, Express.js, TypeScript, WebRTC, Socket.IO, and MongoDB Atlas.

---

## 🌟 Overview

Omeglea is an adult (18+) social video chat and discovery platform inspired by spontaneous random conversation platforms. It provides:

- **Random 1:1 Video Chat**: Ultra-low-latency WebRTC video connections with HD audio and video.
- **Interest-Based Matchmaking**: Topic tags, language filters, and priority matching.
- **Social & Dating Discovery**: Public profile exploration, connection requests, and direct messaging.
- **Real-Time Text Chat**: Instant chat messages, timestamps, and typing indicators alongside live video.
- **Safety & Moderation**: Instant block-and-skip, report categories, age verification gates (18+), and administrative review.
- **Freemium Monetization**: Weekly, Monthly, and Quarterly subscription passes, credit wallet, and ad integration framework (operating under test/simulation mode).
- **Admin Console**: Live statistics, user moderation, report resolutions, and platform settings.

---

## 🏗️ Architecture & Monorepo Structure

```
omeglea/
├── apps/
│   ├── web/                   # Next.js 15 App Router Frontend (Deployed on Vercel)
│   └── server/                # Express.js + Socket.IO Backend (Deployed on Render)
├── packages/
│   └── shared/                # Shared TypeScript types, interfaces, and Zod schemas
├── package.json               # Root npm workspaces configuration
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Node.js**: v20+ or v22+ (verified with Node v25.x)
- **npm**: v10+
- **MongoDB**: Local MongoDB instance or free MongoDB Atlas cluster

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/WolverineAryan/cricpulse.git omeglea
cd omeglea

# Install dependencies across all workspace packages
npm install
```

### 2. Configure Environment Variables

#### Backend (`apps/server/.env`):
```env
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://127.0.0.1:27017/omeglea
JWT_SECRET=super-secret-jwt-key-omeglea-dev-mode-32chars
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=super-secret-refresh-key-omeglea-dev-mode-32chars
EMAIL_FROM=noreply@omeglea.com
STUN_SERVER=stun:stun.l.google.com:19302
PAYMENT_MODE=mock
```

#### Frontend (`apps/web/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME=Omeglea
NEXT_PUBLIC_APP_ENV=development
```

### 3. Build Shared Packages

```bash
npm run build --workspace=@omeglea/shared
```

### 4. Run Both Apps in Development Mode

```bash
# Starts both Express backend (port 4000) and Next.js frontend (port 3000)
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the landing page and start video chatting!

---

## 🌐 Production Deployment Guide (₹0 Free Tier)

### 1. Database — MongoDB Atlas (M0 Free Tier)
1. Create a free M0 cluster at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user and allow network access from `0.0.0.0/0` (or Render outbound IPs).
3. Copy your MongoDB connection string (e.g. `mongodb+srv://<user>:<password>@cluster.mongodb.net/omeglea`).

### 2. Backend — Render (Free Web Service)
1. Connect your repository to [Render](https://render.com).
2. Set Root Directory to `apps/server` (or build from root).
3. Build Command: `npm install && npm run build --workspace=@omeglea/shared && npm run build --workspace=@omeglea/server`
4. Start Command: `npm run start --workspace=@omeglea/server`
5. Configure Environment Variables in the Render dashboard:
   - `NODE_ENV=production`
   - `PORT=10000`
   - `MONGODB_URI=<your-atlas-uri>`
   - `JWT_SECRET=<32-char-random-string>`
   - `CLIENT_URL=https://your-frontend.vercel.app`
   - `STUN_SERVER=stun:stun.l.google.com:19302`

*Tip: Free Render web services sleep after 15 minutes of inactivity. The `/api/health` endpoint can be pinged by UptimeRobot every 10 minutes to prevent cold starts.*

### 3. Frontend — Vercel (Hobby Free Tier)
1. Import your repository into [Vercel](https://vercel.com).
2. Set Root Directory to `apps/web`.
3. Framework Preset: **Next.js**.
4. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com`
   - `NEXT_PUBLIC_SOCKET_URL=https://your-render-backend.onrender.com`
   - `NEXT_PUBLIC_APP_NAME=Omeglea`

---

## 🔒 Safety & Community Policy

Omeglea strictly prohibits:
- Explicit sexual content, pornography, and nudity
- Underage usage (<18)
- Harassment, stalking, threats, and hate speech
- Unauthorized recording or screenshotting
- Spam and fraud

All video calls are peer-to-peer and **never recorded**. Users can block and report violations with one tap.

---

## 📄 License

MIT License. Developed for adult social networking and dating discovery.
