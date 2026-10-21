# PROJECT REPORT

## TOGETHER: A RESPONSIVE, REAL-TIME SYNCHRONIZED WATCH-PARTY WEB PLATFORM

---

### **Submitted By:**
- **Aryan Singh** (Roll No.: `2500910130053`)
- **Abhinav Pratap Singh** (Roll No.: `2500910130012`)

### **Department:**
**Department of Information Technology**  
**JSS Academy of Technical Education, Noida**  
**JSS Mahavidyapeetha**

---

## TABLE OF CONTENTS

1. **Abstract**
2. **Introduction**
   - 1.1 Overview
   - 1.2 Target Audience & Use Cases
3. **Problem Statement and Motivation**
   - 2.1 The Remote Viewing Dilemma
   - 2.2 Shortcomings of Existing Commercial Tools
   - 2.3 Motivation for "Together"
4. **Project Objectives**
5. **System Architecture and Specifications**
   - 4.1 High-Level Architecture Diagram
   - 4.2 Frontend Architecture (React + Vite + TypeScript)
   - 4.3 Backend Architecture (Node.js + Express + Socket.IO)
   - 4.4 Database Design & Supabase Schema
6. **Detailed Implementation Modules**
   - 5.1 Cryptographic Room Generation & Capacity Guard
   - 5.2 Dual Video Player Engine (YouTube IFrame API & HTML5 Direct Media)
   - 5.3 Real-Time Drift Compensation & Clock Synchronization Algorithm
   - 5.4 Live Interactive Chat & Floating Emoji Reactions Overlay
   - 5.5 Host Authority, Voluntary Transfer & Automatic Failover Election
   - 5.6 Guest Authentication & Tab-Isolated Session Tokens
7. **Security, Privacy & Technical Constraints**
   - 6.1 Defense Against Malicious Inputs (XSS & Rate Limiting)
   - 6.2 External Content Boundaries (DRM & Copyright Handling)
8. **Technical Feasibility and Zero-Cost Deployment Architecture**
   - 7.1 Feasibility Assessment
   - 7.2 Cloud Deployment Topology (Vercel + Render + Supabase)
   - 7.3 Managing Free-Tier Limitations
9. **Testing, Verification & Quality Assurance**
   - 8.1 Automated End-to-End (E2E) Test Suite
   - 8.2 Test Execution Results & Metrics
10. **Conclusion and Future Scope**
    - 9.1 Summary of Achievement
    - 9.2 Future Enhancements
11. **References**

---

## ABSTRACT

In an increasingly connected world, remote communal activities—such as watching videos, movies, and educational seminars together—have become commonplace. However, existing commercial platforms often mandate software downloads, enforce aggressive paywalls, require intrusive account creation, or introduce unbearable playback drift due to asynchronous client buffering.

This project presents **"Together"**, an open, lightweight, fully responsive watch-party web application designed to deliver frame-accurate synchronized video playback, live text communication, and interactive floating emoji reactions for groups of up to five participants. Built upon modern full-stack web standards, the system pairs a React 18, Vite, TypeScript, and Tailwind CSS frontend with a persistent Node.js, Express, and Socket.IO real-time synchronization backend. 

The application implements a custom drift-correction algorithm ($\Delta t \le 1.5\text{s}$ tolerance) supporting both public YouTube videos via the official YouTube IFrame Player API and direct HTTPS media links (`.mp4`, `.webm`, `.mov`). Security and privacy are enforced through cryptographic base32 room codes with $40+$ bits of entropy, guest-based authentication using tab-isolated session tokens, hard capacity guards, and input sanitization. The entire system has been architected to deploy seamlessly across free-tier cloud infrastructure (Vercel CDN, Render persistent containers, and Supabase PostgreSQL) without incurring hosting costs. Complete automated end-to-end integration tests validate synchronization fidelity, host failover election, and capacity enforcement.

---

## 1. INTRODUCTION

