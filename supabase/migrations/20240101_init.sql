-- Together Watch-Party Database Schema
-- Supabase PostgreSQL Migration

-- Enable pgcrypto for UUID generation if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up existing tables if needed (for fresh runs)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

-- 1. Rooms Table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) UNIQUE NOT NULL,
    host_session_token VARCHAR(128) NOT NULL,
    host_name VARCHAR(64) NOT NULL,
    current_video_url TEXT DEFAULT NULL,
    current_video_type VARCHAR(20) DEFAULT NULL, -- 'youtube' or 'direct'
    playback_state VARCHAR(20) DEFAULT 'idle',   -- 'idle', 'playing', 'paused', 'buffering'
    playback_position DOUBLE PRECISION DEFAULT 0.0,
    last_sync_timestamp BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
    max_participants INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_rooms_expires_at ON rooms(expires_at);

-- 2. Participants Table
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(32) NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
    session_token VARCHAR(128) NOT NULL,
    display_name VARCHAR(64) NOT NULL,
    is_host BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_participants_room ON participants(room_code);
CREATE INDEX idx_participants_session ON participants(session_token);

-- 3. Chat Messages Table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(32) NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
    sender_name VARCHAR(64) NOT NULL,
    sender_session_token VARCHAR(128) NOT NULL,
    is_host BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    text VARCHAR(1000) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_room ON chat_messages(room_code);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);

-- Row Level Security (RLS)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow read access for public / guest rooms
CREATE POLICY "Public read for active rooms" ON rooms
    FOR SELECT USING (expires_at > NOW());

CREATE POLICY "Public read participants in active rooms" ON participants
    FOR SELECT USING (true);

CREATE POLICY "Public read chat messages in active rooms" ON chat_messages
    FOR SELECT USING (true);

-- Backend Service Role or Server has full access bypass.
-- In production, backend server connects via DATABASE_URL or Service Key.

-- Automated Cleanup Function for Expired Rooms
CREATE OR REPLACE FUNCTION delete_expired_rooms()
RETURNS void AS $$
BEGIN
    DELETE FROM rooms WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comment for scheduled pg_cron (if Supabase pg_cron is enabled):
-- SELECT cron.schedule('cleanup-expired-rooms', '0 * * * *', 'SELECT delete_expired_rooms()');
