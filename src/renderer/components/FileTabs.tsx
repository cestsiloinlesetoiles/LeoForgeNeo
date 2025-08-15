import React from 'react';
import { LeoFile } from '../types';
import './FileTabs.css';

interface FileTabsProps {
  openFiles: LeoFile[];
  currentFile: LeoFile | null;
  onFileSelect: (file: LeoFile) => void;
  onFileClose: (file: LeoFile) => void;
}

const FileTabs: React.FC<FileTabsProps> = ({
  openFiles,
  currentFile,
  onFileSelect,
  onFileClose
}) => {
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'leo':
        return '🦁';
      case 'md':
        return '📝';
      case 'json':
        return '⚙️';
      default:
        return '📄';
    }
  };

  const handleCloseTab = (e: React.MouseEvent, file: LeoFile) => {
    e.stopPropagation();
    onFileClose(file);
  };

  if (openFiles.length === 0) {
    return null;
  }

  return (
    <div className="file-tabs">
      <div className="tabs-container">
        {openFiles.map(file => (
          <div
            key={file.id}
            className={`file-tab ${currentFile?.id === file.id ? 'active' : ''} ${file.isModified ? 'modified' : ''}`}
            onClick={() => onFileSelect(file)}
          >
            <span className="tab-icon">{getFileIcon(file.type)}</span>
            <span className="tab-name">{file.name}</span>
            {file.isModified && <span className="modified-indicator">●</span>}
            <button
              className="close-tab"
              onClick={(e) => handleCloseTab(e, file)}
              title="Close file"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileTabs;