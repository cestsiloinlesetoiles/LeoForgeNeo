import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType, CodeSuggestion, LeoFile } from '../types';
import ChatMessage from './ChatMessage';
import LLMService, { ChatContext } from '../services/LLMService';
import CodeAnalysisService from '../services/CodeAnalysisService';
import CodeHistoryService from '../services/CodeHistoryService';
import './ChatPanel.css';

interface ChatPanelProps {
  messages: ChatMessageType[];
  onMessagesUpdate: (messages: ChatMessageType[]) => void;
  onCodeUpdate?: (code: string, fileId?: string) => void;
  context?: ChatContext;
  placeholder?: string;
  currentFile?: LeoFile;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onMessagesUpdate,
  onCodeUpdate,
  context,
  placeholder = "Ask me anything about your Leo project...",
  currentFile
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageSuggestions, setMessageSuggestions] = useState<Map<string, CodeSuggestion[]>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    adjustTextareaHeight();
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessageType = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    onMessagesUpdate(updatedMessages);
    
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // Create chat context with recent messages
      const chatContext: ChatContext = {
        ...context,
        currentFile,
        recentMessages: updatedMessages.slice(-5) // Last 5 messages for context
      };

      let response: string;
      let suggestions: CodeSuggestion[] = [];

      // Check for specific Leo commands
      const lowerInput = currentInput.toLowerCase();
      if (lowerInput.includes('compile') || lowerInput.includes('build')) {
        // Handle compilation request
        if (context?.projectId) {
          // This would need access to the full project - for now, show a message
          response = "🔨 I'll compile your Leo project. Let me check for any syntax errors and build the program...";
        } else {
          response = "To compile your project, I need access to the full project context. Please make sure you have a project loaded.";
        }
      } else if (lowerInput.includes('test')) {
        // Handle test request
        if (context?.projectId) {
          response = "🧪 Running tests for your Leo project. I'll execute all test functions and show you the results...";
        } else {
          response = "To run tests, I need access to the full project context. Please make sure you have a project loaded.";
        }
      } else if (lowerInput.includes('export') || lowerInput.includes('package')) {
        // Handle export request
        response = "📦 I'll package your Leo project for export. This will create a deployable package with all necessary files...";
      } else if ((lowerInput.includes('analyze') || lowerInput.includes('suggest') || lowerInput.includes('improve')) && currentFile && currentFile.type === 'leo') {
        const analysisResult = await LLMService.analyzeAndSuggest(currentFile.content, currentFile.name);
        response = analysisResult.analysis;
        suggestions = analysisResult.suggestions;
      } else {
        response = await LLMService.chatWithAgent(currentInput, chatContext);
      }

      const agentMessageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const agentMessage: ChatMessageType = {
        id: agentMessageId,
        content: response,
        sender: 'agent',
        timestamp: new Date()
      };

      // Store suggestions for this message
      if (suggestions.length > 0) {
        setMessageSuggestions(prev => new Map(prev.set(agentMessageId, suggestions)));
      }

      onMessagesUpdate([...updatedMessages, agentMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessageType = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'agent',
        timestamp: new Date()
      };

      onMessagesUpdate([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      onMessagesUpdate([]);
      setMessageSuggestions(new Map());
    }
  };

  const handleApplySuggestion = (suggestion: CodeSuggestion) => {
    if (!currentFile || !onCodeUpdate) return;

    // Save current state to history before applying changes
    CodeHistoryService.addEntry(currentFile, `Before applying: ${suggestion.title}`, false);

    // Apply all changes
    let updatedCode = currentFile.content;
    suggestion.changes.forEach(change => {
      updatedCode = updatedCode.replace(change.oldContent, change.newContent);
    });

    // Update the code
    onCodeUpdate(updatedCode, currentFile.id);

    // Save the new state to history as an agent change
    const updatedFile = { ...currentFile, content: updatedCode };
    CodeHistoryService.addEntry(updatedFile, `Applied: ${suggestion.title}`, true);

    // Add a message about the applied change
    const changeMessage: ChatMessageType = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      content: `✅ Applied suggestion: ${suggestion.title}\n\nChanges made:\n${suggestion.changes.map(c => `• ${c.description}`).join('\n')}`,
      sender: 'agent',
      timestamp: new Date(),
      codeChanges: suggestion.changes
    };

    onMessagesUpdate([...messages, changeMessage]);
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    // Remove the suggestion from all messages
    setMessageSuggestions(prev => {
      const newMap = new Map(prev);
      for (const [messageId, suggestions] of newMap.entries()) {
        const filteredSuggestions = suggestions.filter(s => s.id !== suggestionId);
        if (filteredSuggestions.length === 0) {
          newMap.delete(messageId);
        } else {
          newMap.set(messageId, filteredSuggestions);
        }
      }
      return newMap;
    });
  };

  const handleUndo = () => {
    if (!currentFile || !onCodeUpdate) return;

    const previousEntry = CodeHistoryService.undo(currentFile.id);
    if (previousEntry) {
      onCodeUpdate(previousEntry.content, currentFile.id);

      // Add a message about the undo
      const undoMessage: ChatMessageType = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        content: `↶ Undid: ${previousEntry.description}`,
        sender: 'agent',
        timestamp: new Date()
      };

      onMessagesUpdate([...messages, undoMessage]);
    }
  };

  const handleRedo = () => {
    if (!currentFile || !onCodeUpdate) return;

    const nextEntry = CodeHistoryService.redo(currentFile.id);
    if (nextEntry) {
      onCodeUpdate(nextEntry.content, currentFile.id);

      // Add a message about the redo
      const redoMessage: ChatMessageType = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        content: `↷ Redid: ${nextEntry.description}`,
        sender: 'agent',
        timestamp: new Date()
      };

      onMessagesUpdate([...messages, redoMessage]);
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-title">
          <span className="chat-icon">💬</span>
          Leo Assistant
        </div>
        <div className="chat-actions">
          {currentFile && currentFile.type === 'leo' && (
            <>
              <button 
                className="undo-btn"
                onClick={handleUndo}
                title="Undo last change"
                disabled={!CodeHistoryService.canUndo(currentFile.id)}
              >
                ↶
              </button>
              <button 
                className="redo-btn"
                onClick={handleRedo}
                title="Redo last change"
                disabled={!CodeHistoryService.canRedo(currentFile.id)}
              >
                ↷
              </button>
              <button 
                className="compile-btn"
                onClick={() => setInputMessage('Compile my Leo project')}
                title="Compile project"
                disabled={isLoading}
              >
                🔨
              </button>
              <button 
                className="test-btn"
                onClick={() => setInputMessage('Run tests for my Leo project')}
                title="Run tests"
                disabled={isLoading}
              >
                🧪
              </button>
              <button 
                className="analyze-btn"
                onClick={() => setInputMessage('Analyze my code and suggest improvements')}
                title="Analyze current file"
                disabled={isLoading}
              >
                🔍
              </button>
            </>
          )}
          <button 
            className="clear-chat-btn"
            onClick={handleClearChat}
            title="Clear chat history"
            disabled={messages.length === 0}
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-chat">
            <div className="empty-chat-icon">🤖</div>
            <div className="empty-chat-text">
              Hi! I'm your Leo development assistant. Ask me anything about your smart contracts!
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message}
            suggestions={messageSuggestions.get(message.id) || []}
            onApplySuggestion={handleApplySuggestion}
            onDismissSuggestion={handleDismissSuggestion}
          />
        ))}
        
        {isLoading && (
          <ChatMessage 
            message={{
              id: 'typing',
              content: '',
              sender: 'agent',
              timestamp: new Date()
            }}
            isTyping={true}
          />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            className="chat-input"
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
          />
          <button 
            className="send-button"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            title="Send message (Enter)"
          >
            {isLoading ? (
              <span className="loading-spinner">⏳</span>
            ) : (
              <span className="send-icon">➤</span>
            )}
          </button>
        </div>
        <div className="input-hint">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;