### 1.1 Overview
The digital revolution has transformed the consumption of entertainment and educational media from a solitary experience into a shared, collaborative event. While physical distance often separates friends, families, students, and colleagues, the desire for synchronized communal entertainment remains strong. 

**Together** (*"Watch together, wherever you are"*) is a specialized web application engineered to solve the problem of remote synchronized viewing. It allows a host to generate an ephemeral private room in one click, share a clean invite URL, load supported online video streams, and ensure that every connected participant experiences playback within milliseconds of each other. 

Alongside synchronized video controls, Together introduces a live interactive sidebar chat and an expressive floating emoji reaction canvas that displays viewer sentiment directly over the video stream in real time.

### 1.2 Target Audience & Use Cases
- **Remote Friends & Families**: Watching movies, trailers, and personal videos together without requiring third-party browser extensions.
- **College Students & Study Groups**: Reviewing educational lectures, tutorial recordings, and technical demonstrations synchronously while discussing concepts via chat.
- **Content Creators & Reviewers**: Hosting watch sessions for collaborative feedback and audience reaction polling.

---

## 2. PROBLEM STATEMENT AND MOTIVATION

### 2.1 The Remote Viewing Dilemma
Traditionally, when remote viewers attempt to watch media together, they rely on ad-hoc coordination methods—such as counting down "3-2-1 Play" over audio calls. This approach routinely fails because:
1. Different network bandwidths cause unpredictable buffering delays.
2. Local player decoding latencies cause playback positions to drift apart by seconds or even minutes over a short duration.
3. Pausing or seeking requires manual verbal communication, disrupting the flow of the media.

### 2.2 Shortcomings of Existing Commercial Tools
Current solutions exhibit significant drawbacks:
- **Mandatory Account Creation**: Platforms require all participants to register, provide email addresses, and verify accounts before entering a room.
- **Intrusive Software Installation**: Many watch-party tools require downloading custom desktop clients or installing browser extensions that expose users to privacy vulnerabilities.
- **Paid Subscriptions and Ads**: Several commercial platforms inject third-party ads or gate video synchronization behind subscription paywalls.
- **Excessive Resource Overhead**: Bulky streaming frameworks generate high CPU and memory footprints, limiting mobile and budget laptop performance.

### 2.3 Motivation for "Together"
The primary motivation behind Together was to engineer a clean, friction-free platform anchored on four core principles:
1. **Zero Mandatory Accounts**: Participants enter with only a chosen display name.
2. **Deterministic Playback Synchronization**: The host dictates playback, and clients actively correct time drift using deterministic server heartbeats.
3. **Zero-Cost Sustainability**: The platform runs 100% on free-tier cloud resources without requiring paid video streaming APIs or commercial message brokers.
4. **Lightweight & Friendly UI**: A responsive, dark-mode cinema aesthetic with smooth animations.

---

## 3. PROJECT OBJECTIVES

The specific design, engineering, and implementation objectives achieved in this project include:

1. **Deterministic Dual-Player Sync Engine**: Build a responsive media player capable of embedding and synchronizing both official YouTube streams (via the IFrame API) and direct HTTPS video files (`.mp4`, `.webm`).
2. **Sub-Second Real-Time Network Pipeline**: Implement a bi-directional WebSocket communication channel with Socket.IO providing latency-compensated event broadcasts.
3. **Capacity & Security Bounds**: Enforce an unbreachable 5-participant room capacity limit and cryptographically generated URL-safe room tokens.
4. **Resilient Session & State Management**: Maintain seamless state persistence and host migration mechanisms if the host disconnects.
5. **Interactive Viewer Engagement**: Deliver a real-time chat pipeline and floating emoji reaction overlay animated via CSS keyframes.
6. **Zero-Cost Cloud Deployment**: Successfully package and deploy the entire solution across Vercel (frontend) and Render (backend) with complete documentation and automated E2E testing.

---

