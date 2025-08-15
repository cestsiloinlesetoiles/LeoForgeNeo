import React from 'react';
import { ChatMessage as ChatMessageType, CodeSuggestion as CodeSuggestionType } from '../types';
import CodeSuggestion from './CodeSuggestion';
import './ChatMessage.css';

interface ChatMessageProps {
  message: ChatMessageType;
  isTyping?: boolean;
  suggestions?: CodeSuggestionType[];
  onApplySuggestion?: (suggestion: CodeSuggestionType) => void;
  onDismissSuggestion?: (suggestionId: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isTyping = false, 
  suggestions = [],
  onApplySuggestion,
  onDismissSuggestion 
}) => {
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  if (isTyping) {
    return (
      <div className="chat-message agent typing">
        <div className="message-avatar">
          <span className="avatar-icon">🤖</span>
        </div>
        <div className="message-bubble">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-message ${message.sender}`}>
      <div className="message-avatar">
        <span className="avatar-icon">
          {message.sender === 'user' ? '👤' : '🤖'}
        </span>
      </div>
      <div className="message-bubble">
        <div className="message-content">
          {message.content}
        </div>
        {message.codeChanges && message.codeChanges.length > 0 && (
          <div className="code-changes">
            <div className="code-changes-header">
              📝 Code Changes Applied
            </div>
            {message.codeChanges.map((change, index) => (
              <div key={index} className="code-change">
                <div className="change-description">{change.description}</div>
                <div className="change-file">File: {change.fileId}</div>
              </div>
            ))}
          </div>
        )}
        {suggestions.length > 0 && onApplySuggestion && onDismissSuggestion && (
          <div className="message-suggestions">
            {suggestions.map((suggestion) => (
              <CodeSuggestion
                key={suggestion.id}
                suggestion={suggestion}
                onApply={onApplySuggestion}
                onDismiss={onDismissSuggestion}
              />
            ))}
          </div>
        )}
        <div className="message-timestamp">
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;