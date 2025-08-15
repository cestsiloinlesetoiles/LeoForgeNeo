import React from 'react';
import { CodeSuggestion } from '../types';
import './ConfirmationDialog.css';

interface ConfirmationDialogProps {
  isOpen: boolean;
  suggestion: CodeSuggestion | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  suggestion,
  onConfirm,
  onCancel
}) => {
  if (!isOpen || !suggestion) return null;

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

  return (
    <div className="confirmation-dialog-overlay" onClick={onCancel}>
      <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <div className="dialog-title">
            <span className="dialog-icon">⚠️</span>
            Confirm Code Changes
          </div>
          <button className="dialog-close" onClick={onCancel}>✕</button>
        </div>

        <div className="dialog-content">
          <div className="suggestion-summary">
            <div className="suggestion-info">
              <span className="category-icon">{getCategoryIcon(suggestion.category)}</span>
              <span className="suggestion-title">{suggestion.title}</span>
              <span 
                className="impact-badge" 
                style={{ backgroundColor: getImpactColor(suggestion.impact) }}
              >
                {suggestion.impact}
              </span>
            </div>
            <div className="suggestion-description">
              {suggestion.description}
            </div>
          </div>

          <div className="changes-preview">
            <div className="changes-header">
              <span className="changes-title">📝 Changes to be applied:</span>
              <span className="changes-count">
                {suggestion.changes.length} change{suggestion.changes.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="changes-list">
              {suggestion.changes.map((change, index) => (
                <div key={index} className="change-preview">
                  <div className="change-description">{change.description}</div>
                  <div className="change-diff">
                    <div className="diff-section">
                      <div className="diff-label old">- Before</div>
                      <pre className="diff-code old">{change.oldContent}</pre>
                    </div>
                    <div className="diff-section">
                      <div className="diff-label new">+ After</div>
                      <pre className="diff-code new">{change.newContent}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="confidence-info">
            <span className="confidence-label">Confidence:</span>
            <div className="confidence-bar">
              <div 
                className="confidence-fill" 
                style={{ width: `${suggestion.confidence * 100}%` }}
              ></div>
            </div>
            <span className="confidence-value">{Math.round(suggestion.confidence * 100)}%</span>
          </div>
        </div>

        <div className="dialog-actions">
          <button className="cancel-btn" onClick={onCancel}>
            ❌ Cancel
          </button>
          <button className="confirm-btn" onClick={onConfirm}>
            ✅ Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;