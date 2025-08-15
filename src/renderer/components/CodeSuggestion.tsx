import React, { useState } from 'react';
import { CodeSuggestion as CodeSuggestionType, CodeDiff } from '../types';
import ConfirmationDialog from './ConfirmationDialog';
import './CodeSuggestion.css';

interface CodeSuggestionProps {
  suggestion: CodeSuggestionType;
  onApply: (suggestion: CodeSuggestionType) => void;
  onDismiss: (suggestionId: string) => void;
}

const CodeSuggestion: React.FC<CodeSuggestionProps> = ({
  suggestion,
  onApply,
  onDismiss
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return '⚡';
      case 'security': return '🔒';
      case 'style': return '🎨';
      case 'maintainability': return '🔧';
      default: return '💡';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return '#ff4757';
      case 'medium': return '#ffa502';
      case 'low': return '#2ed573';
      default: return '#747d8c';
    }
  };

  const getConfidencePercentage = (confidence: number) => {
    return Math.round(confidence * 100);
  };

  const handleApply = () => {
    setShowConfirmation(true);
  };

  const handleConfirmApply = () => {
    setShowConfirmation(false);
    onApply(suggestion);
  };

  const handleCancelApply = () => {
    setShowConfirmation(false);
  };

  const handleDismiss = () => {
    onDismiss(suggestion.id);
  };

  const renderCodeDiff = (change: any) => {
    const oldLines = change.oldContent.split('\n');
    const newLines = change.newContent.split('\n');
    
    return (
      <div className="code-diff">
        <div className="diff-header">
          <span className="diff-file">📄 {change.description}</span>
        </div>
        <div className="diff-content">
          <div className="diff-old">
            <div className="diff-label">- Before</div>
            <pre className="diff-code old">{change.oldContent}</pre>
          </div>
          <div className="diff-new">
            <div className="diff-label">+ After</div>
            <pre className="diff-code new">{change.newContent}</pre>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <ConfirmationDialog
        isOpen={showConfirmation}
        suggestion={suggestion}
        onConfirm={handleConfirmApply}
        onCancel={handleCancelApply}
      />
      <div className="code-suggestion">
      <div className="suggestion-header">
        <div className="suggestion-info">
          <div className="suggestion-title">
            <span className="category-icon">{getCategoryIcon(suggestion.category)}</span>
            <span className="title-text">{suggestion.title}</span>
            <span 
              className="impact-badge" 
              style={{ backgroundColor: getImpactColor(suggestion.impact) }}
            >
              {suggestion.impact}
            </span>
          </div>
          <div className="suggestion-meta">
            <span className="confidence">
              {getConfidencePercentage(suggestion.confidence)}% confidence
            </span>
            <span className="category">{suggestion.category}</span>
          </div>
        </div>
        <div className="suggestion-actions">
          <button
            className="expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      <div className="suggestion-description">
        {suggestion.description}
      </div>

      {isExpanded && (
        <div className="suggestion-details">
          <div className="details-actions">
            <button
              className="show-diff-btn"
              onClick={() => setShowDiff(!showDiff)}
            >
              {showDiff ? '📋 Hide Changes' : '👁️ Show Changes'}
            </button>
          </div>

          {showDiff && (
            <div className="changes-preview">
              <div className="changes-header">
                <span className="changes-count">
                  {suggestion.changes.length} change{suggestion.changes.length !== 1 ? 's' : ''}
                </span>
              </div>
              {suggestion.changes.map((change, index) => (
                <div key={index} className="change-item">
                  {renderCodeDiff(change)}
                </div>
              ))}
            </div>
          )}

          <div className="suggestion-buttons">
            <button
              className="apply-btn"
              onClick={handleApply}
              title="Apply this suggestion"
            >
              ✅ Apply
            </button>
            <button
              className="dismiss-btn"
              onClick={handleDismiss}
              title="Dismiss this suggestion"
            >
              ❌ Dismiss
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default CodeSuggestion;