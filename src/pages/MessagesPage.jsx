import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  MessageSquare,
  Send,
  Sparkles,
  ExternalLink,
  Wifi,
  Plus,
  User,
  Building2,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { useToast } from '../context/ToastContext';

const API_BASE = 'http://localhost:5000';

export const MessagesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPropertyId = searchParams.get('propertyId') || 'prop-1';

  const { user, token } = useAuth();
  const { allProperties } = useSearch();
  const { showToast } = useToast();

  const [messages, setMessages] = useState([]);
  const [activePropertyId, setActivePropertyId] = useState(initialPropertyId);
  const [inputText, setInputText] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    const paramPropId = searchParams.get('propertyId');
    if (paramPropId) {
      setActivePropertyId(paramPropId);
    }
  }, [searchParams]);

  // Fetch initial messages from PostgreSQL & connect Socket.IO
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE}/api/messages`, { headers });
        if (Array.isArray(res.data)) {
          setMessages(res.data);
        }
      } catch (e) {
        console.error('Failed to load messages from PostgreSQL:', e);
      }
    };
    fetchMessages();

    const socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join_conversation', `conv-${activePropertyId}`);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('new_message', (incomingMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === incomingMsg.id)) return prev;
        return [...prev, incomingMsg];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activePropertyId]);

  // Group conversations by property
  const conversationThreads = useMemo(() => {
    const map = new Map();

    // Seed threads from existing messages
    for (const msg of messages) {
      const propId = msg.propertyId || 'prop-1';
      const prop = allProperties.find((p) => p.id === propId);
      map.set(propId, {
        propertyId: propId,
        propertyTitle: prop?.title || msg.propertyTitle || 'Property Inquiry',
        city: prop?.city || 'StayFinder',
        price: prop?.price || 350,
        image: prop?.images?.[0] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80',
        hostName: prop?.host?.name || msg.hostName || 'Verified Host',
        hostAvatar:
          prop?.host?.avatar ||
          msg.hostAvatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        lastMessage: msg.content,
        lastTime: msg.createdAt,
      });
    }

    // Ensure currently selected property is in the thread list even if no messages yet
    if (activePropertyId && !map.has(activePropertyId)) {
      const prop = allProperties.find((p) => p.id === activePropertyId) || allProperties[0];
      if (prop) {
        map.set(prop.id, {
          propertyId: prop.id,
          propertyTitle: prop.title,
          city: prop.city,
          price: prop.price,
          image: prop.images?.[0],
          hostName: prop.host?.name || 'Verified Host',
          hostAvatar: prop.host?.avatar,
          lastMessage: 'Start a conversation with the host...',
          lastTime: new Date().toISOString(),
        });
      }
    }

    return Array.from(map.values());
  }, [messages, allProperties, activePropertyId]);

  const activeProperty =
    allProperties.find((p) => p.id === activePropertyId) || allProperties[0];

  const activeMessages = useMemo(
    () => messages.filter((m) => (m.propertyId || 'prop-1') === activePropertyId),
    [messages, activePropertyId]
  );

  const senderRole = user?.role === 'HOST' ? 'HOST' : 'GUEST';

  const handleSendMessage = async (e, customText = null) => {
    if (e) e.preventDefault();
    const contentToSend = (customText ?? inputText).trim();
    if (!contentToSend) return;

    try {
      setSending(true);
      if (!customText) setInputText('');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(
        `${API_BASE}/api/messages`,
        {
          propertyId: activePropertyId,
          content: contentToSend,
          senderRole,
          senderName:
            senderRole === 'HOST'
              ? activeProperty?.host?.name || user?.name || 'Host'
              : user?.name || 'Guest',
        },
        { headers }
      );
    } catch {
      showToast('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const quickQuestions = [
    'Is early check-in available for our stay?',
    'How fast is the Wi-Fi for remote work & calls?',
    'Are the upcoming weekend dates still open?',
    'What are the best restaurants & attractions nearby?',
  ];

  return (
    <div className="bg-bgLight min-h-[calc(100vh-140px)] py-6">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-borderLight shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
          {/* Left Column: Conversation Threads (4 cols) */}
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col">
            <div className="p-5 border-b border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-airbnb" />
                  <h1 className="text-lg font-extrabold text-dark">Host–Guest Inbox</h1>
                </div>

                {/* Live Socket.IO Connection Badge */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                    socketConnected
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <Wifi className="w-3 h-3" />
                  <span>{socketConnected ? 'Socket.IO Live' : 'Connecting...'}</span>
                </span>
              </div>

              {/* Start New Property Inquiry Selector */}
              <div>
                <select
                  value={activePropertyId}
                  onChange={(e) => {
                    setActivePropertyId(e.target.value);
                    setSearchParams({ propertyId: e.target.value });
                  }}
                  className="w-full p-2.5 rounded-xl border border-borderLight bg-gray-50 text-xs font-semibold text-dark focus:border-dark focus:outline-none cursor-pointer"
                >
                  {allProperties.map((p) => (
                    <option key={p.id} value={p.id}>
                      Chat with {p.host?.name} ({p.city} — ${p.price}/nt)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Thread List */}
            <div className="divide-y divide-gray-100 overflow-y-auto flex-1 max-h-[500px]">
              {conversationThreads.map((thread) => {
                const isSelected = thread.propertyId === activePropertyId;
                return (
                  <button
                    key={thread.propertyId}
                    type="button"
                    onClick={() => {
                      setActivePropertyId(thread.propertyId);
                      setSearchParams({ propertyId: thread.propertyId });
                    }}
                    className={`w-full p-4 text-left flex items-start gap-3.5 transition cursor-pointer ${
                      isSelected ? 'bg-airbnb/5 border-l-4 border-airbnb' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={thread.image}
                        alt={thread.city}
                        className="w-12 h-12 rounded-2xl object-cover border border-gray-200"
                      />
                      <img
                        src={thread.hostAvatar}
                        alt={thread.hostName}
                        className="w-6 h-6 rounded-full object-cover border-2 border-white absolute -bottom-1 -right-1 shadow-xs"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-extrabold text-dark truncate">
                          {thread.hostName} · {thread.city}
                        </p>
                        <span className="text-[10px] text-secondary shrink-0">
                          ${thread.price}/nt
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-secondary truncate">
                        {thread.propertyTitle}
                      </p>
                      <p className="text-xs text-dark/80 truncate mt-1">{thread.lastMessage}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Socket.IO Chat Window (8 cols) */}
          <div className="lg:col-span-8 flex flex-col justify-between bg-gray-50/40">
            {/* Active Property Chat Header */}
            {activeProperty && (
              <div className="p-4 sm:px-6 bg-white border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={activeProperty.host?.avatar}
                    alt={activeProperty.host?.name}
                    className="w-11 h-11 rounded-full object-cover border border-gray-200"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-extrabold text-dark">
                        {activeProperty.host?.name}
                      </h2>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Superhost · Responds within an hour
                      </span>
                    </div>
                    <p className="text-xs text-secondary truncate max-w-md">
                      {activeProperty.title} ({activeProperty.location})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-gray-100 text-dark">
                    Sending as: {senderRole}
                  </span>
                  <Link
                    to={`/rooms/${activeProperty.id}`}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-borderLight hover:border-dark bg-white text-xs font-bold text-dark transition"
                  >
                    <span>View Stay</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Chat Messages Stream */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 max-h-[430px]">
              {activeMessages.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <MessageSquare className="w-8 h-8 text-secondary mx-auto" />
                  <p className="text-sm font-bold text-dark">
                    No messages yet for {activeProperty?.city}
                  </p>
                  <p className="text-xs text-secondary">
                    Send a message below or click a quick question to chat with{' '}
                    {activeProperty?.host?.name} in real time!
                  </p>
                </div>
              ) : (
                activeMessages.map((msg) => {
                  const isHostMsg = msg.senderRole === 'HOST';
                  const isOwnMsg = msg.senderRole === senderRole;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isOwnMsg ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-extrabold uppercase text-secondary">
                          {msg.senderName} ({msg.senderRole})
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {msg.createdAt
                            ? new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Just now'}
                        </span>
                      </div>

                      <div
                        className={`max-w-lg px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                          isOwnMsg
                            ? 'bg-airbnb text-white rounded-br-xs'
                            : isHostMsg
                            ? 'bg-white border border-gray-200 text-dark rounded-bl-xs'
                            : 'bg-dark text-white rounded-bl-xs'
                        }`}
                      >
                        <p>{msg.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Inquiry Chips & Message Input Box */}
            <div className="p-4 sm:px-6 bg-white border-t border-gray-100 space-y-3">
              {senderRole === 'GUEST' && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  <span className="text-[10px] font-bold uppercase text-secondary shrink-0 mr-1">
                    Quick Ask:
                  </span>
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendMessage(null, q)}
                      className="px-3 py-1 rounded-full bg-gray-100 hover:bg-dark hover:text-white text-[11px] font-semibold text-dark transition shrink-0 cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={(e) => handleSendMessage(e)} className="flex items-center gap-2.5">
                <input
                  type="text"
                  placeholder={
                    senderRole === 'HOST'
                      ? `Reply as Host (${activeProperty?.host?.name})...`
                      : `Message ${activeProperty?.host?.name} in real time...`
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 p-3.5 rounded-2xl border border-borderLight bg-gray-50/70 focus:bg-white text-xs sm:text-sm text-dark focus:border-dark focus:outline-none font-medium"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="px-5 py-3.5 rounded-2xl bg-airbnb hover:bg-airbnb-hover text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  <span>Send</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
