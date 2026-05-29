'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Code blocks
  html = html.replace(
    /`(.*?)`/g,
    '<code style="background: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px;">$1</code>'
  );

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  // Bullet points
  html = html.replace(
    /^&bull; (.+)$/gm,
    '<div style="margin-left: 12px; margin-top: 4px;">&bull; $1</div>'
  );

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

export default function ChatbotWidget() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('loading'); // loading | login | onboarding | chat
  const [showSettings, setShowSettings] = useState(false);
  const [settingsAnimating, setSettingsAnimating] = useState(false);

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

  // Settings state
  const [settingsName, setSettingsName] = useState('');
  const [settingsRole, setSettingsRole] = useState('');
  const [settingsBotName, setSettingsBotName] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaveText, setSettingsSaveText] = useState('Save changes');
  const [settingsNameError, setSettingsNameError] = useState(false);

  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const sessionIdRef = useRef(null);

  // Generate sessionId on mount (client-side only)
  useEffect(() => {
    sessionIdRef.current = crypto.randomUUID();
  }, []);

  // ─── Auth ───────────────────────────────────────────────

  const fetchProfile = useCallback(async (sess) => {
    try {
      const response = await fetch('/api/chat/profile', {
        headers: {
          Authorization: 'Bearer ' + sess.access_token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const profile = data.profile || data;
        setUserProfile(profile);

        if (!profile.name || !profile.role) {
          // Pre-fill name from email
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

  // ─── Escape key to close ────────────────────────────────

  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // ─── Auto-scroll ────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'auto',
        });
      }
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // ─── Focus input when chat opens ────────────────────────

  useEffect(() => {
    if (isOpen && view === 'chat' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, view]);

  // ─── Welcome message when entering chat ─────────────────

  useEffect(() => {
    if (view === 'chat' && messages.length === 0 && userProfile) {
      const userName = userProfile.name || 'there';
      const botName = userProfile.bot_name || 'Summer';
      setMessages([
        {
          role: 'assistant',
          content: `Hi ${userName}! I'm ${botName}, your assistant for Summer Springboard at UC Berkeley 2026.\n\nI can help you with emergency procedures, staff schedules, course information, medical resources, campus locations, and more.\n\nWhat would you like to know?`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [view, userProfile, messages.length]);

  // ─── Auto-resize textarea ───────────────────────────────

  const autoResizeTextarea = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const newHeight = Math.min(inputRef.current.scrollHeight, 120);
      inputRef.current.style.height = newHeight + 'px';
    }
  }, []);

  // ─── Toggle widget ─────────────────────────────────────

  const toggleWidget = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // ─── Login handlers ─────────────────────────────────────

  const handleGoogleSignIn = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
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
    } catch (err) {
      setMagicStatus({ text: 'Something went wrong. Please try again.', type: 'error' });
    }

    setMagicSending(false);
  }, [magicEmail]);

  // ─── Onboarding handler ─────────────────────────────────

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

  // ─── Settings handlers ──────────────────────────────────

  const openSettings = useCallback(() => {
    setSettingsName(userProfile?.name || '');
    setSettingsRole(userProfile?.role || '');
    setSettingsBotName(userProfile?.bot_name || 'Summer');
    setSettingsSaveText('Save changes');
    setSettingsNameError(false);
    setShowSettings(true);
    // Animate in on next frame
    requestAnimationFrame(() => setSettingsAnimating(true));
  }, [userProfile]);

  const closeSettings = useCallback(() => {
    setSettingsAnimating(false);
    setTimeout(() => setShowSettings(false), 300);
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
      setTimeout(() => {
        closeSettings();
      }, 600);
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
    setSettingsAnimating(false);
    setMessages([]);
    setChatHistory([]);
    setView('login');
  }, []);

  // ─── Send message ───────────────────────────────────────

  const [inputValue, setInputValue] = useState('');

  const sendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isTyping) return;

    if (!session) {
      setView('login');
      return;
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

      // Read the stream
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
                // Update the last assistant message in state
                const updatedContent = fullResponse;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: updatedContent,
                  };
                  return updated;
                });
              } else if (data.type === 'done') {
                // Stream complete
              }
            } catch (e) {
              console.error('JSON parse error:', e);
            }
          }
        }
      }

      // Update chat history
      setChatHistory((prev) => [
        ...prev,
        userMessage,
        { role: 'assistant', content: fullResponse, timestamp: new Date().toISOString() },
      ]);

      // Re-focus input after response (desktop only)
      if (window.innerWidth > 768 && inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      setIsTyping(false);

      const errorMessage = {
        role: 'assistant',
        content: `I'm having trouble connecting to the server.\n\n**To fix this:**\n1. Make sure the backend is running\n2. Refresh this page\n\nFor urgent help, call SSB 24/7 Helpline: **+1.858.779.0555**`,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  }, [inputValue, isTyping, session, chatHistory]);

  // ─── Key handler for textarea ───────────────────────────

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // ─── Derived values ─────────────────────────────────────

  const botName = userProfile?.bot_name || 'Summer';
  const userName = userProfile?.name || 'there';
  const role = userProfile?.role || '';

  // ─── Render helpers ─────────────────────────────────────

  const renderRoleBadge = (roleStr) => {
    if (!roleStr) return null;
    const lower = roleStr.toLowerCase();
    const bg = ROLE_BADGES[lower] || ROLE_BADGES.other;
    return (
      <span
        className="role-badge"
        style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: '100px',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          color: 'white',
          background: bg,
        }}
      >
        {escapeHtml(roleStr)}
      </span>
    );
  };

  // ─── Render: Login Screen ───────────────────────────────

  const renderLogin = () => (
    <div className="login-screen">
      <img
        src="/images/cal-bear-full.png"
        alt="Cal Bear"
        className="login-bear-img"
      />
      <h2 className="login-title">SSB Staff Portal</h2>
      <p className="login-subtitle">Sign in to access Summer Assistant</p>

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
      <p className="login-note">Use your @summerspringboard.com email to sign up</p>
    </div>
  );

  // ─── Render: Onboarding ─────────────────────────────────

  const renderOnboarding = () => (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <h2 className="onboarding-title">Welcome to SSB!</h2>

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

  // ─── Render: Messages ───────────────────────────────────

  const renderMessages = () => (
    <>
      {messages.map((msg, idx) => (
        <div key={idx} className={`chatbot-message ${msg.role}`}>
          {msg.role === 'user' ? (
            <div className="message-bubble">{msg.content}</div>
          ) : (
            <>
              <img src="/images/cal-bear-avatar.webp" alt="Summer" />
              <div>
                <div
                  className="message-bubble"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(msg.content),
                  }}
                />
              </div>
            </>
          )}
        </div>
      ))}
      {isTyping && (
        <div className="typing-indicator">
          <img src="/images/cal-bear-avatar.webp" alt="Summer" />
          <div className="typing-dots">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        </div>
      )}
    </>
  );

  // ─── Render: Settings Panel ─────────────────────────────

  const renderSettingsPanel = () => {
    if (!showSettings) return null;

    return (
      <div className={`settings-panel${settingsAnimating ? ' active' : ''}`}>
        <div className="settings-header">
          <button className="settings-back" aria-label="Back" onClick={closeSettings}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h3>Settings</h3>
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

          <div className="settings-divider" />

          <button className="settings-signout" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </div>
    );
  };

  // ─── Header content ─────────────────────────────────────

  const renderHeaderText = () => {
    if (view === 'chat') {
      return (
        <div className="chatbot-header-text">
          <h3>{escapeHtml(botName)}</h3>
          <div className="header-user-info">
            <span className="header-user-name">{escapeHtml(userName)}</span>
            {renderRoleBadge(role)}
          </div>
        </div>
      );
    }
    return (
      <div className="chatbot-header-text">
        <h3>Summer Assistant</h3>
        <p>Berkeley 2026</p>
      </div>
    );
  };

  // ─── Main render ────────────────────────────────────────

  return (
    <>
      {/* Toggle Button */}
      <button
        className={`chatbot-toggle-btn${isOpen ? ' active' : ''}`}
        onClick={toggleWidget}
        aria-label="Toggle chatbot"
      >
        <img src="/images/cal-bear-avatar.webp" alt="SSB Assistant" />
        <span className="chat-icon">Ask me anything</span>
        <span className="close-icon">Close</span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="chatbot-overlay active" onClick={toggleWidget} />
      )}

      {/* Widget */}
      {isOpen && (
        <div className="chatbot-widget active">
          {/* Header */}
          <div className="chatbot-header">
            <img src="/images/cal-bear-avatar.webp" alt="Summer" />
            {renderHeaderText()}
            {view === 'chat' && (
              <button
                className="chatbot-settings-btn"
                aria-label="Settings"
                onClick={openSettings}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            )}
            <button
              className="chatbot-close"
              aria-label="Close chatbot"
              onClick={toggleWidget}
            >
              &times;
            </button>
          </div>

          {/* Messages / Login / Onboarding area */}
          <div className="chatbot-messages" ref={messagesContainerRef}>
            {view === 'login' && renderLogin()}
            {view === 'onboarding' && renderOnboarding()}
            {view === 'chat' && renderMessages()}
            {view === 'loading' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#94a3b8',
                }}
              >
                Loading...
              </div>
            )}
          </div>

          {/* Input Area (only in chat view) */}
          {view === 'chat' && (
            <div className="chatbot-input-area">
              <div className="chatbot-input-container">
                <textarea
                  ref={inputRef}
                  className="chatbot-input"
                  placeholder="Ask me anything"
                  rows="1"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    autoResizeTextarea();
                  }}
                  onKeyDown={handleKeyDown}
                />
                <button
                  className="chatbot-send-btn"
                  onClick={sendMessage}
                  disabled={isTyping}
                  title="Send message"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
              <p className="chatbot-hint">
                Press Enter to send &bull; Shift+Enter for new line
              </p>
            </div>
          )}

          {/* Settings Panel */}
          {renderSettingsPanel()}
        </div>
      )}
    </>
  );
}