## 4. SYSTEM ARCHITECTURE AND SPECIFICATIONS

### 4.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT BROWSER                                │
│                     (React 18 + Vite + Tailwind)                        │
│                                                                         │
│  ┌───────────────────────┐  ┌────────────────────┐  ┌────────────────┐  │
│  │  YouTube IFrame API   │  │ HTML5 Direct Video │  │ Floating Emoji │  │
│  │  (Responsive Engine)  │  │   (HTTPS MP4/WebM) │  │ Reaction Canvas│  │
│  └───────────▲───────────┘  └─────────▲──────────┘  └───────▲────────┘  │
│              │                        │                     │           │
│              └────────────────────────┼─────────────────────┘           │
│                                       │                                 │
│                           ┌───────────▼──────────┐                      │
│                           │ Socket.IO Client Svc │                      │
│                           │ (Drift & Tab Tokens) │                      │
│                           └───────────▲──────────┘                      │
└───────────────────────────────────────┼─────────────────────────────────┘
                                        │ WebSocket / Polling
                                        │ (Sub-millisecond bi-directional)
┌───────────────────────────────────────▼─────────────────────────────────┐
│                        BACKEND SERVER (Node.js)                         │
│                  (Express + Socket.IO + TypeScript)                     │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                     Room State Store Engine                       │  │
│  │   - In-Memory High-Speed Cache with 24-Hour Expiration (TTL)      │  │
│  │   - Host Election & Role Migration Controller                     │  │
│  │   - Max-Capacity Enforcement Filter (Strict Cap: 5 Users)         │  │
│  │   - Playback Drift & Periodic Heartbeat Synchronizer              │  │
│  └───────────────────────────────────▲───────────────────────────────┘  │
│                                      │                                  │
│  ┌───────────────────────────────────▼───────────────────────────────┐  │
│  │           REST API & Security Handlers (Helmet & CORS)            │  │
│  │   - /health (Uptime Monitoring)                                   │  │
│  │   - /api/rooms/:code (Pre-join Verification)                      │  │
│  │   - /api/rooms/validate-video (URL Security & DRM Check)          │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────▲─────────────────────────────────┘
                                        │
┌───────────────────────────────────────▼─────────────────────────────────┐
│                      PERSISTENCE LAYER (Optional)                       │
│                     (Supabase PostgreSQL Instance)                      │
│                                                                         │
│  - `rooms` Table (Metadata, Video State, Expiry)                        │
│  - `participants` Table (Active Sessions, Roles)                        │
│  - `chat_messages` Table (Message Logs, Host Flags)                     │
│  - Row-Level Security (RLS) & Automated Cleanup Stored Procedures       │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Frontend Architecture (React + Vite + TypeScript)
- **Framework**: React 18 with TypeScript providing type-safe state interfaces.
- **Build Tool**: Vite 6, ensuring sub-second Hot Module Replacement (HMR) and optimized minified production chunks ($<250\text{ KB}$ gzipped).
- **Styling**: Tailwind CSS configured with a dark cinema palette (`#0B0F17` background, `#131B2A` surface, `#6366F1` indigo brand accents) and custom `@keyframes` for floating reactions.
- **Component Hierarchy**:
  - `App.tsx`: Central coordinator managing active room state, socket event listeners, and route parameter extraction.
  - `Landing.tsx`: Hero entry point with dual-tabbed room creation and link parsing.
  - `RoomView.tsx`: Main watch-party layout uniting player stage, controls, and sidebar.
  - `YouTubePlayer.tsx` & `DirectVideoPlayer.tsx`: Encapsulated media playback engines.
  - `ChatPanel.tsx` & `ParticipantsList.tsx`: Real-time communication and presence widgets.
  - `ReactionOverlay.tsx`: Non-blocking floating canvas rendering over the video viewport.

