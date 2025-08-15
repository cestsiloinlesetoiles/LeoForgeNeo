import React, { useEffect, useState } from 'react';
import './CodeHighlight.css';

interface CodeHighlightProps {
  children: React.ReactNode;
  isModified: boolean;
  modificationDescription?: string;
}

const CodeHighlight: React.FC<CodeHighlightProps> = ({
  children,
  isModified,
  modificationDescription
}) => {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isModified) {
      setShowAnimation(true);
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 2000); // Animation duration

      return () => clearTimeout(timer);
    }
  }, [isModified]);

  return (
    <div 
      className={`code-highlight ${showAnimation ? 'modified' : ''}`}
      title={modificationDescription}
    >
      {children}
      {showAnimation && (
        <div className="modification-indicator">
          <span className="indicator-icon">✨</span>
          <span className="indicator-text">Modified by agent</span>
        </div>
      )}
    </div>
  );
};

export default CodeHighlight;