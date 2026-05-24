import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

export default function InputArea({ onSend, disabled }) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3 shadow-lg"
    >
      <div className="max-w-4xl mx-auto flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything about Summer Springboard..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-3xl border-2 border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ssb-blue focus:border-ssb-blue disabled:bg-gray-100 disabled:cursor-not-allowed font-sans"
          style={{ maxHeight: '150px' }}
        />
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="bg-ssb-blue hover:bg-ssb-teal text-white p-3.5 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-md hover:scale-105"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
      <p className="text-xs text-center text-gray-400 mt-2">
        Press Enter to send • Shift+Enter for new line
      </p>
    </form>
  );
}
