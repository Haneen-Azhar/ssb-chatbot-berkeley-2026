/**
 * SSB Chatbot Widget - With Auth, Onboarding & Settings
 */

class ChatbotWidget {
  constructor() {
    this.apiUrl = '/api/chat/stream';
    this.messages = [];
    this.isTyping = false;
    this.chatHistory = [];

    // Supabase Auth
    this.supabaseUrl = 'https://qrblfhemdfxyfcicidra.supabase.co';
    this.supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyYmxmaGVtZGZ4eWZjaWNpZHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzc5MjgsImV4cCI6MjA5NTY1MzkyOH0.7JhdUa0lAOQBb1_Gp2PR9bKe4cO-O2cfJZl33RjU4gI';
    this.supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseAnonKey);
    this.session = null;
    this.userProfile = null;
    this.sessionId = crypto.randomUUID();

    this.init();
  }

  init() {
    this.createWidget();
    this.attachEventListeners();
    this.checkAuth();
  }

  createWidget() {
    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'chatbot-toggle-btn';
    toggleBtn.innerHTML = `
      <img src="images/cal-bear-avatar.webp" alt="SSB Assistant">
      <span class="chat-icon">Ask me anything</span>
      <span class="close-icon">Close</span>
    `;
    toggleBtn.setAttribute('aria-label', 'Toggle chatbot');
    document.body.appendChild(toggleBtn);

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'chatbot-overlay';
    document.body.appendChild(overlay);

    // Create widget
    const widget = document.createElement('div');
    widget.className = 'chatbot-widget';
    widget.innerHTML = `
      <div class="chatbot-header">
        <img src="images/cal-bear-avatar.webp" alt="Summer">
        <div class="chatbot-header-text">
          <h3>Summer Assistant</h3>
          <p>Berkeley 2026</p>
        </div>
        <button class="chatbot-settings-btn" aria-label="Settings" style="display:none;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
        <button class="chatbot-close" aria-label="Close chatbot">&times;</button>
      </div>

      <div class="chatbot-messages" id="chatbot-messages"></div>

      <div class="chatbot-input-area">
        <div class="chatbot-input-container">
          <textarea
            class="chatbot-input"
            id="chatbot-input"
            placeholder="Ask me anything"
            rows="1"
          ></textarea>
          <button class="chatbot-send-btn" id="chatbot-send-btn" title="Send message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
        <p class="chatbot-hint">Press Enter to send &bull; Shift+Enter for new line</p>
      </div>
    `;
    document.body.appendChild(widget);

    this.toggleBtn = toggleBtn;
    this.overlay = overlay;
    this.widget = widget;
    this.messagesContainer = widget.querySelector('#chatbot-messages');
    this.input = widget.querySelector('#chatbot-input');
    this.sendBtn = widget.querySelector('#chatbot-send-btn');
    this.settingsBtn = widget.querySelector('.chatbot-settings-btn');
  }

  attachEventListeners() {
    // Toggle button
    this.toggleBtn.addEventListener('click', () => this.toggleWidget());

    // Close button
    this.widget.querySelector('.chatbot-close').addEventListener('click', () => this.toggleWidget());

    // Overlay
    this.overlay.addEventListener('click', () => this.toggleWidget());

    // Send button
    this.sendBtn.addEventListener('click', () => this.sendMessage());

    // Input keypress
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Auto-resize textarea
    this.input.addEventListener('input', () => {
      this.autoResizeTextarea();
    });

    // Escape to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.widget.classList.contains('active')) {
        this.toggleWidget();
      }
    });

    // Settings button
    this.settingsBtn.addEventListener('click', () => this.showSettings());

    // Safari mobile viewport fix
    this.handleMobileViewport();
  }

  autoResizeTextarea() {
    this.input.style.height = 'auto';
    const newHeight = Math.min(this.input.scrollHeight, 120);
    this.input.style.height = newHeight + 'px';
  }

  handleMobileViewport() {
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      this.input.addEventListener('focus', () => {
        setTimeout(() => {
          this.scrollToBottom();
        }, 300);
      });
    }
  }

  toggleWidget() {
    this.toggleBtn.classList.toggle('active');
    this.overlay.classList.toggle('active');
    this.widget.classList.toggle('active');

    if (this.widget.classList.contains('active')) {
      // Only focus input if we're in chat mode (not login/onboarding)
      if (this.session && this.userProfile && this.userProfile.name) {
        this.input.focus();
      }
      this.scrollToBottom();
    }
  }

  // ─── Auth Flow ─────────────────────────────────────────────

  async checkAuth() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();

      if (error) {
        console.error('Auth session error:', error);
        this.showLoginScreen();
        return;
      }

      if (session) {
        this.session = session;
        await this.fetchProfile();
      } else {
        this.showLoginScreen();
      }

      // Listen for auth state changes (handles redirect after OAuth/magic link)
      this.supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          this.session = session;
          await this.fetchProfile();
        } else if (event === 'SIGNED_OUT') {
          this.session = null;
          this.userProfile = null;
          this.showLoginScreen();
        }
      });
    } catch (err) {
      console.error('checkAuth error:', err);
      this.showLoginScreen();
    }
  }

  async fetchProfile() {
    try {
      const response = await fetch('/api/chat/profile', {
        headers: {
          'Authorization': 'Bearer ' + this.session.access_token
        }
      });

      if (response.ok) {
        this.userProfile = await response.json();

        if (!this.userProfile.name || !this.userProfile.role) {
          this.showOnboarding();
        } else {
          this.showChat();
        }
      } else if (response.status === 404) {
        // No profile yet
        this.userProfile = {};
        this.showOnboarding();
      } else {
        console.error('Profile fetch failed:', response.status);
        this.showOnboarding();
      }
    } catch (err) {
      console.error('fetchProfile error:', err);
      this.userProfile = {};
      this.showOnboarding();
    }
  }

  // ─── Login Screen ──────────────────────────────────────────

  showLoginScreen() {
    // Hide input area when showing login
    this.widget.querySelector('.chatbot-input-area').style.display = 'none';
    this.settingsBtn.style.display = 'none';

    // Reset header to default
    const headerText = this.widget.querySelector('.chatbot-header-text');
    headerText.innerHTML = `
      <h3>Summer Assistant</h3>
      <p>Berkeley 2026</p>
    `;

    this.messagesContainer.innerHTML = `
      <div class="login-screen">
        <img src="images/cal-bear-full.png" alt="Cal Bear" class="login-bear-img">
        <h2 class="login-title">SSB Staff Portal</h2>
        <p class="login-subtitle">Sign in to access Summer Assistant</p>

        <button class="login-google-btn" id="login-google-btn">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

        <div class="login-divider">
          <span>or</span>
        </div>

        <div class="login-magic-link">
          <input type="email" class="login-email-input" id="login-email" placeholder="your@email.com">
          <button class="login-magic-btn" id="login-magic-btn">Send magic link</button>
        </div>

        <p class="login-magic-status" id="login-magic-status"></p>
        <p class="login-note">Use your @summerspringboard.com email to sign up</p>
      </div>
    `;

    // Attach login event listeners
    this.messagesContainer.querySelector('#login-google-btn').addEventListener('click', () => {
      this.handleGoogleSignIn();
    });

    this.messagesContainer.querySelector('#login-magic-btn').addEventListener('click', () => {
      const email = this.messagesContainer.querySelector('#login-email').value.trim();
      if (email) this.handleMagicLink(email);
    });

    this.messagesContainer.querySelector('#login-email').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const email = e.target.value.trim();
        if (email) this.handleMagicLink(email);
      }
    });
  }

  async handleGoogleSignIn() {
    try {
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        console.error('Google sign-in error:', error);
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
    }
  }

  async handleMagicLink(email) {
    const statusEl = this.messagesContainer.querySelector('#login-magic-status');
    const btn = this.messagesContainer.querySelector('#login-magic-btn');

    btn.disabled = true;
    btn.textContent = 'Sending...';
    statusEl.textContent = '';
    statusEl.className = 'login-magic-status';

    try {
      const { error } = await this.supabase.auth.signInWithOtp({ email });

      if (error) {
        statusEl.textContent = error.message;
        statusEl.classList.add('error');
      } else {
        statusEl.textContent = 'Check your email for the login link!';
        statusEl.classList.add('success');
      }
    } catch (err) {
      statusEl.textContent = 'Something went wrong. Please try again.';
      statusEl.classList.add('error');
    }

    btn.disabled = false;
    btn.textContent = 'Send magic link';
  }

  // ─── Onboarding ────────────────────────────────────────────

  showOnboarding() {
    // Hide input area during onboarding
    this.widget.querySelector('.chatbot-input-area').style.display = 'none';
    this.settingsBtn.style.display = 'none';

    // Try to pre-fill name from email
    let namePrefill = '';
    if (this.session && this.session.user && this.session.user.email) {
      const emailName = this.session.user.email.split('@')[0];
      // Capitalize first letter of each word, replace dots/underscores with spaces
      namePrefill = emailName
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    }

    this.messagesContainer.innerHTML = `
      <div class="onboarding-overlay">
        <div class="onboarding-modal">
          <h2 class="onboarding-title">Welcome to SSB!</h2>

          <div class="onboarding-field">
            <label for="onboard-name">Your name</label>
            <input type="text" id="onboard-name" class="onboarding-input" value="${this.escapeHtml(namePrefill)}" placeholder="First Last">
          </div>

          <div class="onboarding-field">
            <label for="onboard-role">Your role</label>
            <select id="onboard-role" class="onboarding-select">
              <option value="" disabled selected>Select your role</option>
              <option value="CD">CD</option>
              <option value="AM">AM</option>
              <option value="SPA">SPA</option>
              <option value="Mentor">Mentor</option>
              <option value="Instructor">Instructor</option>
            </select>
          </div>

          <div class="onboarding-field">
            <label for="onboard-botname">Name your assistant</label>
            <input type="text" id="onboard-botname" class="onboarding-input" placeholder="Summer">
          </div>

          <button class="onboarding-submit" id="onboard-submit">Get Started</button>
        </div>
      </div>
    `;

    this.messagesContainer.querySelector('#onboard-submit').addEventListener('click', () => {
      this.handleOnboardingSubmit();
    });
  }

  async handleOnboardingSubmit() {
    const name = this.messagesContainer.querySelector('#onboard-name').value.trim();
    const role = this.messagesContainer.querySelector('#onboard-role').value;
    const botName = this.messagesContainer.querySelector('#onboard-botname').value.trim() || 'Summer';

    if (!name || !role) {
      // Highlight empty fields
      if (!name) this.messagesContainer.querySelector('#onboard-name').classList.add('input-error');
      if (!role) this.messagesContainer.querySelector('#onboard-role').classList.add('input-error');
      return;
    }

    const submitBtn = this.messagesContainer.querySelector('#onboard-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Setting up...';

    try {
      const response = await fetch('/api/chat/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.session.access_token
        },
        body: JSON.stringify({ name, role, botName })
      });

      if (response.ok) {
        this.userProfile = await response.json();
      } else {
        // Use local values if save fails
        this.userProfile = { name, role, botName };
      }

      this.showChat();
    } catch (err) {
      console.error('Onboarding save error:', err);
      this.userProfile = { name, role, botName };
      this.showChat();
    }
  }

  // ─── Chat View ─────────────────────────────────────────────

  showChat() {
    const userName = this.userProfile.name || 'there';
    const botName = this.userProfile.botName || 'Summer';
    const role = this.userProfile.role || '';

    // Update header
    const headerText = this.widget.querySelector('.chatbot-header-text');
    headerText.innerHTML = `
      <h3>${this.escapeHtml(botName)}</h3>
      <div class="header-user-info">
        <span class="header-user-name">${this.escapeHtml(userName)}</span>
        ${role ? `<span class="role-badge role-${role.toLowerCase()}">${this.escapeHtml(role)}</span>` : ''}
      </div>
    `;

    // Show settings gear
    this.settingsBtn.style.display = 'flex';

    // Show input area
    this.widget.querySelector('.chatbot-input-area').style.display = 'block';

    // Clear messages and add welcome
    this.messagesContainer.innerHTML = '';
    this.messages = [];
    this.chatHistory = [];

    this.addWelcomeMessage();
  }

  addWelcomeMessage() {
    const userName = (this.userProfile && this.userProfile.name) || 'there';
    const botName = (this.userProfile && this.userProfile.botName) || 'Summer';

    const welcomeMessage = {
      role: 'assistant',
      content: `Hi ${userName}! I'm ${botName}, your assistant for Summer Springboard at UC Berkeley 2026.

I can help you with emergency procedures, staff schedules, course information, medical resources, campus locations, and more.

What would you like to know?`,
      timestamp: new Date().toISOString()
    };

    this.messages.push(welcomeMessage);
    this.renderMessage(welcomeMessage);
  }

  // ─── Settings ──────────────────────────────────────────────

  showSettings() {
    const name = (this.userProfile && this.userProfile.name) || '';
    const role = (this.userProfile && this.userProfile.role) || '';
    const botName = (this.userProfile && this.userProfile.botName) || 'Summer';

    // Create settings panel
    const settingsPanel = document.createElement('div');
    settingsPanel.className = 'settings-panel';
    settingsPanel.innerHTML = `
      <div class="settings-header">
        <button class="settings-back" aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h3>Settings</h3>
      </div>

      <div class="settings-body">
        <div class="settings-field">
          <label for="settings-name">Your name</label>
          <input type="text" id="settings-name" class="settings-input" value="${this.escapeHtml(name)}">
        </div>

        <div class="settings-field">
          <label for="settings-role">Your role</label>
          <select id="settings-role" class="settings-select">
            <option value="CD" ${role === 'CD' ? 'selected' : ''}>CD</option>
            <option value="AM" ${role === 'AM' ? 'selected' : ''}>AM</option>
            <option value="SPA" ${role === 'SPA' ? 'selected' : ''}>SPA</option>
            <option value="Mentor" ${role === 'Mentor' ? 'selected' : ''}>Mentor</option>
            <option value="Instructor" ${role === 'Instructor' ? 'selected' : ''}>Instructor</option>
          </select>
        </div>

        <div class="settings-field">
          <label for="settings-botname">Assistant name</label>
          <input type="text" id="settings-botname" class="settings-input" value="${this.escapeHtml(botName)}">
        </div>

        <button class="settings-save" id="settings-save">Save changes</button>

        <div class="settings-divider"></div>

        <button class="settings-signout" id="settings-signout">Sign out</button>
      </div>
    `;

    this.widget.appendChild(settingsPanel);

    // Animate in
    requestAnimationFrame(() => {
      settingsPanel.classList.add('active');
    });

    // Back button
    settingsPanel.querySelector('.settings-back').addEventListener('click', () => {
      settingsPanel.classList.remove('active');
      setTimeout(() => settingsPanel.remove(), 300);
    });

    // Save
    settingsPanel.querySelector('#settings-save').addEventListener('click', async () => {
      const newName = settingsPanel.querySelector('#settings-name').value.trim();
      const newRole = settingsPanel.querySelector('#settings-role').value;
      const newBotName = settingsPanel.querySelector('#settings-botname').value.trim() || 'Summer';

      if (!newName) {
        settingsPanel.querySelector('#settings-name').classList.add('input-error');
        return;
      }

      const saveBtn = settingsPanel.querySelector('#settings-save');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      try {
        const response = await fetch('/api/chat/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.session.access_token
          },
          body: JSON.stringify({ name: newName, role: newRole, botName: newBotName })
        });

        if (response.ok) {
          this.userProfile = await response.json();
        } else {
          this.userProfile = { ...this.userProfile, name: newName, role: newRole, botName: newBotName };
        }

        // Update header
        const headerText = this.widget.querySelector('.chatbot-header-text');
        headerText.innerHTML = `
          <h3>${this.escapeHtml(newBotName)}</h3>
          <div class="header-user-info">
            <span class="header-user-name">${this.escapeHtml(newName)}</span>
            ${newRole ? `<span class="role-badge role-${newRole.toLowerCase()}">${this.escapeHtml(newRole)}</span>` : ''}
          </div>
        `;

        saveBtn.textContent = 'Saved!';
        setTimeout(() => {
          settingsPanel.classList.remove('active');
          setTimeout(() => settingsPanel.remove(), 300);
        }, 600);
      } catch (err) {
        console.error('Settings save error:', err);
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save changes';
      }
    });

    // Sign out
    settingsPanel.querySelector('#settings-signout').addEventListener('click', async () => {
      await this.supabase.auth.signOut();
      this.session = null;
      this.userProfile = null;
      // Remove settings panel
      settingsPanel.remove();
      this.showLoginScreen();
    });
  }

  // ─── Messaging ─────────────────────────────────────────────

  async sendMessage() {
    const text = this.input.value.trim();
    if (!text || this.isTyping) return;

    // Require auth
    if (!this.session) {
      this.showLoginScreen();
      return;
    }

    // Add user message
    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    this.messages.push(userMessage);
    this.renderMessage(userMessage);

    // Reset input
    this.input.value = '';
    this.input.style.height = 'auto';
    this.input.blur();

    // Show typing indicator
    this.showTypingIndicator();

    // Build history for API
    const recentHistory = this.chatHistory.slice(-20).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.session.access_token
        },
        body: JSON.stringify({
          message: text,
          history: recentHistory,
          sessionId: this.sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      // Hide typing indicator and create empty assistant message
      this.hideTypingIndicator();

      const assistantMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString()
      };

      this.messages.push(assistantMessage);
      const messageElement = this.renderMessage(assistantMessage);
      const bubbleElement = messageElement.querySelector('.message-bubble');

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';
      let rafId = null;
      let needsUpdate = false;

      // Smooth rendering with requestAnimationFrame
      const updateDisplay = () => {
        if (needsUpdate) {
          assistantMessage.content = fullResponse;
          bubbleElement.innerHTML = this.renderMarkdown(fullResponse);
          this.scrollToBottom();
          needsUpdate = false;
        }
        rafId = requestAnimationFrame(updateDisplay);
      };
      rafId = requestAnimationFrame(updateDisplay);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'text') {
                fullResponse += data.text;
                needsUpdate = true;
              } else if (data.type === 'done') {
                console.log('Stream complete');
              }
            } catch (e) {
              console.error('JSON parse error:', e);
            }
          }
        }
      }

      // Final update and cleanup
      cancelAnimationFrame(rafId);
      assistantMessage.content = fullResponse;
      bubbleElement.innerHTML = this.renderMarkdown(fullResponse);
      this.scrollToBottom();

      this.chatHistory.push(userMessage, assistantMessage);

      // Re-focus input after response (desktop only)
      if (window.innerWidth > 768) {
        this.input.focus();
      }

    } catch (error) {
      console.error('Chatbot error:', error);

      this.hideTypingIndicator();

      const errorMessage = {
        role: 'assistant',
        content: `I'm having trouble connecting to the server.

**To fix this:**
1. Make sure the backend is running:
   \`cd "team B bot/backend" && npm run dev\`
2. Check that it's running on http://localhost:3001
3. Refresh this page

For urgent help, call SSB 24/7 Helpline: **+1.858.779.0555**`,
        timestamp: new Date().toISOString()
      };

      this.messages.push(errorMessage);
      this.renderMessage(errorMessage);
    }
  }

  renderMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chatbot-message ${message.role}`;

    if (message.role === 'user') {
      messageDiv.innerHTML = `
        <div class="message-bubble">
          ${this.escapeHtml(message.content)}
        </div>
      `;
    } else {
      const formattedContent = this.renderMarkdown(message.content);

      messageDiv.innerHTML = `
        <img src="images/cal-bear-avatar.webp" alt="Summer">
        <div>
          <div class="message-bubble">
            ${formattedContent}
          </div>
        </div>
      `;
    }

    this.messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
    return messageDiv;
  }

  renderMarkdown(text) {
    let html = this.escapeHtml(text);

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Code blocks
    html = html.replace(/`(.*?)`/g, '<code style="background: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px;">$1</code>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Line breaks
    html = html.replace(/\n/g, '<br>');

    // Bullet points
    html = html.replace(/^&bull; (.+)$/gm, '<div style="margin-left: 12px; margin-top: 4px;">&bull; $1</div>');

    return html;
  }

  showTypingIndicator() {
    this.isTyping = true;
    this.sendBtn.disabled = true;

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
      <img src="images/cal-bear-avatar.webp" alt="Summer">
      <div class="typing-dots">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;

    this.messagesContainer.appendChild(indicator);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    this.isTyping = false;
    this.sendBtn.disabled = false;

    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  scrollToBottom(smooth = false) {
    requestAnimationFrame(() => {
      const scrollOptions = {
        top: this.messagesContainer.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      };
      this.messagesContainer.scrollTo(scrollOptions);
    });
  }

  formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.chatbot = new ChatbotWidget();
});
