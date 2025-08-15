import React, { useState } from 'react';
import { CodeAnalysis, CodeSuggestion as CodeSuggestionType } from '../types';
import CodeSuggestion from './CodeSuggestion';
import './CodeAnalysisPanel.css';

interface CodeAnalysisPanelProps {
  analysis: CodeAnalysis;
  suggestions: CodeSuggestionType[];
  onApplySuggestion: (suggestion: CodeSuggestionType) => void;
  onDismissSuggestion: (suggestionId: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

const CodeAnalysisPanel: React.FC<CodeAnalysisPanelProps> = ({
  analysis,
  suggestions,
  onApplySuggestion,
  onDismissSuggestion,
  isVisible,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'issues' | 'suggestions' | 'metrics'>('suggestions');

  if (!isVisible) return null;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return '🔴';
      case 'warning': return '🟡';
      case 'info': return '🔵';
      default: return '⚪';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return '#ff4757';
      case 'warning': return '#ffa502';
      case 'info': return '#3742fa';
      default: return '#747d8c';
    }
  };

  const getComplexityLevel = (complexity: number) => {
    if (complexity <= 5) return { level: 'Low', color: '#2ed573' };
    if (complexity <= 10) return { level: 'Medium', color: '#ffa502' };
    return { level: 'High', color: '#ff4757' };
  };

  const getMaintainabilityLevel = (index: number) => {
    if (index >= 80) return { level: 'Excellent', color: '#2ed573' };
    if (index >= 60) return { level: 'Good', color: '#26de81' };
    if (index >= 40) return { level: 'Fair', color: '#ffa502' };
    return { level: 'Poor', color: '#ff4757' };
  };

  const complexityInfo = getComplexityLevel(analysis.complexity);
  const maintainabilityInfo = getMaintainabilityLevel(analysis.maintainabilityIndex);

  return (
    <div className="code-analysis-panel">
      <div className="analysis-header">
        <div className="analysis-title">
          <span className="analysis-icon">🔍</span>
          Code Analysis
        </div>
        <button className="close-btn" onClick={onClose} title="Close analysis">
          ✕
        </button>
      </div>

      <div className="analysis-tabs">
        <button
          className={`tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`}
          onClick={() => setActiveTab('suggestions')}
        >
          💡 Suggestions ({suggestions.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'issues' ? 'active' : ''}`}
          onClick={() => setActiveTab('issues')}
        >
          🐛 Issues ({analysis.issues.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          📊 Metrics
        </button>
      </div>

      <div className="analysis-content">
        {activeTab === 'suggestions' && (
          <div className="suggestions-tab">
            {suggestions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✨</div>
                <div className="empty-text">No suggestions available</div>
                <div className="empty-subtext">Your code looks good!</div>
              </div>
            ) : (
              <div className="suggestions-list">
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
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="issues-tab">
            {analysis.issues.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <div className="empty-text">No issues found</div>
                <div className="empty-subtext">Great job!</div>
              </div>
            ) : (
              <div className="issues-list">
                {analysis.issues.map((issue, index) => (
                  <div key={index} className="issue-item">
                    <div className="issue-header">
                      <span className="severity-icon">
                        {getSeverityIcon(issue.severity)}
                      </span>
                      <span className="issue-line">Line {issue.line}</span>
                      <span 
                        className="severity-badge"
                        style={{ backgroundColor: getSeverityColor(issue.severity) }}
                      >
                        {issue.severity}
                      </span>
                    </div>
                    <div className="issue-message">{issue.message}</div>
                    {issue.rule && (
                      <div className="issue-rule">Rule: {issue.rule}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="metrics-tab">
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-icon">🔢</span>
                  <span className="metric-title">Complexity</span>
                </div>
                <div className="metric-value" style={{ color: complexityInfo.color }}>
                  {analysis.complexity}
                </div>
                <div className="metric-label" style={{ color: complexityInfo.color }}>
                  {complexityInfo.level}
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-icon">🔧</span>
                  <span className="metric-title">Maintainability</span>
                </div>
                <div className="metric-value" style={{ color: maintainabilityInfo.color }}>
                  {analysis.maintainabilityIndex}
                </div>
                <div className="metric-label" style={{ color: maintainabilityInfo.color }}>
                  {maintainabilityInfo.level}
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-icon">🐛</span>
                  <span className="metric-title">Issues</span>
                </div>
                <div className="metric-value">
                  {analysis.issues.length}
                </div>
                <div className="metric-label">
                  Found
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-icon">💡</span>
                  <span className="metric-title">Suggestions</span>
                </div>
                <div className="metric-value">
                  {suggestions.length}
                </div>
                <div className="metric-label">
                  Available
                </div>
              </div>
            </div>

            {analysis.suggestions.length > 0 && (
              <div className="general-suggestions">
                <div className="suggestions-header">
                  <span className="suggestions-icon">💭</span>
                  General Suggestions
                </div>
                <ul className="suggestions-list">
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index} className="suggestion-item">
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeAnalysisPanel;