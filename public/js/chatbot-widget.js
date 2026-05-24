/**
 * SSB Chatbot Widget - Simplified & Elegant
 */

class ChatbotWidget {
  constructor() {
    this.apiUrl = '/api/chat/stream';
    this.messages = [];
    this.isTyping = false;
    this.chatHistory = [];

    this.init();
  }

  init() {
    this.createWidget();
    this.attachEventListeners();
    this.addWelcomeMessage();
  }

  createWidget() {
    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'chatbot-toggle-btn';
    toggleBtn.innerHTML = `
      <img src="images/ssb-avatar.png" alt="SSB Assistant">
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
        <img src="images/ssb-avatar.png" alt="Summer">
        <div class="chatbot-header-text">
          <h3>Summer Assistant</h3>
          <p>Berkeley 2026</p>
        </div>
        <button class="chatbot-close" aria-label="Close chatbot">×</button>
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
        <p class="chatbot-hint">Press Enter to send • Shift+Enter for new line</p>
      </div>
    `;
    document.body.appendChild(widget);

    this.toggleBtn = toggleBtn;
    this.overlay = overlay;
    this.widget = widget;
    this.messagesContainer = widget.querySelector('#chatbot-messages');
    this.input = widget.querySelector('#chatbot-input');
    this.sendBtn = widget.querySelector('#chatbot-send-btn');
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
      this.input.style.height = 'auto';
      this.input.style.height = Math.min(this.input.scrollHeight, 120) + 'px';
    });

    // Escape to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.widget.classList.contains('active')) {
        this.toggleWidget();
      }
    });
  }

  toggleWidget() {
    this.toggleBtn.classList.toggle('active');
    this.overlay.classList.toggle('active');
    this.widget.classList.toggle('active');

    if (this.widget.classList.contains('active')) {
      this.input.focus();
      this.scrollToBottom();
    }
  }

  addWelcomeMessage() {
    const welcomeMessage = {
      role: 'assistant',
      content: `Hi! I'm Summer, your assistant for Summer Springboard at UC Berkeley 2026.

I can help you with emergency procedures, staff schedules, course information, medical resources, campus locations, and more.

What would you like to know?`,
      timestamp: new Date().toISOString()
    };

    this.messages.push(welcomeMessage);
    this.renderMessage(welcomeMessage);
  }

  async sendMessage() {
    const text = this.input.value.trim();
    if (!text || this.isTyping) return;

    // Add user message
    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    this.messages.push(userMessage);
    this.renderMessage(userMessage);
    this.input.value = '';
    this.input.style.height = 'auto';

    // Show typing indicator
    this.showTypingIndicator();

    // Build history for API - increased to 20 for better context retention
    const recentHistory = this.chatHistory.slice(-20).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          history: recentHistory
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
                assistantMessage.content = fullResponse;
                bubbleElement.innerHTML = this.renderMarkdown(fullResponse);
                this.scrollToBottom();
              } else if (data.type === 'done') {
                // Streaming complete
                console.log('Stream complete');
              }
            } catch (e) {
              console.error('JSON parse error:', e);
            }
          }
        }
      }

      this.chatHistory.push(userMessage, assistantMessage);

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
        <img src="images/ssb-avatar.png" alt="Summer">
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
    // Simple markdown rendering
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
    html = html.replace(/^• (.+)$/gm, '<div style="margin-left: 12px; margin-top: 4px;">• $1</div>');

    return html;
  }

  showTypingIndicator() {
    this.isTyping = true;
    this.sendBtn.disabled = true;

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
      <img src="images/ssb-avatar.png" alt="Summer">
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

  scrollToBottom() {
    setTimeout(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }, 100);
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
