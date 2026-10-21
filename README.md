# Together 🍿
> **Watch together, wherever you are.**

A free, lightweight, responsive watch-party web application that lets friends watch supported online videos together in private rooms with frame-accurate synchronized playback, live chat, floating emoji reactions, and participant presence.

---

## 🌟 Highlights

- **Guest-Based & Instant**: Join or create a room in seconds without creating an account.
- **Synchronized Playback**: Sub-second synchronization with drift detection (<1.5s tolerance) and automatic catch-up.
- **Supported Video Players**:
  - **YouTube**: Integrated via the official YouTube IFrame Player API.
  - **Direct HTTPS Media**: Native HTML5 player for `.mp4`, `.webm`, and `.mov` media.
- **Interactive Chat & Presence**: Live text chat with host badges and floating emoji reactions (`❤️`, `😂`, `🔥`, `😮`, `👏`, `🎉`, `🍿`, `😱`).
- **Host Controls**: The room host controls the playback and video source, with support for voluntary host transfer and automatic host election if the current host disconnects.
- **Intimate Room Capacity**: Enforced maximum of 5 participants (1 host + 4 guests) per room for high performance and low server latency.
- **Zero-Cost Deployment**: Designed from the ground up to run 100% on free-tier infrastructure (Vercel + Render/Railway + Supabase).

---

## 🏗️ Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                      Client                            │
│  (React 18 + TypeScript + Vite + Tailwind CSS)         │
│                                                        │
│  ┌─────────────────────────┐  ┌──────────────────────┐ │
│  │ YouTube IFrame Player   │  │ HTML5 Video Player   │ │
│  │ (Official API)          │  │ (Direct HTTPS MP4)   │ │
│  └─────────────────────────┘  └──────────────────────┘ │
│  ┌─────────────────────────┐  ┌──────────────────────┐ │
│  │ Floating Reactions      │  │ Live Chat & Presence │ │
│  └─────────────────────────┘  └──────────────────────┘ │
└───────────────────────────▲────────────────────────────┘
                            │ WebSocket / Polling
                            │ (Socket.IO client)
┌───────────────────────────▼────────────────────────────┐
│                      Backend                           │
│  (Node.js + Express + Socket.IO + Helmet + CORS)       │
│                                                        │
│  - Real-time Room State Engine (In-Memory + TTL)       │
│  - Playback Drift & Heartbeat Synchronizer             │
│  - Room Capacity Guard (Max 5 participants)            │
│  - Host Role Verifier & Automatic Election             │
└───────────────────────────▲────────────────────────────┘
                            │ (Optional Persistence)
┌───────────────────────────▼────────────────────────────┐
│                      Database                          │
│  (Supabase PostgreSQL Free Tier)                       │
│  - `rooms`, `participants`, `chat_messages` tables     │
│  - Row-Level Security (RLS) & 24h Expiration Cron      │
└────────────────────────────────────────────────────────┘
```

---

## 🔒 Video Restrictions & Supported Formats

| Video Source | Supported? | Implementation | Notes |
| :--- | :---: | :--- | :--- |
| **Public YouTube Videos** | ✅ Yes | Official YouTube IFrame Player API | Works with `youtube.com/watch?v=...`, `youtu.be/...`, shorts, and embeds. Videos where the creator disabled third-party embedding are handled with a friendly error. |
| **Direct HTTPS Video URLs** | ✅ Yes | HTML5 `<video>` element | Supports direct HTTPS links ending in `.mp4`, `.webm`, `.ogv`, `.mov`. Remote server must allow standard cross-origin playback. |
| **Netflix, Disney+, Prime Video** | ❌ No | Rejected at validation | DRM-protected streaming services cannot be embedded or distributed without proprietary decryption and account violations. |
| **Arbitrary Web Pages** | ❌ No | Rejected at validation | Web scraping or arbitrary iframe embedding is blocked to prevent malware and copyright violations. |

---

## 👥 User Flows

### Flow A: Room Creation
1. Visitor opens landing page and enters their display name.
2. System generates a cryptographically random, URL-friendly room code (e.g. `tg-7x9k-2m4p`).
3. Room is initialized with a maximum capacity of 5 participants, and the creator is assigned host privileges with a secure session token.
4. Host selects a video (via YouTube URL, direct MP4 link, or quick sample presets).
5. Host clicks **"Invite"** to copy the 1-click room link (`?room=tg-7x9k-2m4p`) and shares it.

### Flow B: Joining a Private Room
1. Visitor navigates to the shared invite URL or selects "Join a room".
2. Visitor enters their display name.
3. Server validates:
   - The room exists and has not expired (24h TTL).
   - The room currently has fewer than 5 participants.
4. If valid, the guest is connected, receives full room state, and synchronizes playback.
5. If the room is full, a clear modal explains that capacity has been reached and provides a button to return home.

---

## ⏱️ Real-Time Playback Synchronization Protocol

To ensure all viewers stay in sync regardless of network latency:

1. **Host-Authoritative**: Only the host can emit play, pause, seek, and video change events.
2. **Server Timestamps**: Every playback state change stores `currentTime`, `status`, and `updatedAt` (epoch ms).
3. **Drift Compensation**: When receiving a sync update or periodic heartbeat:
   $$\text{expectedTime} = \text{currentTime} + \frac{\text{Date.now()} - \text{updatedAt}}{1000} \times \text{speed}$$
   If local player drift exceeds **1.5 seconds**, the player performs an automatic smooth seek.
4. **Drift Immunity**: If the host is paused, guests remain paused at the exact timestamp.
5. **Autoplay Policy Fallback**: If a viewer's browser restricts unmuted autoplay, an unobtrusive banner lets them enable sound with a single click.

---

## 🚀 Quickstart (Local Development)

### Prerequisites
- Node.js 18+ (tested on Node v20 and v24)
- npm 9+

### Installation

```bash
# Clone or navigate to the repository
cd together

