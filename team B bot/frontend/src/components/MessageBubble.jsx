import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, ThumbsUp, ThumbsDown, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { sendFeedback } from '../utils/api';

export default function MessageBubble({ message, isUser }) {
  const [copied, setCopied] = useState(false);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = async (helpful) => {
    setFeedback(helpful);
    if (message.id) {
      try {
        await sendFeedback(message.id, helpful);
      } catch (error) {
        console.error('Failed to send feedback:', error);
      }
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-2 fade-in">
        <div className="flex flex-col items-end max-w-[80%] md:max-w-md">
          <div className="bg-ssb-blue text-white px-4 py-3 rounded-2xl rounded-tr-sm shadow-md">
            <p className="text-sm md:text-base whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
          {message.timestamp && (
            <span className="text-xs text-gray-400 mt-1">
              {formatTime(message.timestamp)}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 px-4 py-3 fade-in">
      <img
        src="/ssb-logo.png"
        alt="Summer"
        className="w-9 h-9 rounded-full object-contain bg-white border-2 border-ssb-orange p-1 flex-shrink-0 shadow-sm"
      />
      <div className="flex-1 min-w-0">
        <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-md">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({node, ...props}) => (
                  <a
                    {...props}
                    className="text-ssb-blue hover:text-ssb-teal inline-flex items-center gap-1 font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {props.children}
                    <ExternalLink className="w-3 h-3 inline" />
                  </a>
                ),
                code: ({node, inline, ...props}) => (
                  inline ?
                    <code {...props} className="bg-gray-100 px-1 py-0.5 rounded text-sm" /> :
                    <code {...props} className="block bg-gray-100 p-2 rounded text-sm overflow-x-auto" />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Sources */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => setSourcesExpanded(!sourcesExpanded)}
                className="flex items-center gap-2 text-sm font-semibold text-ssb-blue hover:text-ssb-teal transition-colors"
              >
                📚 Sources ({message.sources.length})
                {sourcesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {sourcesExpanded && (
                <div className="mt-2 space-y-1">
                  {message.sources.map((source, idx) => (
                    <div key={idx} className="text-xs text-gray-600">
                      {source.type === 'kb' ? (
                        <span>• {source.file} <span className="text-gray-400">({source.confidence})</span></span>
                      ) : (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-ssb-blue hover:text-ssb-teal inline-flex items-center gap-1 font-medium"
                        >
                          • {source.title}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timestamp and Actions */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-gray-400">
            {formatTime(message.timestamp)}
          </span>

          <button
            onClick={handleCopy}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Copy message"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>

          <button
            onClick={() => handleFeedback(true)}
            className={`p-1 rounded transition-colors ${
              feedback === true ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100 text-gray-400'
            }`}
            title="Helpful"
          >
            <ThumbsUp className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleFeedback(false)}
            className={`p-1 rounded transition-colors ${
              feedback === false ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 text-gray-400'
            }`}
            title="Not helpful"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>

        {/* Suggested Questions */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => window.dispatchEvent(new CustomEvent('sendSuggestion', { detail: suggestion }))}
                className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
