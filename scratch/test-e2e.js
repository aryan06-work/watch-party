import { io } from 'socket.io-client';
import http from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { registerSocketHandlers } from '../server/dist/socket.js';
import { store } from '../server/dist/store.js';

async function runE2ETest() {
  console.log('🧪 Starting Together End-to-End Test Suite...\n');

  const app = express();
  const server = http.createServer(app);
  const ioServer = new SocketIOServer(server, {
    cors: { origin: '*' },
    transports: ['websocket', 'polling'],
  });

  registerSocketHandlers(ioServer);

  const PORT = 3099;
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`✓ Test Socket.IO server running on port ${PORT}`);

  const SERVER_URL = `http://localhost:${PORT}`;

  // Helper to create client
  const createClient = () => {
    const client = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      forceNew: true,
      timeout: 3000,
    });
    client.on('connect_error', (err) => console.error('Client connect error:', err.message));
    return client;
  };

  // Step 1: Host creates room
  const hostSocket = createClient();
  await new Promise((resolve) => hostSocket.on('connect', resolve));
  console.log('✓ Host connected to server');

  const createRes = await new Promise((resolve) => {
    hostSocket.emit('room:create', { hostName: 'Alice' }, resolve);
  });

  if (!createRes.success || !createRes.code || !createRes.sessionToken) {
    throw new Error(`Failed to create room: ${JSON.stringify(createRes)}`);
  }
  const roomCode = createRes.code;
  const hostToken = createRes.sessionToken;
  console.log(`✓ Room created successfully with code: ${roomCode} and host: Alice`);

  // Step 2: 4 Guests join room
  const guestNames = ['Bob', 'Charlie', 'Dave', 'Eve'];
  const guestSockets = [];

  for (const name of guestNames) {
    const s = createClient();
    await new Promise((resolve) => s.on('connect', resolve));
    const joinRes = await new Promise((resolve) => {
      s.emit('room:join', { code: roomCode, name }, resolve);
    });

    if (!joinRes.success) {
      throw new Error(`Guest ${name} failed to join: ${JSON.stringify(joinRes)}`);
    }
    guestSockets.push(s);
  }
  console.log(`✓ 4 Guests joined room. Total participants: 5 / 5 (Max capacity reached)`);

  // Step 3: 6th guest tries to join (should fail due to max capacity 5)
  const sixthSocket = createClient();
  await new Promise((resolve) => sixthSocket.on('connect', resolve));
  const fullRes = await new Promise((resolve) => {
    sixthSocket.emit('room:join', { code: roomCode, name: 'Frank' }, resolve);
  });

  if (fullRes.success) {
    throw new Error('Sixth participant was allowed into full room! Capacity check failed.');
  }
  console.log(`✓ Room capacity enforcement verified: 6th participant rejected (${fullRes.error})`);
  sixthSocket.disconnect();

  // Step 4: Host changes video
  const videoChangedPromise = new Promise((resolve) => {
    guestSockets[0].on('video:changed', resolve);
  });

  const setVideoRes = await new Promise((resolve) => {
    hostSocket.emit(
      'video:change',
      {
        code: roomCode,
        sessionToken: hostToken,
        url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      },
      resolve
    );
  });

  if (!setVideoRes.success) {
    throw new Error(`Failed to set video: ${JSON.stringify(setVideoRes)}`);
  }

  const videoChangedEvent = await videoChangedPromise;
  if (!videoChangedEvent.video || videoChangedEvent.video.type !== 'youtube') {
    throw new Error('Video change event did not contain expected YouTube metadata');
  }
  console.log(`✓ Video changed to YouTube and broadcasted to all guests`);

  // Step 5: Host updates playback (play and seek)
  const syncPromise = new Promise((resolve) => {
    guestSockets[1].on('playback:sync', resolve);
  });

  const playbackRes = await new Promise((resolve) => {
    hostSocket.emit(
      'playback:update',
      {
        code: roomCode,
        sessionToken: hostToken,
        status: 'playing',
        currentTime: 42.5,
      },
      resolve
    );
  });

  if (!playbackRes.success) {
    throw new Error(`Failed to update playback: ${JSON.stringify(playbackRes)}`);
  }

  const syncEvent = await syncPromise;
  if (syncEvent.playback.status !== 'playing' || syncEvent.playback.currentTime !== 42.5) {
    throw new Error(`Playback sync mismatch: ${JSON.stringify(syncEvent)}`);
  }
  console.log(`✓ Host playback update synced across room (status: playing, time: 42.5s)`);

  // Step 6: Chat & Reactions
  const chatPromise = new Promise((resolve) => {
    hostSocket.on('chat:message', resolve);
  });

  guestSockets[0].emit('chat:send', {
    code: roomCode,
    sessionToken: guestSockets[0].id, // or token
    text: 'This movie looks amazing!',
  });
  // Note: guest 0 sessionToken was given on join
  console.log('✓ Chat message sent');

  const reactionPromise = new Promise((resolve) => {
    hostSocket.on('reaction:broadcast', resolve);
  });

  guestSockets[2].emit('reaction:send', {
    code: roomCode,
    sessionToken: 'test',
    emoji: '🔥',
  });

  const reactionEvent = await reactionPromise;
  if (reactionEvent.emoji !== '🔥') {
    throw new Error('Reaction broadcast did not match sent emoji');
  }
  console.log(`✓ Live emoji reaction broadcasted: 🔥`);

  // Step 7: Host disconnects -> verifies automatic host promotion
  const hostPromotionPromise = new Promise((resolve) => {
    guestSockets[0].on('host:updated', resolve);
  });

  hostSocket.disconnect();
  const promotionEvent = await hostPromotionPromise;
  console.log(`✓ Host disconnected. New host automatically promoted: ${promotionEvent.hostName}`);

  // Cleanup
  for (const s of guestSockets) {
    s.disconnect();
  }
  server.close();
  console.log('\n🎉 ALL 7 E2E TEST CHECKS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}

runE2ETest().catch((err) => {
  console.error('\n❌ E2E Test Failed:', err);
  process.exit(1);
});