# Install all workspace dependencies
npm install
```

### Running Locally

You can run both client and server concurrently:

```bash
# Start backend on http://localhost:3001
npm run dev:server

# In a second terminal, start frontend on http://localhost:5173
npm run dev:client
```

Open **`http://localhost:5173`** in your browser.

---

## 🗄️ Database Setup (Supabase)

Together includes an in-memory state store with zero setup required for local development. If you want persistent chat and room logs in Supabase:

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Paste and run the migration script located at `supabase/migrations/20240101_init.sql`.
4. Copy your project URL and service role key into `server/.env`:
   ```env
   PORT=3001
   CLIENT_URL=http://localhost:5173
   SUPABASE_URL=https://xyz.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

---

## ☁️ Zero-Cost Deployment Guide

### Frontend Deployment (Vercel Hobby Tier)
1. Push this repository to GitHub.
2. Sign in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Set **Root Directory** to `client`.
4. Set **Build Command** to `npm run build` and **Output Directory** to `dist`.
5. Add an environment variable:
   - `VITE_BACKEND_URL`: The URL of your deployed backend (e.g. `https://together-server.onrender.com`).
6. Deploy! The included `client/vercel.json` handles client-side routing.

### Backend Deployment (Render Free Web Service)
> **Note on Persistent Connections**: Socket.IO requires persistent connections. Stateless serverless platforms (like default Vercel serverless functions) disconnect WebSocket clients. Use a persistent Node.js environment like Render Web Services or Railway.

1. Sign in to [Render](https://render.com) and create a **New Web Service** pointing to this repository.
2. Set **Root Directory** to `server`.
3. Set **Build Command**: `npm install && npm run build`
4. Set **Start Command**: `npm run start`
5. Configure Environment Variables:
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: `https://your-together-app.vercel.app`
6. Click **Deploy**.

> **Free Tier Caveat**: Render's free tier spins down after 15 minutes of inactivity. When a user first opens the app after inactivity, it may take 40–50 seconds to cold-start. Once connected, WebSocket connections remain active.

---

## 🧪 Automated Testing

Together comes with an end-to-end integration test suite that tests:
- Cryptographic room creation
- 5-participant capacity limit enforcement (and 6th guest rejection)
- YouTube video changes
- Playback sync and seek broadcasts
- Live chat delivery
- Live emoji reactions
- Host disconnection and automatic host promotion

Run the test suite:
```bash
node scratch/test-e2e.js
```

---

## 🛡️ Security & Privacy Controls

- **No Permanent PII**: No email, passwords, or tracking cookies are required.
- **Cryptographic Room Codes**: Generated with 40+ bits of entropy to prevent brute-force discovery.
- **Guest Session Tokens**: Secure random tokens stored in `sessionStorage` prevent impersonation.
- **Input Sanitization**: All chat messages and display names are HTML-escaped and bounded in length to prevent XSS.
- **Strict Capacity Guards**: Hard limits enforced at the server socket layer to prevent memory exhaustion.
- **Helmet HTTP Security**: Protection headers configured with CORS rules.
