import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, Crown, Sparkles, MessageSquare } from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserToken: string;
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
}

const EMOJI_PALETTE = ['❤️', '😂', '🔥', '😮', '👏', '🎉', '🍿', '😱'];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  currentUserToken,
  onSendMessage,
  onSendReaction,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Live Chat</h3>
        </div>
        <span className="text-[11px] text-slate-400">{messages.length} messages</span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[250px] max-h-[460px]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <Sparkles className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-xs text-slate-400">No messages yet.</p>
            <p className="text-[11px] text-slate-400">Say hi or tap an emoji to react!</p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-1.5">
                  <span className="text-[10px] text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                    {msg.text}
                  </span>
                </div>
              );
            }

            const isMe = msg.senderSessionToken === currentUserToken;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[90%] ${
                  isMe ? 'ml-auto' : 'mr-auto'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[11px] font-medium text-slate-400">{msg.senderName}</span>
                  {msg.isHost && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-300 text-[9px] font-semibold border border-amber-500/20">
                      <Crown className="w-2.5 h-2.5" />
                      Host
                    </span>
                  )}
                  <span className="text-[9px] text-slate-400">{formatTime(msg.timestamp)}</span>
                </div>

                <div
                  className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-tr-sm'
                      : 'bg-dark-card border border-white/5 text-slate-200 rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Emoji Reaction Bar */}
      <div className="px-3 py-2 bg-dark-bg/60 border-t border-white/5 flex items-center justify-between gap-1 overflow-x-auto">
        {EMOJI_PALETTE.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSendReaction(emoji)}
            title={`React with ${emoji}`}
            className="p-1 text-lg hover:scale-125 transition-transform active:scale-95"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/5 bg-dark-surface/50">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            maxLength={500}
            className="flex-1 glass-input px-3.5 py-2 text-xs text-white placeholder-slate-400 rounded-xl focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-md shadow-indigo-600/20 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
