import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import QuickActions from './components/QuickActions';
import MessageBubble from './components/MessageBubble';
import TypingIndicator from './components/TypingIndicator';
import InputArea from './components/InputArea';
import { sendMessage } from './utils/api';
import { AlertCircle } from 'lucide-react';

function App() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hey there! 👋 I'm **Summer**, your Summer Springboard assistant for UC Berkeley 2026.

I can help you with:
• 🚨 Emergency procedures and contacts
• 📅 Staff schedules and policies
• 🏫 Course information and instructors
• ⚕️ Medical and healthcare resources
• 📍 Campus locations and facilities
• And much more!

What would you like to know?`,
      timestamp: new Date().toISOString(),
      sources: []
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const chatHistory = useRef([]);

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Listen for suggested question clicks
  useEffect(() => {
    const handleSuggestion = (e) => {
      handleSend(e.detail);
    };

    window.addEventListener('sendSuggestion', handleSuggestion);
    return () => window.removeEventListener('sendSuggestion', handleSuggestion);
  }, []);

  const handleSend = async (messageText) => {
    if (!messageText.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setError(null);

    // Build history for API (last 10 messages for context)
    const recentHistory = chatHistory.current.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    try {
      const response = await sendMessage(messageText, recentHistory);

      // Add assistant message
      const assistantMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp,
        sources: response.sources || [],
        suggestions: response.suggestions || [],
        searchUsed: response.searchUsed
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update history
      chatHistory.current.push(userMessage, assistantMessage);

    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to get response. Please try again.');

      // Add error message
      const errorMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `😕 Oops! I'm having trouble right now.

Please try:
• Refreshing the page
• Rephrasing your question
• Contacting the SSB 24/7 Helpline: **+1.858.779.0555**

Error: ${err.message || 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        sources: []
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (query) => {
    handleSend(query);
  };

  return (
    <div className="flex flex-col h-screen bg-ssb-gray bg-gradient-to-br from-ssb-gray via-white to-blue-50">
      <Header />
      <QuickActions onAction={handleQuickAction} />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="max-w-4xl mx-auto">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isUser={message.role === 'user'}
            />
          ))}

          {isTyping && <TypingIndicator />}

          {error && (
            <div className="px-4 py-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800 font-medium">Connection Error</p>
                  <p className="text-xs text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <InputArea onSend={handleSend} disabled={isTyping} />

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 text-center">
        <p className="text-xs text-gray-500">
          Summer Springboard UC Berkeley 2026 • Powered by Claude
        </p>
      </div>
    </div>
  );
}

export default App;
