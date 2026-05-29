'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// ─── Supabase client (browser only) ──────────────────────
let supabase = null;
if (typeof window !== 'undefined') {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// ─── Helpers ─────────────────────────────────────────────
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderMarkdown(text) {
  let html = escapeHtml(text);
  html = html.replace(/^### (.+)$/gm, '<strong style="font-size:15px;display:block;margin:12px 0 4px">$1</strong>');
  html = html.replace(/^## (.+)$/gm, '<strong style="font-size:16px;display:block;margin:14px 0 4px">$1</strong>');
  html = html.replace(/^# (.+)$/gm, '<strong style="font-size:18px;display:block;margin:16px 0 6px">$1</strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(
    /`(.*?)`/g,
    '<code>$1</code>'
  );
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  html = html.replace(/^\d+\. (.+)$/gm, '<div class="md-list-item">$1</div>');
  html = html.replace(/^- (.+)$/gm, '<div class="md-list-item">$1</div>');
  html = html.replace(
    /^&bull; (.+)$/gm,
    '<div class="md-list-item">$1</div>'
  );
  html = html.replace(/\n/g, '<br>');
  return html;
}

const ROLE_BADGES = {
  cd: '#003262',
  am: '#008FA4',
  spa: '#2d8a4e',
  mentor: '#e87722',
  instructor: '#6b46c1',
  other: '#666',
};

const SUGGESTED_QUESTIONS = [
  'What should I do in a medical emergency?',
  'Where can I find the daily schedule?',
  'How do I report an incident?',
  'What are the important campus phone numbers?',
];

// ─── LocalStorage helpers for conversation history ───────
function loadConversations() {
  try {
    const raw = localStorage.getItem('ssb-conversations');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConversations(convos) {
  try {
    localStorage.setItem('ssb-conversations', JSON.stringify(convos));
  } catch {
    // storage full or unavailable
  }
}

function groupConversationsByDate(convos) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups = { today: [], yesterday: [], week: [], older: [] };

  convos
    .slice()
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .forEach((c) => {
      const d = new Date(c.updatedAt);
      if (d >= today) groups.today.push(c);
      else if (d >= yesterday) groups.yesterday.push(c);
      else if (d >= weekAgo) groups.week.push(c);
      else groups.older.push(c);
    });

  return groups;
}

// ─── Main App Component ─────────────────────────────────
export default function ChatApp() {
  // Auth state
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [view, setView] = useState('loading'); // loading | login | onboarding | chat

  // Login state
  const [magicEmail, setMagicEmail] = useState('');
  const [magicStatus, setMagicStatus] = useState({ text: '', type: '' });
  const [magicSending, setMagicSending] = useState(false);

  // Onboarding state
  const [onboardName, setOnboardName] = useState('');
  const [onboardRole, setOnboardRole] = useState('');
  const [onboardBotName, setOnboardBotName] = useState('');
  const [onboardSubmitting, setOnboardSubmitting] = useState(false);
  const [onboardErrors, setOnboardErrors] = useState({});

  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Sidebar / conversations
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConvoId, setActiveConvoId] = useState(null);

  // Install prompt
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [settingsName, setSettingsName] = useState('');
  const [settingsRole, setSettingsRole] = useState('');
  const [settingsBotName, setSettingsBotName] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaveText, setSettingsSaveText] = useState('Save changes');
  const [settingsNameError, setSettingsNameError] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const sessionIdRef = useRef(null);

  // ─── PWA install prompt ─────────────────────────────────
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return;

    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      if (!localStorage.getItem('install-dismissed')) {
        setShowInstallBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);

    // For Safari/iOS - show banner if not installed and not dismissed
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if ((isSafari || isIOS) && !localStorage.getItem('install-dismissed')) {
      setTimeout(() => setShowInstallBanner(true), 3000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // ─── Init sessionId and load conversations ─────────────
  useEffect(() => {
    sessionIdRef.current = crypto.randomUUID();
    setConversations(loadConversations());
    if (window.innerWidth > 768) {
      setSidebarOpen(true);
    }
  }, []);

  // ─── Auth ──────────────────────────────────────────────
  const fetchProfile = useCallback(async (sess) => {
    try {
      const response = await fetch('/api/chat/profile', {
        headers: { Authorization: 'Bearer ' + sess.access_token },
      });

      if (response.ok) {
        const data = await response.json();
        const profile = data.profile || data;
        setUserProfile(profile);

        if (!profile.name || !profile.role) {
          if (sess.user?.email) {
            const emailName = sess.user.email.split('@')[0];
            const prefill = emailName
              .replace(/[._]/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase());
            setOnboardName(prefill);
          }
          setView('onboarding');
        } else {
          setView('chat');
        }
      } else if (response.status === 404) {
        setUserProfile({});
        if (sess.user?.email) {
          const emailName = sess.user.email.split('@')[0];
          const prefill = emailName
            .replace(/[._]/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
          setOnboardName(prefill);
        }
        setView('onboarding');
      } else {
        setView('onboarding');
      }
    } catch (err) {
      console.error('fetchProfile error:', err);
      setUserProfile({});
      setView('onboarding');
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function checkAuth() {
      try {
        const {
          data: { session: sess },
          error,
        } = await supabase.auth.getSession();

        if (ignore) return;
        if (error) {
          console.error('Auth session error:', error);
          setView('login');
          return;
        }

        if (sess) {
          setSession(sess);
          await fetchProfile(sess);
        } else {
          setView('login');
        }
      } catch (err) {
        console.error('checkAuth error:', err);
        if (!ignore) setView('login');
      }
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, sess) => {
      if (event === 'SIGNED_IN' && sess) {
        setSession(sess);
        await fetchProfile(sess);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUserProfile(null);
        setView('login');
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // ─── Auto-scroll ───────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
      }
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // ─── Focus input when chat loads ───────────────────────
  useEffect(() => {
    if (view === 'chat' && inputRef.current && window.innerWidth > 768) {
      inputRef.current.focus();
    }
  }, [view]);

  // ─── Auto-resize textarea ─────────────────────────────
  const autoResizeTextarea = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const newHeight = Math.min(inputRef.current.scrollHeight, 150);
      inputRef.current.style.height = newHeight + 'px';
    }
  }, []);

  // ─── Login handlers ───────────────────────────────────
  const handleGoogleSignIn = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) console.error('Google sign-in error:', error);
    } catch (err) {
      console.error('Google sign-in error:', err);
    }
  }, []);

  const handleMagicLink = useCallback(async () => {
    const email = magicEmail.trim();
    if (!email) return;

    setMagicSending(true);
    setMagicStatus({ text: '', type: '' });

    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        setMagicStatus({ text: error.message, type: 'error' });
      } else {
        setMagicStatus({ text: 'Check your email for the login link!', type: 'success' });
      }
    } catch {
      setMagicStatus({ text: 'Something went wrong. Please try again.', type: 'error' });
    }

    setMagicSending(false);
  }, [magicEmail]);

  // ─── Onboarding handler ───────────────────────────────
  const handleOnboardingSubmit = useCallback(async () => {
    const name = onboardName.trim();
    const role = onboardRole;
    const botName = onboardBotName.trim() || 'Summer';

    const errors = {};
    if (!name) errors.name = true;
    if (!role) errors.role = true;
    setOnboardErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setOnboardSubmitting(true);

    try {
      const response = await fetch('/api/chat/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + session.access_token,
        },
        body: JSON.stringify({ name, role, bot_name: botName }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.profile || data);
      } else {
        setUserProfile({ name, role, bot_name: botName });
      }
    } catch (err) {
      console.error('Onboarding save error:', err);
      setUserProfile({ name, role, bot_name: botName });
    }

    setMessages([]);
    setChatHistory([]);
    setView('chat');
    setOnboardSubmitting(false);
  }, [onboardName, onboardRole, onboardBotName, session]);

  // ─── Settings handlers ────────────────────────────────
  const openSettings = useCallback(() => {
    setSettingsName(userProfile?.name || '');
    setSettingsRole(userProfile?.role || '');
    setSettingsBotName(userProfile?.bot_name || 'Summer');
    setSettingsSaveText('Save changes');
    setSettingsNameError(false);
    setShowSettings(true);
  }, [userProfile]);

  const closeSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  const handleSettingsSave = useCallback(async () => {
    const newName = settingsName.trim();
    const newRole = settingsRole;
    const newBotName = settingsBotName.trim() || 'Summer';

    if (!newName) {
      setSettingsNameError(true);
      return;
    }
    setSettingsNameError(false);
    setSettingsSaving(true);
    setSettingsSaveText('Saving...');

    try {
      const response = await fetch('/api/chat/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + session.access_token,
        },
        body: JSON.stringify({ name: newName, role: newRole, bot_name: newBotName }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.profile || data);
      } else {
        setUserProfile((prev) => ({ ...prev, name: newName, role: newRole, bot_name: newBotName }));
      }

      setSettingsSaveText('Saved!');
      setTimeout(() => closeSettings(), 600);
    } catch (err) {
      console.error('Settings save error:', err);
      setSettingsSaving(false);
      setSettingsSaveText('Save changes');
    }
  }, [settingsName, settingsRole, settingsBotName, session, closeSettings]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
    setShowSettings(false);
    setMessages([]);
    setChatHistory([]);
    setView('login');
  }, []);

  const handleInstall = useCallback(async () => {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      setShowInstallBanner(false);
    }
  }, [installPrompt]);

  const dismissInstall = useCallback(() => {
    setShowInstallBanner(false);
    localStorage.setItem('install-dismissed', 'true');
  }, []);

  // ─── Conversation management ──────────────────────────
  const saveCurrentConversation = useCallback(
    (msgs) => {
      if (!activeConvoId || msgs.length === 0) return;

      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === activeConvoId
            ? { ...c, messages: msgs, updatedAt: new Date().toISOString() }
            : c
        );
        // If this convo doesn't exist yet, add it
        if (!prev.find((c) => c.id === activeConvoId)) {
          const firstUserMsg = msgs.find((m) => m.role === 'user');
          updated.unshift({
            id: activeConvoId,
            preview: firstUserMsg?.content?.slice(0, 60) || 'New conversation',
            messages: msgs,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
        saveConversations(updated);
        return updated;
      });
    },
    [activeConvoId]
  );

  const startNewChat = useCallback(() => {
    // Save current if it has user messages
    if (activeConvoId && messages.some((m) => m.role === 'user')) {
      saveCurrentConversation(messages);
    }

    const newId = crypto.randomUUID();
    sessionIdRef.current = newId;
    setActiveConvoId(newId);
    setMessages([]);
    setChatHistory([]);

    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }, [activeConvoId, messages, saveCurrentConversation]);

  const loadConversation = useCallback(
    (convo) => {
      // Save current first
      if (activeConvoId && messages.some((m) => m.role === 'user')) {
        saveCurrentConversation(messages);
      }

      sessionIdRef.current = convo.id;
      setActiveConvoId(convo.id);
      setMessages(convo.messages || []);
      setChatHistory(
        (convo.messages || []).filter((m) => m.role === 'user' || m.role === 'assistant')
      );

      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      }
    },
    [activeConvoId, messages, saveCurrentConversation]
  );

  const deleteConversation = useCallback(
    (convoId, e) => {
      e.stopPropagation();
      setConversations((prev) => {
        const updated = prev.filter((c) => c.id !== convoId);
        saveConversations(updated);
        return updated;
      });
      if (activeConvoId === convoId) {
        setMessages([]);
        setChatHistory([]);
        setActiveConvoId(null);
        sessionIdRef.current = crypto.randomUUID();
      }
    },
    [activeConvoId]
  );

  // ─── Send message ─────────────────────────────────────
  const sendMessage = useCallback(
    async (overrideText) => {
      const text = (overrideText || inputValue).trim();
      if (!text || isTyping) return;

      if (!session) {
        setView('login');
        return;
      }

      // If no active convo, create one
      if (!activeConvoId) {
        const newId = sessionIdRef.current || crypto.randomUUID();
        sessionIdRef.current = newId;
        setActiveConvoId(newId);
      }

      const userMessage = {
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
      setIsTyping(true);

      const recentHistory = chatHistory.slice(-20).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      try {
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + session.access_token,
          },
          body: JSON.stringify({
            message: text,
            history: recentHistory,
            sessionId: sessionIdRef.current,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        setIsTyping(false);

        const assistantMessage = {
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'text') {
                  fullResponse += data.text;
                  const updatedContent = fullResponse;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      content: updatedContent,
                    };
                    return updated;
                  });
                }
              } catch (e) {
                console.error('JSON parse error:', e);
              }
            }
          }
        }

        // Update history
        const finalUserMsg = userMessage;
        const finalAssistantMsg = {
          role: 'assistant',
          content: fullResponse,
          timestamp: new Date().toISOString(),
        };
        setChatHistory((prev) => [...prev, finalUserMsg, finalAssistantMsg]);

        // Save conversation to localStorage
        setMessages((currentMsgs) => {
          // Use a timeout so state is settled
          setTimeout(() => {
            const convoId = sessionIdRef.current;
            setConversations((prevConvos) => {
              const existing = prevConvos.find((c) => c.id === convoId);
              let updated;
              if (existing) {
                updated = prevConvos.map((c) =>
                  c.id === convoId
                    ? { ...c, messages: currentMsgs, updatedAt: new Date().toISOString() }
                    : c
                );
              } else {
                updated = [
                  {
                    id: convoId,
                    preview: text.slice(0, 60),
                    messages: currentMsgs,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                  ...prevConvos,
                ];
              }
              saveConversations(updated);
              return updated;
            });
          }, 100);
          return currentMsgs;
        });

        // Re-focus input on desktop
        if (window.innerWidth > 768 && inputRef.current) {
          inputRef.current.focus();
        }
      } catch (error) {
        console.error('Chat error:', error);
        setIsTyping(false);

        const errorMessage = {
          role: 'assistant',
          content: `I'm having trouble connecting to the server.\n\n**To fix this:**\n1. Make sure the backend is running\n2. Refresh this page\n\nFor urgent help, call SSB 24/7 Helpline: **+1.858.779.0555**`,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      }
    },
    [inputValue, isTyping, session, chatHistory, activeConvoId]
  );

  // ─── Key handler ───────────────────────────────────────
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // ─── Derived values ───────────────────────────────────
  const botName = userProfile?.bot_name || 'Summer';
  const userName = userProfile?.name || 'there';
  const userRole = userProfile?.role || '';
  const userInitial = userName.charAt(0).toUpperCase();
  const groupedConvos = useMemo(() => groupConversationsByDate(conversations), [conversations]);

  // ─── Render: Loading ──────────────────────────────────
  if (view === 'loading') {
    return (
      <div className="loading-screen">
        <img
          src="/images/cal-bear-avatar.webp"
          alt="Loading"
          className="loading-bear"
        />
        <p>Loading...</p>
      </div>
    );
  }

  // ─── Render: Login ────────────────────────────────────
  if (view === 'login') {
    return (
      <div className="login-screen">
        <div className="login-card">
          <img
            src="/images/cal-bear-full.png"
            alt="Cal Bear"
            className="login-bear-img"
          />
          <h1 className="login-title">Summer</h1>
          <p className="login-subtitle">SSB Staff Assistant</p>

          <button className="login-google-btn" onClick={handleGoogleSignIn}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>

          <div className="login-divider">
            <span>or</span>
          </div>

          <div className="login-magic-link">
            <input
              type="email"
              className="login-email-input"
              placeholder="your@email.com"
              value={magicEmail}
              onChange={(e) => setMagicEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleMagicLink();
              }}
            />
            <button
              className="login-magic-btn"
              onClick={handleMagicLink}
              disabled={magicSending}
            >
              {magicSending ? 'Sending...' : 'Send magic link'}
            </button>
          </div>

          {magicStatus.text && (
            <p className={`login-magic-status ${magicStatus.type}`}>
              {magicStatus.text}
            </p>
          )}
          <p className="login-note">Use your @summerspringboard.com email</p>
        </div>
      </div>
    );
  }

  // ─── Render: Onboarding ───────────────────────────────
  if (view === 'onboarding') {
    return (
      <div className="onboarding-overlay">
        <div className="onboarding-modal">
          <img
            src="/images/cal-bear-avatar.webp"
            alt="Summer"
            className="onboarding-bear"
          />
          <h2 className="onboarding-title">Welcome to SSB!</h2>
          <p className="onboarding-subtitle">Let&apos;s set up your assistant</p>

          <div className="onboarding-field">
            <label htmlFor="onboard-name">Your name</label>
            <input
              type="text"
              id="onboard-name"
              className={`onboarding-input${onboardErrors.name ? ' input-error' : ''}`}
              value={onboardName}
              onChange={(e) => {
                setOnboardName(e.target.value);
                setOnboardErrors((prev) => ({ ...prev, name: false }));
              }}
              placeholder="First Last"
            />
          </div>

          <div className="onboarding-field">
            <label htmlFor="onboard-role">Your role</label>
            <select
              id="onboard-role"
              className={`onboarding-select${onboardErrors.role ? ' input-error' : ''}`}
              value={onboardRole}
              onChange={(e) => {
                setOnboardRole(e.target.value);
                setOnboardErrors((prev) => ({ ...prev, role: false }));
              }}
            >
              <option value="" disabled>
                Select your role
              </option>
              <option value="CD">CD</option>
              <option value="AM">AM</option>
              <option value="SPA">SPA</option>
              <option value="Mentor">Mentor</option>
              <option value="Instructor">Instructor</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="onboarding-field">
            <label htmlFor="onboard-botname">Name your assistant</label>
            <input
              type="text"
              id="onboard-botname"
              className="onboarding-input"
              value={onboardBotName}
              onChange={(e) => setOnboardBotName(e.target.value)}
              placeholder="Summer"
            />
          </div>

          <button
            className="onboarding-submit"
            onClick={handleOnboardingSubmit}
            disabled={onboardSubmitting}
          >
            {onboardSubmitting ? 'Setting up...' : 'Get Started'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Render: Chat Interface ───────────────────────────
  const hasMessages = messages.length > 0;

  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);

  return (
    <div className="chat-app">
      {/* Install banner */}
      {showInstallBanner && (
        <div className="install-banner">
          <div className="install-banner-content">
            <img src="/images/cal-bear-avatar.webp" alt="" className="install-banner-icon" />
            <div className="install-banner-text">
              {installPrompt ? (
                <>
                  <strong>Install Summer</strong>
                  <span>Add to your home screen for quick access</span>
                </>
              ) : isIOS ? (
                <>
                  <strong>Add to Home Screen</strong>
                  <span>Tap <strong>Share</strong> then <strong>&quot;Add to Home Screen&quot;</strong></span>
                </>
              ) : (
                <>
                  <strong>Add to Home Screen</strong>
                  <span>Open browser menu and tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home Screen&quot;</strong></span>
                </>
              )}
            </div>
            {installPrompt ? (
              <button className="install-banner-btn" onClick={handleInstall}>Install</button>
            ) : null}
            <button className="install-banner-dismiss" onClick={dismissInstall}>×</button>
          </div>
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
              <img
                src="/images/cal-bear-avatar.webp"
                alt={botName}
                className="sidebar-bear"
              />
              <span className="sidebar-bot-name">{escapeHtml(botName)}</span>
            </div>
            <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <button className="new-chat-btn" onClick={startNewChat} title="New chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New chat
          </button>
        </div>

        <div className="sidebar-conversations">
          {conversations.length === 0 ? (
            <div className="sidebar-empty">No conversations yet</div>
          ) : (
            <>
              {groupedConvos.today.length > 0 && (
                <div className="convo-group">
                  <div className="convo-group-label">Today</div>
                  {groupedConvos.today.map((c) => (
                    <div
                      key={c.id}
                      className={`convo-item${activeConvoId === c.id ? ' active' : ''}`}
                      onClick={() => loadConversation(c)}
                    >
                      <span className="convo-preview">{c.preview}</span>
                      <button
                        className="convo-delete"
                        onClick={(e) => deleteConversation(c.id, e)}
                        title="Delete"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {groupedConvos.yesterday.length > 0 && (
                <div className="convo-group">
                  <div className="convo-group-label">Yesterday</div>
                  {groupedConvos.yesterday.map((c) => (
                    <div
                      key={c.id}
                      className={`convo-item${activeConvoId === c.id ? ' active' : ''}`}
                      onClick={() => loadConversation(c)}
                    >
                      <span className="convo-preview">{c.preview}</span>
                      <button
                        className="convo-delete"
                        onClick={(e) => deleteConversation(c.id, e)}
                        title="Delete"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {groupedConvos.week.length > 0 && (
                <div className="convo-group">
                  <div className="convo-group-label">Previous 7 Days</div>
                  {groupedConvos.week.map((c) => (
                    <div
                      key={c.id}
                      className={`convo-item${activeConvoId === c.id ? ' active' : ''}`}
                      onClick={() => loadConversation(c)}
                    >
                      <span className="convo-preview">{c.preview}</span>
                      <button
                        className="convo-delete"
                        onClick={(e) => deleteConversation(c.id, e)}
                        title="Delete"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {groupedConvos.older.length > 0 && (
                <div className="convo-group">
                  <div className="convo-group-label">Older</div>
                  {groupedConvos.older.map((c) => (
                    <div
                      key={c.id}
                      className={`convo-item${activeConvoId === c.id ? ' active' : ''}`}
                      onClick={() => loadConversation(c)}
                    >
                      <span className="convo-preview">{c.preview}</span>
                      <button
                        className="convo-delete"
                        onClick={(e) => deleteConversation(c.id, e)}
                        title="Delete"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div
              className="sidebar-user-avatar"
              style={{
                background: ROLE_BADGES[userRole.toLowerCase()] || ROLE_BADGES.other,
              }}
            >
              {userInitial}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{escapeHtml(userName)}</span>
              {userRole && (
                <span
                  className="sidebar-role-badge"
                  style={{
                    background: ROLE_BADGES[userRole.toLowerCase()] || ROLE_BADGES.other,
                  }}
                >
                  {escapeHtml(userRole)}
                </span>
              )}
            </div>
            <button className="sidebar-settings-btn" onClick={openSettings} title="Settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
          <button className="sidebar-signout" onClick={handleSignOut}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main chat area */}
      <main className="chat-main">
        {/* Mobile header */}
        <div className="chat-header-mobile">
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="chat-header-title">{escapeHtml(botName)}</span>
          <button className="new-chat-btn-mobile" onClick={openSettings} title="Settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>

        {/* Messages area */}
        <div className="messages-area">
          <div className="messages-container">
            {!hasMessages ? (
              /* Welcome screen */
              <div className="welcome-screen">
                <img
                  src="/images/cal-bear-avatar.webp"
                  alt={botName}
                  className="welcome-bear"
                />
                <h2 className="welcome-title">How can I help you today?</h2>
                <p className="welcome-subtitle">
                  I&apos;m {escapeHtml(botName)}, your SSB staff assistant. Ask me about schedules, emergency procedures, campus resources, and more.
                </p>
                <div className="suggested-questions">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      className="suggested-question"
                      onClick={() => sendMessage(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Message list */
              <>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.role}`}>
                    {msg.role === 'assistant' ? (
                      <>
                        <img
                          src="/images/cal-bear-avatar.webp"
                          alt={botName}
                          className="message-avatar"
                        />
                        <div
                          className="message-bubble"
                          dangerouslySetInnerHTML={{
                            __html: renderMarkdown(msg.content),
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <div className="message-bubble">{msg.content}</div>
                        <div
                          className="message-avatar user-avatar"
                          style={{
                            background:
                              ROLE_BADGES[userRole.toLowerCase()] || ROLE_BADGES.other,
                          }}
                        >
                          {userInitial}
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="message assistant">
                    <img
                      src="/images/cal-bear-avatar.webp"
                      alt={botName}
                      className="message-avatar"
                    />
                    <div className="typing-indicator">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input bar */}
        <div className="input-bar">
          <div className="input-bar-inner">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder={`Message ${escapeHtml(botName)}...`}
              rows="1"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                autoResizeTextarea();
              }}
              onKeyDown={handleKeyDown}
            />
            <button
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={isTyping || !inputValue.trim()}
              title="Send message"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="input-hint">Press Enter to send, Shift+Enter for new line</p>
        </div>
      </main>

      {/* Settings modal */}
      {showSettings && (
        <div className="settings-overlay" onClick={closeSettings}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <h3>Settings</h3>
              <button className="settings-close" onClick={closeSettings}>
                &times;
              </button>
            </div>

            <div className="settings-body">
              <div className="settings-field">
                <label htmlFor="settings-name">Your name</label>
                <input
                  type="text"
                  id="settings-name"
                  className={`settings-input${settingsNameError ? ' input-error' : ''}`}
                  value={settingsName}
                  onChange={(e) => {
                    setSettingsName(e.target.value);
                    setSettingsNameError(false);
                  }}
                />
              </div>

              <div className="settings-field">
                <label htmlFor="settings-role">Your role</label>
                <select
                  id="settings-role"
                  className="settings-select"
                  value={settingsRole}
                  onChange={(e) => setSettingsRole(e.target.value)}
                >
                  <option value="CD">CD</option>
                  <option value="AM">AM</option>
                  <option value="SPA">SPA</option>
                  <option value="Mentor">Mentor</option>
                  <option value="Instructor">Instructor</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="settings-field">
                <label htmlFor="settings-botname">Assistant name</label>
                <input
                  type="text"
                  id="settings-botname"
                  className="settings-input"
                  value={settingsBotName}
                  onChange={(e) => setSettingsBotName(e.target.value)}
                />
              </div>

              <button
                className="settings-save"
                onClick={handleSettingsSave}
                disabled={settingsSaving}
              >
                {settingsSaveText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
