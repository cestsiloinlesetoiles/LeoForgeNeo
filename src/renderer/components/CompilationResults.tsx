import React from 'react';
import { CompilationResult, TestResult } from '../services/LeoCompilationService';
import './CompilationResults.css';

interface CompilationResultsProps {
  result: CompilationResult;
  onClose?: () => void;
}

interface TestResultsProps {
  result: TestResult;
  onClose?: () => void;
}

export const CompilationResults: React.FC<CompilationResultsProps> = ({ result, onClose }) => {
  return (
    <div className="compilation-results">
      <div className="compilation-header">
        <div className="compilation-status">
          {result.success ? (
            <span className="status-success">✅ Compilation Successful</span>
          ) : (
            <span className="status-error">❌ Compilation Failed</span>
          )}
        </div>
        <div className="compilation-time">
          Build time: {result.buildTime}ms
        </div>
        {onClose && (
          <button className="close-button" onClick={onClose}>×</button>
        )}
      </div>

      <div className="compilation-output">
        <pre>{result.output}</pre>
      </div>

      {result.errors.length > 0 && (
        <div className="compilation-errors">
          <h4>Errors ({result.errors.length})</h4>
          {result.errors.map((error, index) => (
            <div key={index} className="error-item">
              <div className="error-location">
                📍 {error.file}:{error.line}:{error.column}
              </div>
              <div className="error-message">{error.message}</div>
              <div className="error-code">Code: {error.code}</div>
            </div>
          ))}
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="compilation-warnings">
          <h4>Warnings ({result.warnings.length})</h4>
          {result.warnings.map((warning, index) => (
            <div key={index} className="warning-item">
              <div className="warning-location">
                📍 {warning.file}:{warning.line}:{warning.column}
              </div>
              <div className="warning-message">{warning.message}</div>
              <div className="warning-code">Code: {warning.code}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const TestResults: React.FC<TestResultsProps> = ({ result, onClose }) => {
  const passRate = (result.testsPassed / result.testsTotal) * 100;

  return (
    <div className="test-results">
      <div className="test-header">
        <div className="test-status">
          {result.success ? (
            <span className="status-success">✅ All Tests Passed</span>
          ) : (
            <span className="status-error">❌ Some Tests Failed</span>
          )}
        </div>
        <div className="test-summary">
          {result.testsPassed}/{result.testsTotal} tests passed ({passRate.toFixed(1)}%)
        </div>
        <div className="test-duration">
          Duration: {result.duration}ms
        </div>
        {onClose && (
          <button className="close-button" onClick={onClose}>×</button>
        )}
      </div>

      <div className="test-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${passRate}%` }}
          ></div>
        </div>
      </div>

      <div className="test-output">
        <pre>{result.output}</pre>
      </div>

      {result.failures.length > 0 && (
        <div className="test-failures">
          <h4>Failed Tests ({result.failures.length})</h4>
          {result.failures.map((failure, index) => (
            <div key={index} className="failure-item">
              <div className="failure-name">🔴 {failure.testName}</div>
              <div className="failure-message">{failure.message}</div>
              <div className="failure-details">
                <div className="expected">Expected: <code>{failure.expected}</code></div>
                <div className="actual">Actual: <code>{failure.actual}</code></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompilationResults;