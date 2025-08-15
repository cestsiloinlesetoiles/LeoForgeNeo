import React, { useState } from 'react';
import { LeoProject } from '../types';
import { LeoTemplateService } from '../services/LeoTemplateService';
import { LeoCompilationService, CompilationResult, TestResult } from '../services/LeoCompilationService';
import { CompilationResults, TestResults } from './CompilationResults';
import './LeoProjectManager.css';

interface LeoProjectManagerProps {
  project: LeoProject;
  onProjectUpdate: (project: LeoProject) => void;
  onCompilationResult?: (result: CompilationResult) => void;
  onTestResult?: (result: TestResult) => void;
}

export const LeoProjectManager: React.FC<LeoProjectManagerProps> = ({
  project,
  onProjectUpdate,
  onCompilationResult,
  onTestResult
}) => {
  const [isCompiling, setIsCompiling] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [compilationResult, setCompilationResult] = useState<CompilationResult | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleCompile = async () => {
    setIsCompiling(true);
    setShowResults(false);
    
    try {
      const result = await LeoCompilationService.compileProject(project);
      setCompilationResult(result);
      setShowResults(true);
      onCompilationResult?.(result);
    } catch (error) {
      console.error('Compilation failed:', error);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setShowResults(false);
    
    try {
      const result = await LeoCompilationService.runTests(project);
      setTestResult(result);
      setShowResults(true);
      onTestResult?.(result);
    } catch (error) {
      console.error('Testing failed:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const exportPath = await LeoCompilationService.exportProject(project, {
        includeSource: true,
        includeTests: true,
        includeDocumentation: true,
        format: 'zip'
      });
      
      // In a real app, this would trigger a download or show a success message
      alert(`Project exported to: ${exportPath}`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getProjectStats = () => {
    const leoFiles = project.files.filter(f => f.type === 'leo');
    const totalLines = project.files.reduce((sum, file) => 
      sum + file.content.split('\n').length, 0
    );
    
    return {
      files: project.files.length,
      leoFiles: leoFiles.length,
      totalLines
    };
  };

  const stats = getProjectStats();

  return (
    <div className="leo-project-manager">
      <div className="project-header">
        <div className="project-info">
          <h3>{project.name}</h3>
          <p>{project.description}</p>
          <div className="project-stats">
            <span>{stats.files} files</span>
            <span>{stats.leoFiles} Leo files</span>
            <span>{stats.totalLines} lines</span>
          </div>
        </div>
      </div>

      <div className="project-actions">
        <button 
          className="action-button compile-button"
          onClick={handleCompile}
          disabled={isCompiling}
        >
          {isCompiling ? (
            <>
              <span className="spinner"></span>
              Compiling...
            </>
          ) : (
            <>
              🔨 Compile
            </>
          )}
        </button>

        <button 
          className="action-button test-button"
          onClick={handleTest}
          disabled={isTesting}
        >
          {isTesting ? (
            <>
              <span className="spinner"></span>
              Testing...
            </>
          ) : (
            <>
              🧪 Test
            </>
          )}
        </button>

        <button 
          className="action-button export-button"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <span className="spinner"></span>
              Exporting...
            </>
          ) : (
            <>
              📦 Export
            </>
          )}
        </button>
      </div>

      {showResults && (
        <div className="results-section">
          {compilationResult && (
            <CompilationResults 
              result={compilationResult}
              onClose={() => setCompilationResult(null)}
            />
          )}
          
          {testResult && (
            <TestResults 
              result={testResult}
              onClose={() => setTestResult(null)}
            />
          )}
        </div>
      )}

      <div className="project-structure">
        <h4>Project Structure</h4>
        <div className="file-list">
          {project.files.map(file => (
            <div key={file.id} className="file-item">
              <span className={`file-icon ${file.type}`}>
                {file.type === 'leo' ? '⚡' : file.type === 'md' ? '📝' : '📄'}
              </span>
              <span className="file-path">{file.path}</span>
              {file.isModified && <span className="modified-indicator">●</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeoProjectManager;