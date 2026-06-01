'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ─── Clipboard copy helper ─────────────────────────────
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers / insecure context
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}

// ─── Export conversation as .txt ────────────────────────
function exportConversation(messages, botName) {
  const lines = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => {
      const prefix = m.role === 'user' ? 'You' : 'Assistant';
      return `${prefix}: ${m.content}`;
    })
    .join('\n\n');
  const blob = new Blob([lines], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `conversation-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// ─── In-app browser detection (runs before anything else) ──
function isInAppBrowser() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|Instagram|WhatsApp|Snapchat|Line|Twitter|LinkedIn|MicroMessenger/i.test(ua);
}

// ─── Supabase client (browser only, skip for in-app browsers) ──
let supabase = null;
if (typeof window !== 'undefined' && !isInAppBrowser()) {
  try {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  } catch (e) {
    // Supabase init failed - app will show login screen
  }
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
  html = html.replace(/^### (.+)$/gm, '<strong style="font-size:15px;display:block;margin:8px 0 2px">$1</strong>');
  html = html.replace(/^## (.+)$/gm, '<strong style="font-size:16px;display:block;margin:10px 0 2px">$1</strong>');
  html = html.replace(/^# (.+)$/gm, '<strong style="font-size:17px;display:block;margin:12px 0 4px">$1</strong>');
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
  // Convert newlines: collapse multiple into a single paragraph break
  html = html.replace(/\n{2,}/g, '<br><br>');
  html = html.replace(/\n/g, '<br>');
  // Clean up excessive breaks
  html = html.replace(/(<br>){3,}/g, '<br><br>');
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

// ─── Conversation helpers ────────────────────────────────
async function fetchConversationsFromServer(accessToken) {
  try {
    const res = await fetch('/api/chat/conversations', {
      headers: { Authorization: 'Bearer ' + accessToken },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.conversations || [];
  } catch {
    return [];
  }
}

async function deleteConversationFromServer(sessionId, accessToken) {
  try {
    await fetch('/api/chat/conversations?session_id=' + sessionId, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + accessToken },
    });
  } catch {
    // silent
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
// ─── In-app browser gate (no React state, no Supabase, can't crash) ──
function InAppBrowserGate() {
  const url = typeof window !== 'undefined' ? window.location.origin : '';
  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent || '');

  const openInBrowser = () => {
    try {
      // On iOS, window.open with the URL can trigger Safari
      // On Android, intent:// URL triggers Chrome
      if (isIOS) {
        // Can't programmatically open Safari from in-app browser, so just show instructions
      } else {
        window.open(url, '_system');
      }
    } catch (e) { /* */ }
  };

  const copyLink = () => {
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
    } catch (e) { /* */ }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', padding: '24px',
      background: 'linear-gradient(135deg, #f0f4f8 0%, #e8eef5 50%, #f5f3f0 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', padding: '40px 32px',
        maxWidth: '400px', width: '100%', textAlign: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        <img src="/images/cal-bear-avatar.webp" alt="Summer" style={{
          width: '72px', height: '72px', borderRadius: '50%', marginBottom: '16px',
        }} />
        <h1 style={{ color: '#003262', fontSize: '22px', fontWeight: 700, margin: '0 0 8px' }}>
          Open in your browser
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5', margin: '0 0 24px' }}>
          This app works best in {isIOS ? 'Safari' : 'Chrome'}. Copy the link below and open it in your browser.
        </p>
        <div style={{
          background: '#f1f5f9', borderRadius: '10px', padding: '12px 16px',
          fontSize: '13px', color: '#334155', marginBottom: '16px', wordBreak: 'break-all',
        }}>
          {url}
        </div>
        <button onClick={copyLink} style={{
          width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
          background: '#003262', color: 'white', fontSize: '16px', fontWeight: 700,
          cursor: 'pointer', marginBottom: '12px',
        }}>
          Copy Link
        </button>
        {isIOS && (
          <p style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.5', margin: 0 }}>
            Open <strong>Safari</strong>, tap the address bar, paste the link, and hit Go
          </p>
        )}
        {!isIOS && (
          <button onClick={openInBrowser} style={{
            width: '100%', padding: '14px', borderRadius: '10px',
            border: '1px solid #e2e8f0', background: 'white',
            color: '#003262', fontSize: '16px', fontWeight: 600, cursor: 'pointer',
          }}>
            Try opening in Chrome
          </button>
        )}
      </div>
    </div>
  );
}

export default function ChatAppWrapper() {
  const [inApp, setInApp] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setInApp(isInAppBrowser());
    setChecked(true);
  }, []);

  if (!checked) return null;
  if (inApp) return <InAppBrowserGate />;
  return <ChatAppInner />;
}

function ChatAppInner() {
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

  // (reserved for hook order)
  const [_ip] = useState(null);
  const [_sib] = useState(false);

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
  const abortRef = useRef(null);
  const messagesAreaRef = useRef(null);

  // UX feature state
  const [copiedMsgIdx, setCopiedMsgIdx] = useState(null);
  const [feedbackIdx, setFeedbackIdx] = useState({}); // { idx: 'up' | 'down' }
  const [isOnline, setIsOnline] = useState(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Inline edit state
  const [editingMessageIdx, setEditingMessageIdx] = useState(null);
  const [editText, setEditText] = useState('');

  // (reserved for hook order)
  useEffect(() => {}, []);

  // ─── Init sessionId ────────────────────────────────────
  useEffect(() => {
    sessionIdRef.current = crypto.randomUUID();
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

        // Sync Google avatar if not stored yet
        const googleAvatar = sess.user?.user_metadata?.avatar_url || sess.user?.user_metadata?.picture;
        if (googleAvatar && !profile.avatar_url) {
          fetch('/api/chat/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + sess.access_token },
            body: JSON.stringify({ avatar_url: googleAvatar }),
          }).catch(() => {});
          profile.avatar_url = googleAvatar;
        }

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
          // Load conversations from server
          const convos = await fetchConversationsFromServer(sess.access_token);
          setConversations(convos);
          // Restore conversation from URL if present
          const urlParams = new URLSearchParams(window.location.search);
          const urlConvoId = urlParams.get('c');
          if (urlConvoId) {
            const match = convos.find((c) => c.id === urlConvoId);
            if (match) {
              sessionIdRef.current = match.id;
              setActiveConvoId(match.id);
              setMessages(match.messages || []);
              setChatHistory((match.messages || []).filter((m) => m.role === 'user' || m.role === 'assistant'));
            }
          }
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
    if (!supabase) {
      setView('login');
      return;
    }

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
      if (ignore) return;
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

  // ─── Online/Offline detection ──────────────────────────
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // ─── Scroll position tracking ─────────────────────────
  const handleMessagesScroll = useCallback(() => {
    const el = messagesAreaRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 100;
    setShowScrollBtn(!atBottom);
  }, []);

  const scrollToBottomSmooth = useCallback(() => {
    const el = messagesAreaRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, []);

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

  // ─── Copy message handler ──────────────────────────────
  const handleCopyMessage = useCallback(async (text, idx) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedMsgIdx(idx);
      setTimeout(() => setCopiedMsgIdx(null), 1500);
    }
  }, []);

  const handleFeedback = useCallback((idx, type) => {
    setFeedbackIdx((prev) => ({ ...prev, [idx]: prev[idx] === type ? null : type }));
    fetch('/api/chat/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: session ? 'Bearer ' + session.access_token : '' },
      body: JSON.stringify({ messageId: idx, helpful: type === 'up' }),
    }).catch(() => {});
  }, [session]);

  // ─── Stop generating handler ─────────────────────────
  const handleStopGenerating = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsTyping(false);
  }, []);

  // ─── Regenerate last response ─────────────────────────
  // sendMessageRef will be set after sendMessage is defined
  const sendMessageRef = useRef(null);

  const handleRegenerate = useCallback(() => {
    if (messages.length < 2) return;
    // Find the last user message
    let lastUserMsg = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMsg = messages[i];
        break;
      }
    }
    if (!lastUserMsg) return;
    // Remove the last assistant message
    setMessages((prev) => {
      const copy = [...prev];
      if (copy.length > 0 && copy[copy.length - 1].role === 'assistant') {
        copy.pop();
      }
      return copy;
    });
    setChatHistory((prev) => {
      const copy = [...prev];
      if (copy.length > 0 && copy[copy.length - 1].role === 'assistant') {
        copy.pop();
      }
      if (copy.length > 0 && copy[copy.length - 1].role === 'user') {
        copy.pop();
      }
      return copy;
    });
    // Re-send via ref to avoid circular dependency
    setTimeout(() => {
      if (sendMessageRef.current) sendMessageRef.current(lastUserMsg.content);
    }, 50);
  }, [messages]);

  // ─── Inline edit: start editing a user message ────────
  const handleEditMessage = useCallback((msgIdx) => {
    const msg = messages[msgIdx];
    if (!msg || msg.role !== 'user') return;
    setEditingMessageIdx(msgIdx);
    setEditText(msg.content);
  }, [messages]);

  // ─── Inline edit: cancel ─────────────────────────────
  const handleEditCancel = useCallback(() => {
    setEditingMessageIdx(null);
    setEditText('');
  }, []);

  // ─── Inline edit: save & submit ──────────────────────
  const handleEditSave = useCallback(() => {
    if (editingMessageIdx === null) return;
    const newText = editText.trim();
    if (!newText) return;

    // Remove this message and everything after it
    const idx = editingMessageIdx;
    setMessages((prev) => prev.slice(0, idx));
    setChatHistory((prev) => {
      const remaining = messages.slice(0, idx).filter((m) => m.role === 'user' || m.role === 'assistant');
      return remaining;
    });

    // Reset edit state
    setEditingMessageIdx(null);
    setEditText('');

    // Send the edited message
    setTimeout(() => {
      if (sendMessageRef.current) sendMessageRef.current(newText);
    }, 50);
  }, [editingMessageIdx, editText, messages]);

  // ─── Login handlers ───────────────────────────────────
  const handleGoogleSignIn = useCallback(async () => {
    if (!supabase) return;
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
      if (!supabase) { setMagicStatus({ text: 'Service unavailable. Try again.', type: 'error' }); setMagicSending(false); return; }
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
    if (session) {
      const convos = await fetchConversationsFromServer(session.access_token);
      setConversations(convos);
    }
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
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
    setShowSettings(false);
    setMessages([]);
    setChatHistory([]);
    setView('login');
  }, []);

  // (reserved for hook order)
  const _hi = useCallback(() => {}, []);
  const _di = useCallback(() => {}, []);

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
        // Persisted via Supabase query logging
        return updated;
      });
    },
    [activeConvoId]
  );

  const pushConvoUrl = useCallback((id) => {
    if (id) {
      window.history.pushState(null, '', `/?c=${id}`);
    } else {
      window.history.pushState(null, '', '/');
    }
  }, []);

  const startNewChat = useCallback(() => {
    const newId = crypto.randomUUID();
    sessionIdRef.current = newId;
    setActiveConvoId(newId);
    setMessages([]);
    setChatHistory([]);
    pushConvoUrl(null);

    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }, [activeConvoId, messages, saveCurrentConversation, pushConvoUrl]);

  // ─── Keyboard shortcuts ─────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        startNewChat();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startNewChat]);

  const loadConversation = useCallback(
    (convo) => {
      sessionIdRef.current = convo.id;
      setActiveConvoId(convo.id);
      setMessages(convo.messages || []);
      setChatHistory(
        (convo.messages || []).filter((m) => m.role === 'user' || m.role === 'assistant')
      );
      pushConvoUrl(convo.id);

      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      }
    },
    [pushConvoUrl]
  );

  const deleteConversation = useCallback(
    async (convoId, e) => {
      e.stopPropagation();
      if (session) {
        await deleteConversationFromServer(convoId, session.access_token);
      }
      setConversations((prev) => prev.filter((c) => c.id !== convoId));
      if (activeConvoId === convoId) {
        setMessages([]);
        setChatHistory([]);
        setActiveConvoId(null);
        sessionIdRef.current = crypto.randomUUID();
        pushConvoUrl(null);
      }
    },
    [activeConvoId, pushConvoUrl, session]
  );

  // ─── Send message ─────────────────────────────────────
  const sendMessage = useCallback(
    async (overrideText) => {
      const text = (overrideText || inputValue).trim();
      if (!text || isTyping) return;

      // Haptic feedback on mobile
      if (navigator.vibrate) navigator.vibrate(10);

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
        const controller = new AbortController();
        abortRef.current = controller;

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
          signal: controller.signal,
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

        // Wait one frame for React to render the empty assistant bubble
        await new Promise((r) => requestAnimationFrame(r));

        // Get direct DOM reference to the last message bubble for smooth streaming
        const bubbleEls = document.querySelectorAll('.message.assistant .message-bubble');
        const streamBubble = bubbleEls[bubbleEls.length - 1];

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';
        let displayedLen = 0;
        let streamDone = false;

        // Character-by-character reveal loop - plain text during streaming, markdown on finish
        const CHARS_PER_FRAME = 4;
        function revealLoop() {
          if (displayedLen < fullResponse.length) {
            displayedLen = Math.min(displayedLen + CHARS_PER_FRAME, fullResponse.length);
            if (streamBubble) {
              // Use textContent during streaming - no markdown flickering
              streamBubble.textContent = fullResponse.slice(0, displayedLen);
              streamBubble.style.whiteSpace = 'pre-wrap';
            }
            const area = document.querySelector('.messages-area');
            if (area) area.scrollTop = area.scrollHeight;
          }
          if (!streamDone || displayedLen < fullResponse.length) {
            requestAnimationFrame(revealLoop);
          } else {
            // Final render: switch to markdown
            if (streamBubble) {
              streamBubble.style.whiteSpace = '';
              streamBubble.innerHTML = renderMarkdown(fullResponse);
            }
          }
        }
        requestAnimationFrame(revealLoop);

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
                }
              } catch (e) {
                console.error('JSON parse error:', e);
              }
            }
          }
        }

        streamDone = true;
        // Wait for reveal loop to finish
        while (displayedLen < fullResponse.length) {
          await new Promise((r) => requestAnimationFrame(r));
        }

        // Sync final content back to React state (one render, not hundreds)
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: fullResponse,
          };
          return updated;
        });

        abortRef.current = null;

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
              // Persisted via Supabase query logging
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
        abortRef.current = null;
        // If aborted by user, keep partial response and stop cleanly
        if (error.name === 'AbortError') {
          setIsTyping(false);
          return;
        }

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

  // Keep ref in sync so handleRegenerate can call sendMessage
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

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
  const userAvatar = userProfile?.avatar_url || null;
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

  return (
    <div className="chat-app">
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
                      {activeConvoId === c.id && messages.length > 0 && (
                        <button
                          className="convo-export"
                          onClick={(e) => { e.stopPropagation(); exportConversation(messages, botName); }}
                          title="Export"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </button>
                      )}
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
                      {activeConvoId === c.id && messages.length > 0 && (
                        <button
                          className="convo-export"
                          onClick={(e) => { e.stopPropagation(); exportConversation(messages, botName); }}
                          title="Export"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </button>
                      )}
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
                      {activeConvoId === c.id && messages.length > 0 && (
                        <button
                          className="convo-export"
                          onClick={(e) => { e.stopPropagation(); exportConversation(messages, botName); }}
                          title="Export"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </button>
                      )}
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
                      {activeConvoId === c.id && messages.length > 0 && (
                        <button
                          className="convo-export"
                          onClick={(e) => { e.stopPropagation(); exportConversation(messages, botName); }}
                          title="Export"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </button>
                      )}
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
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="sidebar-user-avatar"
                style={{ objectFit: 'cover' }}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="sidebar-user-avatar"
                style={{
                  background: ROLE_BADGES[userRole.toLowerCase()] || ROLE_BADGES.other,
                }}
              >
                {userInitial}
              </div>
            )}
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
        {/* Top bar */}
        <div className="chat-topbar">
          <div className="chat-topbar-left">
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
            <span className="chat-topbar-title">{escapeHtml(botName)}</span>
          </div>
          <div className="chat-topbar-right">
            <Link href="/campus-memory" className="campus-info-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
              Campus Info
            </Link>
            {hasMessages && (
              <button
                className="topbar-export-btn"
                onClick={() => exportConversation(messages, botName)}
                title="Export conversation"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            )}
            <button className="topbar-settings-btn" onClick={openSettings} title="Settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>

        {/* REMOVED: old mobile-only header replaced by unified topbar */}
        <div className="chat-header-mobile" style={{ display: 'none' }}>
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
        <div className="messages-area" ref={messagesAreaRef} onScroll={handleMessagesScroll}>
          {/* Offline banner */}
          {!isOnline && (
            <div className="offline-banner">
              You&apos;re offline. Messages will send when you reconnect.
            </div>
          )}

          <div className="messages-container">
            {!hasMessages ? (
              /* Welcome screen */
              <div className="welcome-screen">
                <img
                  src="/images/cal-bear-avatar.webp"
                  alt={botName}
                  className="welcome-bear"
                />
                <h2 className="welcome-title">Heyo, I&apos;m {escapeHtml(botName)}</h2>
                <p className="welcome-subtitle">
                  Your SSB staff assistant.
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
                {messages.map((msg, idx) => {
                  const isLastAssistant =
                    msg.role === 'assistant' &&
                    idx === messages.length - 1 &&
                    !isTyping;

                  return (
                    <div key={idx} className={`message ${msg.role}`}>
                      {msg.role === 'assistant' ? (
                        <>
                          <img
                            src="/images/cal-bear-avatar.webp"
                            alt={botName}
                            className="message-avatar"
                          />
                          <div className="message-bubble-wrapper">
                            <div
                              className="message-bubble"
                              dangerouslySetInnerHTML={{
                                __html: renderMarkdown(msg.content),
                              }}
                            />
                            <div className="msg-actions">
                              <button className="msg-action-btn" onClick={() => handleCopyMessage(msg.content, idx)} title="Copy">
                                {copiedMsgIdx === idx ? (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                ) : (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                )}
                              </button>
                              <button className={`msg-action-btn${feedbackIdx[idx] === 'up' ? ' active' : ''}`} onClick={() => handleFeedback(idx, 'up')} title="Good response">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill={feedbackIdx[idx] === 'up' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>
                              </button>
                              <button className={`msg-action-btn${feedbackIdx[idx] === 'down' ? ' active' : ''}`} onClick={() => handleFeedback(idx, 'down')} title="Bad response">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill={feedbackIdx[idx] === 'down' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" /></svg>
                              </button>
                              {isLastAssistant && !isTyping && (
                                <button className="msg-action-btn" onClick={handleRegenerate} title="Regenerate">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="message-bubble-wrapper user-bubble-wrapper">
                            {editingMessageIdx === idx ? (
                              <div className="edit-inline">
                                <textarea
                                  className="edit-inline-textarea"
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleEditSave();
                                    }
                                    if (e.key === 'Escape') {
                                      handleEditCancel();
                                    }
                                  }}
                                  autoFocus
                                  rows={Math.min(editText.split('\n').length + 1, 8)}
                                />
                                <div className="edit-inline-actions">
                                  <button className="edit-inline-cancel" onClick={handleEditCancel}>Cancel</button>
                                  <button className="edit-inline-save" onClick={handleEditSave} disabled={!editText.trim()}>Save &amp; Submit</button>
                                </div>
                              </div>
                            ) : (
                              <div className="message-bubble">{msg.content}</div>
                            )}
                            {editingMessageIdx !== idx && (
                              <div className="msg-actions" style={{ justifyContent: 'flex-end' }}>
                                <span className="user-hover-timestamp">
                                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}
                                </span>
                                <button className="msg-action-btn" onClick={() => handleEditMessage(idx)} title="Edit">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                </button>
                                <button className="msg-action-btn" onClick={() => handleCopyMessage(msg.content, idx)} title="Copy">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                </button>
                              </div>
                            )}
                          </div>
                          {userAvatar ? (
                            <img
                              src={userAvatar}
                              alt={userName}
                              className="message-avatar"
                              style={{ objectFit: 'cover' }}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div
                              className="message-avatar user-avatar"
                              style={{
                                background:
                                  ROLE_BADGES[userRole.toLowerCase()] || ROLE_BADGES.other,
                              }}
                            >
                              {userInitial}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
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

          {/* Scroll to bottom button */}
          {showScrollBtn && hasMessages && (
            <button className="scroll-to-bottom-btn" onClick={scrollToBottomSmooth} title="Scroll to bottom">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
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
            {isTyping ? (
              <button
                className="stop-btn"
                onClick={handleStopGenerating}
                title="Stop generating"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                className="send-btn"
                onClick={() => sendMessage()}
                disabled={!inputValue.trim()}
                title="Send message"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            )}
          </div>
          <p className="input-hint">
            Press Enter to send, Shift+Enter for new line · <Link href="/privacy" style={{ color: '#94a3b8', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Privacy</Link> · <Link href="/terms" style={{ color: '#94a3b8', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Terms</Link>
          </p>
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
