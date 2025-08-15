import { CodeAnalysis, CodeSuggestion, CodeChange, LeoFile, AnalysisResult } from '../types';

class CodeAnalysisService {
  private static instance: CodeAnalysisService;

  private constructor() {}

  static getInstance(): CodeAnalysisService {
    if (!CodeAnalysisService.instance) {
      CodeAnalysisService.instance = new CodeAnalysisService();
    }
    return CodeAnalysisService.instance;
  }

  private async simulateDelay(ms: number = 800): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async analyzeCode(code: string, fileName: string = 'main.leo'): Promise<AnalysisResult> {
    await this.simulateDelay();

    const analysis = this.performStaticAnalysis(code, fileName);
    const suggestions = this.generateSuggestions(code, fileName, analysis);

    return {
      analysis,
      suggestions,
      timestamp: new Date()
    };
  }

  private performStaticAnalysis(code: string, fileName: string): CodeAnalysis {
    const issues: CodeAnalysis['issues'] = [];
    const suggestions: string[] = [];
    let complexity = 1;
    let maintainabilityIndex = 100;

    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Check for TODO/FIXME comments
      if (trimmedLine.includes('TODO') || trimmedLine.includes('FIXME')) {
        issues.push({
          line: lineNumber,
          message: 'TODO or FIXME comment found - consider addressing this',
          severity: 'info',
          rule: 'todo-fixme'
        });
      }

      // Check for missing semicolons (Leo specific)
      if (trimmedLine.length > 0 && 
          !trimmedLine.endsWith(';') && 
          !trimmedLine.endsWith('{') && 
          !trimmedLine.endsWith('}') &&
          !trimmedLine.startsWith('//') &&
          !trimmedLine.startsWith('/*') &&
          !trimmedLine.includes('program ') &&
          !trimmedLine.includes('transition ') &&
          !trimmedLine.includes('function ') &&
          !trimmedLine.includes('struct ') &&
          !trimmedLine.includes('record ')) {
        issues.push({
          line: lineNumber,
          message: 'Missing semicolon at end of statement',
          severity: 'warning',
          rule: 'missing-semicolon'
        });
      }

      // Check for potential overflow issues
      if (trimmedLine.includes('u32::MAX') || trimmedLine.includes('u64::MAX')) {
        suggestions.push('Consider using checked arithmetic operations to prevent overflow');
      }

      // Check for hardcoded values
      if (/\d{4,}/.test(trimmedLine) && !trimmedLine.includes('//')) {
        issues.push({
          line: lineNumber,
          message: 'Consider using named constants instead of magic numbers',
          severity: 'info',
          rule: 'magic-numbers'
        });
      }

      // Calculate complexity
      if (trimmedLine.includes('if ') || 
          trimmedLine.includes('else') || 
          trimmedLine.includes('for ') ||
          trimmedLine.includes('while ')) {
        complexity += 1;
      }

      // Check for transition complexity
      if (trimmedLine.includes('transition ')) {
        complexity += 2;
      }

      // Check for assert statements without proper error messages
      if (trimmedLine.includes('assert(') && !trimmedLine.includes('assert_eq(')) {
        issues.push({
          line: lineNumber,
          message: 'Consider using assert_eq for better error messages',
          severity: 'info',
          rule: 'assert-style'
        });
      }

      // Check for unused variables (simple heuristic)
      const varMatch = trimmedLine.match(/let\s+(\w+):/);
      if (varMatch) {
        const varName = varMatch[1];
        const remainingCode = lines.slice(index + 1).join('\n');
        if (!remainingCode.includes(varName)) {
          issues.push({
            line: lineNumber,
            message: `Variable '${varName}' appears to be unused`,
            severity: 'warning',
            rule: 'unused-variable'
          });
        }
      }
    });

    // Check for missing documentation
    if (!code.includes('//') && !code.includes('/*')) {
      suggestions.push('Add comments to improve code readability and maintainability');
      maintainabilityIndex -= 10;
    }

    // Check for consistent naming
    const transitionNames = code.match(/transition\s+(\w+)/g);
    if (transitionNames && transitionNames.length > 1) {
      const names = transitionNames.map(match => match.split(' ')[1]);
      const hasConsistentNaming = names.every(name => 
        name.includes('_') || names.every(n => !n.includes('_'))
      );
      if (!hasConsistentNaming) {
        suggestions.push('Use consistent naming convention for transitions (snake_case or camelCase)');
      }
    }

    // Adjust maintainability based on complexity
    maintainabilityIndex = Math.max(0, maintainabilityIndex - (complexity * 5));

    return {
      issues,
      suggestions,
      complexity,
      maintainabilityIndex
    };
  }

  private generateSuggestions(code: string, fileName: string, analysis: CodeAnalysis): CodeSuggestion[] {
    const suggestions: CodeSuggestion[] = [];

    // Suggestion 1: Add input validation
    if (code.includes('transition ') && !code.includes('assert')) {
      suggestions.push({
        id: `suggestion_${Date.now()}_1`,
        title: 'Add Input Validation',
        description: 'Add assertions to validate input parameters and prevent invalid states',
        changes: this.generateInputValidationChanges(code),
        confidence: 0.8,
        category: 'security',
        impact: 'high'
      });
    }

    // Suggestion 2: Improve error handling
    if (code.includes('assert(') && !code.includes('assert_eq(')) {
      suggestions.push({
        id: `suggestion_${Date.now()}_2`,
        title: 'Improve Error Messages',
        description: 'Use assert_eq for better error messages and debugging',
        changes: this.generateAssertImprovementChanges(code),
        confidence: 0.9,
        category: 'maintainability',
        impact: 'medium'
      });
    }

    // Suggestion 3: Add documentation
    if (!code.includes('//') || code.split('//').length < 3) {
      suggestions.push({
        id: `suggestion_${Date.now()}_3`,
        title: 'Add Documentation',
        description: 'Add comments to explain the purpose and behavior of transitions',
        changes: this.generateDocumentationChanges(code),
        confidence: 0.7,
        category: 'maintainability',
        impact: 'medium'
      });
    }

    // Suggestion 4: Optimize performance
    if (code.includes('u32') && code.includes('u64')) {
      suggestions.push({
        id: `suggestion_${Date.now()}_4`,
        title: 'Consistent Data Types',
        description: 'Use consistent integer types to avoid unnecessary conversions',
        changes: this.generateTypeConsistencyChanges(code),
        confidence: 0.6,
        category: 'performance',
        impact: 'low'
      });
    }

    // Suggestion 5: Security improvements
    if (code.includes('+ ') || code.includes('- ') || code.includes('* ')) {
      suggestions.push({
        id: `suggestion_${Date.now()}_5`,
        title: 'Prevent Arithmetic Overflow',
        description: 'Add overflow checks for arithmetic operations',
        changes: this.generateOverflowProtectionChanges(code),
        confidence: 0.8,
        category: 'security',
        impact: 'high'
      });
    }

    return suggestions;
  }

  private generateInputValidationChanges(code: string): CodeChange[] {
    const changes: CodeChange[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      if (line.includes('transition ') && line.includes('(')) {
        const nextLineIndex = index + 1;
        if (nextLineIndex < lines.length) {
          changes.push({
            fileId: 'current',
            oldContent: line,
            newContent: line + '\n        // Validate input parameters\n        assert(a > 0u32);\n        assert(b > 0u32);',
            description: 'Add input validation assertions'
          });
        }
      }
    });

    return changes;
  }

  private generateAssertImprovementChanges(code: string): CodeChange[] {
    const changes: CodeChange[] = [];
    const assertMatches = code.match(/assert\([^)]+\);/g);
    
    if (assertMatches) {
      assertMatches.forEach(assertStmt => {
        const improved = assertStmt.replace('assert(', 'assert_eq(').replace(');', ', true);');
        changes.push({
          fileId: 'current',
          oldContent: assertStmt,
          newContent: improved,
          description: 'Improve assert statement with better error message'
        });
      });
    }

    return changes;
  }

  private generateDocumentationChanges(code: string): CodeChange[] {
    const changes: CodeChange[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      if (line.includes('transition ') && !lines[index - 1]?.includes('//')) {
        const transitionName = line.match(/transition\s+(\w+)/)?.[1] || 'function';
        const documentation = `    // ${transitionName.charAt(0).toUpperCase() + transitionName.slice(1)} transition\n    // TODO: Add description of what this transition does\n`;
        
        changes.push({
          fileId: 'current',
          oldContent: line,
          newContent: documentation + line,
          description: `Add documentation for ${transitionName} transition`
        });
      }
    });

    return changes;
  }

  private generateTypeConsistencyChanges(code: string): CodeChange[] {
    const changes: CodeChange[] = [];
    
    // Simple example: suggest using u64 consistently
    if (code.includes('u32') && code.includes('u64')) {
      changes.push({
        fileId: 'current',
        oldContent: 'u32',
        newContent: 'u64',
        description: 'Use u64 consistently for better type safety'
      });
    }

    return changes;
  }

  private generateOverflowProtectionChanges(code: string): CodeChange[] {
    const changes: CodeChange[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      if (line.includes('return ') && (line.includes(' + ') || line.includes(' - ') || line.includes(' * '))) {
        const protectedLine = line.replace('return ', '// Check for overflow before operation\n        return ');
        changes.push({
          fileId: 'current',
          oldContent: line,
          newContent: protectedLine,
          description: 'Add overflow protection comment'
        });
      }
    });

    return changes;
  }

  async suggestImprovements(file: LeoFile): Promise<CodeSuggestion[]> {
    const result = await this.analyzeCode(file.content, file.name);
    return result.suggestions;
  }

  async analyzeProject(files: LeoFile[]): Promise<Map<string, AnalysisResult>> {
    const results = new Map<string, AnalysisResult>();
    
    for (const file of files) {
      if (file.type === 'leo') {
        const result = await this.analyzeCode(file.content, file.name);
        results.set(file.id, result);
      }
    }
    
    return results;
  }
}

export default CodeAnalysisService.getInstance();