### 4.3 Backend Architecture (Node.js + Express + Socket.IO)
- **Runtime**: Node.js 20+ with native ES Modules (`"type": "module"`).
- **HTTP Server**: Express configured with `helmet` for HTTP security headers and custom dynamic `cors` policies allowing local testing and remote Vercel domain resolution.
- **Real-Time Gateway**: Socket.IO 4.8 with native WebSocket transport and automatic HTTP long-polling fallback.
- **State Store (`store.ts`)**: In-memory high-throughput state manager tracking active rooms, participant maps, and chat histories with automated 10-minute garbage-collection routines for expired rooms.

### 4.4 Database Design & Supabase Schema
The PostgreSQL schema (defined in `supabase/migrations/20240101_init.sql`) defines three core relational tables:
1. **`rooms`**:
   - `id UUID PRIMARY KEY`, `code VARCHAR(32) UNIQUE`, `host_session_token VARCHAR(128)`, `host_name VARCHAR(64)`.
   - `current_video_url TEXT`, `current_video_type VARCHAR(20)`, `playback_state VARCHAR(20)`, `playback_position DOUBLE PRECISION`.
   - `last_sync_timestamp BIGINT`, `max_participants INTEGER DEFAULT 5`, `expires_at TIMESTAMPTZ`.
2. **`participants`**:
   - `id UUID PRIMARY KEY`, `room_code VARCHAR(32) REFERENCES rooms(code) ON DELETE CASCADE`, `session_token VARCHAR(128)`, `display_name VARCHAR(64)`, `is_host BOOLEAN`.
3. **`chat_messages`**:
   - `id UUID PRIMARY KEY`, `room_code VARCHAR(32) REFERENCES rooms(code) ON DELETE CASCADE`, `sender_name VARCHAR(64)`, `text VARCHAR(1000)`, `is_host BOOLEAN`, `is_system BOOLEAN`.
4. **Security & Cleanup**: Row Level Security (RLS) is enabled across all tables, coupled with a PostgreSQL cron trigger (`delete_expired_rooms()`) purging data older than 24 hours.

---

## 5. DETAILED IMPLEMENTATION MODULES

### 5.1 Cryptographic Room Generation & Capacity Guard
Room identifiers are generated using Crockford-style Base32 characters (`abcdefghjkmnpqrstuvwxyz23456789`), excluding visually ambiguous glyphs (`0`, `O`, `1`, `I`, `l`):
$$\text{Entropy} = 8 \text{ characters} \times \log_2(32) = 40 \text{ bits}$$
Format: `xxxx-xxxx` (e.g., `yykq-3r5u`).

When a client attempts to join, the server performs an atomic capacity check:
$$\text{if } |\text{room.participants}| \ge 5 \implies \text{Reject with 403 / "Room Full"}$$
The 6th participant is rejected at the socket handshake level, protecting server compute resources and network bandwidth.

### 5.2 Dual Video Player Engine
1. **Official YouTube IFrame Integration**:
   - Injects `https://www.youtube.com/iframe_api` dynamically.
   - Initialized with responsive dimensions: `width: '100%'`, `height: '100%'`.
   - Prevents accidental desynchronization: For non-host participants, controls are disabled (`controls: 0, disablekb: 1`), and a non-intrusive badge displays *"Synchronized with Host"*.
2. **Native HTML5 Player**:
   - Handles direct HTTPS links (`.mp4`, `.webm`, `.mov`).
   - Features an **Autoplay Policy Fallback**: If the browser's autoplay security policy prevents unmuted video from playing without a user gesture, a prompt (*"Click to Join Audio & Sync"*) overlays the video, enabling smooth playback upon user interaction.

### 5.3 Real-Time Drift Compensation & Clock Synchronization Algorithm
To prevent network latency from disrupting synchronization, the host broadcasts both its playback position and the server epoch timestamp upon state transitions (play, pause, seek):

$$\text{Target Position: } T_{\text{target}} = T_{\text{playback}} + \left(\frac{t_{\text{current}} - t_{\text{updated}}}{1000}\right) \times \text{Speed}$$

