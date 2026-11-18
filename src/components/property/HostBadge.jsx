import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  Award,
  ShieldCheck,
  Clock,
  MessageSquare,
  Send,
  Wifi,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const API_BASE = 'http://localhost:5000';

export const HostBadge = ({ host, propertyId = 'prop-1', propertyTitle = '' }) => {
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!chatOpen) return;

    const loadPropertyMessages = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE}/api/messages`, { headers });
        if (Array.isArray(res.data)) {
          setMessages(res.data.filter((m) => m.propertyId === propertyId));
        }
      } catch {
        // Ignore if offline
      }
    };
    loadPropertyMessages();

    const socket = io(API_BASE, { transports: ['websocket', 'polling'] });
    socket.on('new_message', (msg) => {
      if (msg.propertyId === propertyId) {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      }
    });

    return () => socket.disconnect();
  }, [chatOpen, propertyId, token]);

  if (!host) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      setSending(true);
      const text = inputText.trim();
      setInputText('');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(
        `${API_BASE}/api/messages`,
        {
          propertyId,
          content: text,
          senderRole: user?.role === 'HOST' ? 'HOST' : 'GUEST',
          senderName: user?.name || 'Guest',
        },
        { headers }
      );
    } catch {
      showToast('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border border-borderLight rounded-3xl p-6 bg-gray-50/50 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={host.avatar}
              alt={host.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
            />
            {host.superhost && (
              <div className="absolute -bottom-1 -right-1 bg-airbnb text-white p-1 rounded-full shadow-xs">
                <Award className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          <div>
            <h4 className="text-lg font-bold text-dark flex items-center gap-1.5">
              Hosted by {host.name}
            </h4>
            <p className="text-xs text-secondary">{host.joinedDate}</p>
          </div>
        </div>

        {/* Real-Time Message Host Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setChatOpen(!chatOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-dark hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-airbnb" />
            <span>{chatOpen ? 'Close Live Chat' : `Message ${host.name}`}</span>
          </button>

          <Link
            to={`/messages?propertyId=${propertyId}`}
            className="p-2.5 border border-borderLight hover:border-dark bg-white rounded-xl text-dark transition"
            title="Open Full Host–Guest Inbox"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Inline Real-Time Socket.IO Chat Drawer */}
      {chatOpen && (
        <div className="bg-white rounded-2xl border border-borderLight p-4 space-y-3 shadow-xs animate-fade-in">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 text-xs">
            <span className="font-bold text-dark flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              Live Socket.IO Chat with {host.name}
            </span>
            <Link
              to={`/messages?propertyId=${propertyId}`}
              className="text-[11px] font-bold text-airbnb hover:underline"
            >
              Open full inbox →
            </Link>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2.5 p-2 bg-gray-50 rounded-xl">
            {messages.length === 0 ? (
              <p className="text-xs text-secondary text-center py-4">
                Ask {host.name} anything about {propertyTitle || 'this stay'} — replies arrive in real time!
              </p>
            ) : (
              messages.map((m) => {
                const isHost = m.senderRole === 'HOST';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isHost ? 'items-start' : 'items-end'}`}
                  >
                    <span className="text-[10px] font-bold text-secondary mb-0.5">
                      {m.senderName} ({m.senderRole})
                    </span>
                    <div
                      className={`px-3.5 py-2 rounded-2xl text-xs max-w-sm ${
                        isHost
                          ? 'bg-white border border-gray-200 text-dark'
                          : 'bg-airbnb text-white'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              placeholder={`Write a message to ${host.name}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 p-2.5 rounded-xl border border-borderLight text-xs font-medium text-dark focus:border-dark focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="px-4 py-2.5 bg-airbnb hover:bg-airbnb-hover text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 py-2 border-y border-gray-200/80 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-airbnb" />
          <div>
            <span className="text-secondary block">Response time</span>
            <span className="font-semibold text-dark">{host.responseTime || 'Within an hour'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-airbnb" />
          <div>
            <span className="text-secondary block">Response rate</span>
            <span className="font-semibold text-dark">{host.responseRate || '100%'}</span>
          </div>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-secondary leading-relaxed">
        {host.bio}
      </p>

      <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-dark">
        <ShieldCheck className="w-4 h-4 text-airbnb" />
        <span>Identity & Host standards verified</span>
      </div>
    </div>
  );
};