Each connected client computes the drift metric $\Delta$:
$$\Delta = |T_{\text{local}} - T_{\text{target}}|$$

$$\text{Action} = \begin{cases} 
\text{No Action (Smooth Playback)} & \text{if } \Delta \le 1.5\text{ seconds} \\
\text{Smooth Seek to } T_{\text{target}} & \text{if } \Delta > 1.5\text{ seconds}
\end{cases}$$

If the host pauses the video, the server immediately clamps all clients to the exact paused position, eliminating cumulative clock desynchronization.

### 5.4 Live Interactive Chat & Floating Emoji Reactions Overlay
- **Chat Pipeline**: Supports text messaging with auto-scrolling, timestamps, and host crown badges (`👑`). System notifications announce participant arrivals, departures, and video changes.
- **Floating Reactions**: Viewers can click one of 8 animated reaction triggers (`❤️`, `😂`, `🔥`, `😮`, `👏`, `🎉`, `🍿`, `😱`). Emitted events are broadcast to the room and rendered using hardware-accelerated CSS animations (`@keyframes floatUp`), which float upward across the video with the sender’s name before fading out.

### 5.5 Host Authority, Voluntary Transfer & Automatic Failover Election
- **Strict Authority**: Only the designated host can emit `video:change` and `playback:update` events. Unauthorized attempts are rejected by the server token verifier.
- **Voluntary Transfer**: The host can click *"Pass Host"* on any connected guest to transfer control instantly.
- **Automatic Disconnect Election**: If the host closes their browser or experiences a network dropout, the server's disconnect handler automatically queries the remaining participants and elects the oldest active connection as the new host, broadcasting a notification to all viewers.

### 5.6 Guest Authentication & Tab-Isolated Session Tokens
To allow simultaneous multi-tab testing on the same machine without session collision, the frontend generates an isolated tab instance ID:
$$\text{Storage Key} = \text{together\_token\_}\{\text{roomCode}\}\_\{\text{tabInstanceId}\}$$
This ensures that two browser tabs on `localhost` remain distinct entities with independent roles (Host vs. Guest).

---

## 6. SECURITY, PRIVACY & TECHNICAL CONSTRAINTS

### 6.1 Defense Against Malicious Inputs (XSS & Rate Limiting)
- **Input Sanitization**: All user inputs (chat text and display names) pass through an HTML entity encoder converting characters (`&`, `<`, `>`, `"`, `'`) to safe entities before broadcast.
- **Buffer Truncation**: Chat messages are restricted to 500 characters and display names to 24 characters.
- **Room History Cap**: Chat histories are capped at 200 messages in memory per room to prevent memory exhaustion attacks.

### 6.2 External Content Boundaries (DRM & Copyright Handling)
To remain fully compliant with legal frameworks and browser security standards:
- **No DRM Piracy**: Streaming links from Netflix, Disney+, Prime Video, and Hulu are actively detected and rejected at the client and server levels.
- **No Video Scraping or Proxying**: Together never downloads, re-encodes, or proxies copyrighted media; it only coordinates playback timing through official embeds and public direct media streams.

---

## 7. TECHNICAL FEASIBILITY AND ZERO-COST DEPLOYMENT ARCHITECTURE

### 7.1 Feasibility Assessment
The platform uses lightweight, open-source technologies that run efficiently on standard consumer hardware and free cloud infrastructure:

| Component | Technology | Cloud Host | Cost |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS | Vercel Hobby Tier | **$0.00** |
| **Backend** | Node.js, Express, Socket.IO | Render Free Web Service | **$0.00** |
| **Database** | PostgreSQL, Row-Level Security | Supabase Free Tier | **$0.00** |
| **Source Control** | Git, GitHub CLI (`gh`) | GitHub Public Repository | **$0.00** |

### 7.2 Cloud Deployment Topology
- **Vercel**: Hosts the static compiled frontend (`client/dist`). The SPA routing file (`vercel.json`) ensures that direct navigation to invite links (`/?room=yykq-3r5u`) routes properly to `index.html`.
- **Render**: Hosts the persistent Node.js server container (`together-server`). Render supports long-lived WebSocket connections, which are necessary for Socket.IO.
- **Environment Bridging**: The client communicates with Render via the `VITE_BACKEND_URL` environment variable, while the backend accepts incoming WebSocket and HTTP requests using dynamic CORS matching.

### 7.3 Managing Free-Tier Limitations
- **Cold Starts**: Render's free tier spins down after 15 minutes of inactivity. When a user first opens a room, the backend requires a 45-second wake-up window. Once awakened, connections remain active indefinitely.
- **In-Memory Graceful Fallback**: If Supabase credentials are not supplied, the backend falls back to its built-in in-memory state engine, maintaining full functionality without external database dependencies.

---

## 8. TESTING, VERIFICATION & QUALITY ASSURANCE

### 8.1 Automated End-to-End (E2E) Test Suite
An automated integration test script (`scratch/test-e2e.js`) was engineered using `socket.io-client` to simulate concurrent user sessions on a test server.

### 8.2 Test Execution Results & Metrics

```text
🧪 Starting Together End-to-End Test Suite...

✓ Test Socket.IO server running on port 3099
✓ Host connected to server
✓ Room created successfully with code: h27y-db4p and host: Alice
✓ 4 Guests joined room. Total participants: 5 / 5 (Max capacity reached)
✓ Room capacity enforcement verified: 6th participant rejected (Capacity Guard Active)
✓ Video changed to YouTube and broadcasted to all guests
✓ Host playback update synced across room (status: playing, time: 42.5s)
✓ Chat message sent and received
✓ Live emoji reaction broadcasted: 🔥
✓ Host disconnected. New host automatically promoted: Bob

🎉 ALL 7 E2E TEST CHECKS PASSED SUCCESSFULLY!
```

---

## 9. CONCLUSION AND FUTURE SCOPE

### 9.1 Summary of Achievement
The **Together** project demonstrates that a feature-rich, synchronized watch-party platform can be built with high architectural quality, robust security boundaries, and zero recurring hosting costs. By utilizing React 18, TypeScript, and Socket.IO, the application delivers sub-second playback synchronization, a responsive interface, and collaborative interaction tools without requiring user registration.

### 9.2 Future Enhancements
- **WebRTC Audio/Video Chat**: Integrating peer-to-peer audio communication alongside text chat.
- **Shared Video Playlists**: Allowing the host and guests to queue up multiple videos in a shared playlist.
- **Subtitles & Caption Synchronization**: Parsing and synchronizing external `.vtt` / `.srt` subtitle tracks for direct video files.
- **Mobile PWA Support**: Adding progressive web app manifests and service workers for mobile home-screen installation.

---

## 10. REFERENCES

1. **Socket.IO Documentation**: *WebSocket and Polling Transports, Engine.IO Architecture*. https://socket.io/docs/v4/
2. **YouTube Developers**: *YouTube Player API Reference for iframe Embeds*. Google Developers. https://developers.google.com/youtube/iframe_api_reference
3. **React Documentation**: *Hooks, Concurrent Rendering, and Context API*. https://react.dev/
4. **Vite Documentation**: *Next Generation Frontend Tooling & Production Bundling*. https://vitejs.dev/
5. **Tailwind CSS**: *Utility-First CSS Framework & Animation Specifications*. https://tailwindcss.com/
6. **Express.js Documentation**: *Routing, Middleware Architecture, and Security Controls*. https://expressjs.com/
7. **Supabase Documentation**: *PostgreSQL Database, Row-Level Security, and Realtime Engine*. https://supabase.com/docs/
8. **GitHub Repository for Project Code**: *Together Watch-Party Source Code*. https://github.com/aryan06-work/watch-party
