import { LeoProject, LeoFile } from '../types';

export interface CompilationResult {
  success: boolean;
  output: string;
  errors: CompilationError[];
  warnings: CompilationWarning[];
  timestamp: Date;
  buildTime: number; // in milliseconds
}

export interface CompilationError {
  file: string;
  line: number;
  column: number;
  message: string;
  code: string;
}

export interface CompilationWarning {
  file: string;
  line: number;
  column: number;
  message: string;
  code: string;
}

export interface TestResult {
  success: boolean;
  testsPassed: number;
  testsTotal: number;
  output: string;
  failures: TestFailure[];
  timestamp: Date;
  duration: number; // in milliseconds
}

export interface TestFailure {
  testName: string;
  message: string;
  expected: string;
  actual: string;
}

export interface ExportOptions {
  includeSource: boolean;
  includeTests: boolean;
  includeDocumentation: boolean;
  format: 'zip' | 'tar' | 'folder';
}

export class LeoCompilationService {
  private static simulateDelay(min: number = 1000, max: number = 3000): Promise<void> {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  static async compileProject(project: LeoProject): Promise<CompilationResult> {
    const startTime = Date.now();
    await this.simulateDelay(1500, 4000);
    
    // Mock compilation logic
    const mainLeoFile = project.files.find(f => f.name === 'main.leo');
    const hasErrors = this.checkForSyntaxErrors(mainLeoFile?.content || '');
    const hasWarnings = this.checkForWarnings(mainLeoFile?.content || '');

    const result: CompilationResult = {
      success: !hasErrors.length,
      output: hasErrors.length ? this.generateErrorOutput(project.name, hasErrors) : this.generateSuccessOutput(project.name),
      errors: hasErrors,
      warnings: hasWarnings,
      timestamp: new Date(),
      buildTime: Date.now() - startTime,
    };

    return result;
  }

  static async runTests(project: LeoProject): Promise<TestResult> {
    const startTime = Date.now();
    await this.simulateDelay(2000, 5000);

    // Mock test execution
    const testFiles = project.files.filter(f => f.name.includes('test') || f.content.includes('test'));
    const totalTests = Math.max(1, testFiles.length * 3); // Mock test count
    const passedTests = Math.floor(totalTests * (0.7 + Math.random() * 0.3)); // 70-100% pass rate
    const failures: TestFailure[] = [];

    // Generate mock failures for failed tests
    for (let i = passedTests; i < totalTests; i++) {
      failures.push({
        testName: `test_function_${i + 1}`,
        message: 'Assertion failed',
        expected: '42u64',
        actual: `${Math.floor(Math.random() * 100)}u64`,
      });
    }

    const result: TestResult = {
      success: failures.length === 0,
      testsPassed: passedTests,
      testsTotal: totalTests,
      output: this.generateTestOutput(passedTests, totalTests, failures),
      failures: failures,
      timestamp: new Date(),
      duration: Date.now() - startTime,
    };

    return result;
  }

  static async exportProject(project: LeoProject, options: ExportOptions): Promise<string> {
    await this.simulateDelay(1000, 2000);

    // Mock export functionality
    const exportData = {
      name: project.name,
      description: project.description,
      files: options.includeSource ? project.files : project.files.filter(f => f.type !== 'leo'),
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        format: options.format,
      },
    };

    // In a real implementation, this would create actual files
    const mockExportPath = `/exports/${project.name}_${Date.now()}.${options.format}`;
    
    return mockExportPath;
  }

  private static checkForSyntaxErrors(code: string): CompilationError[] {
    const errors: CompilationError[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      // Mock syntax error detection
      if (line.includes('undefined_function')) {
        errors.push({
          file: 'src/main.leo',
          line: index + 1,
          column: line.indexOf('undefined_function') + 1,
          message: 'Function `undefined_function` is not defined',
          code: 'E001',
        });
      }

      if (line.includes('invalid_type')) {
        errors.push({
          file: 'src/main.leo',
          line: index + 1,
          column: line.indexOf('invalid_type') + 1,
          message: 'Type `invalid_type` is not recognized',
          code: 'E002',
        });
      }

      // Check for missing semicolons (simplified)
      if (line.trim().endsWith('return') && !line.trim().endsWith(';')) {
        errors.push({
          file: 'src/main.leo',
          line: index + 1,
          column: line.length,
          message: 'Expected `;` after return statement',
          code: 'E003',
        });
      }
    });

    return errors;
  }

  private static checkForWarnings(code: string): CompilationWarning[] {
    const warnings: CompilationWarning[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      // Mock warning detection
      if (line.includes('unused_variable')) {
        warnings.push({
          file: 'src/main.leo',
          line: index + 1,
          column: line.indexOf('unused_variable') + 1,
          message: 'Variable `unused_variable` is declared but never used',
          code: 'W001',
        });
      }

      // Check for TODO comments
      if (line.includes('TODO') || line.includes('FIXME')) {
        warnings.push({
          file: 'src/main.leo',
          line: index + 1,
          column: line.indexOf('TODO') !== -1 ? line.indexOf('TODO') + 1 : line.indexOf('FIXME') + 1,
          message: 'TODO comment found - consider implementing',
          code: 'W002',
        });
      }
    });

    return warnings;
  }

  private static generateSuccessOutput(projectName: string): string {
    return `✅ Compilation successful!

📦 Building '${projectName}'...
   Compiling 'main.leo'...
   
🎯 Build Summary:
   • Program: ${projectName}.aleo
   • Functions: 3 transitions compiled
   • Records: 2 record types defined
   • Build time: 2.3s
   
✨ Ready to deploy!

Next steps:
• Run tests: leo test
• Deploy: leo deploy
• Execute: leo run <function_name>`;
  }

  private static generateErrorOutput(projectName: string, errors: CompilationError[]): string {
    let output = `❌ Compilation failed for '${projectName}'\n\n`;
    
    errors.forEach(error => {
      output += `Error [${error.code}]: ${error.message}\n`;
      output += `  --> ${error.file}:${error.line}:${error.column}\n\n`;
    });

    output += `\n🔧 Fix the above errors and try again.`;
    return output;
  }

  private static generateTestOutput(passed: number, total: number, failures: TestFailure[]): string {
    let output = `🧪 Test Results\n\n`;
    
    if (failures.length === 0) {
      output += `✅ All tests passed! (${passed}/${total})\n\n`;
      output += `Test Summary:\n`;
      output += `• Passed: ${passed}\n`;
      output += `• Failed: 0\n`;
      output += `• Total: ${total}\n`;
    } else {
      output += `❌ Some tests failed (${passed}/${total})\n\n`;
      
      failures.forEach(failure => {
        output += `FAIL ${failure.testName}\n`;
        output += `  ${failure.message}\n`;
        output += `  Expected: ${failure.expected}\n`;
        output += `  Actual: ${failure.actual}\n\n`;
      });

      output += `Test Summary:\n`;
      output += `• Passed: ${passed}\n`;
      output += `• Failed: ${failures.length}\n`;
      output += `• Total: ${total}\n`;
    }

    return output;
  }

  static getCompilationStatus(result: CompilationResult): string {
    if (result.success) {
      return `✅ Compiled successfully in ${result.buildTime}ms`;
    } else {
      return `❌ Compilation failed with ${result.errors.length} error(s)`;
    }
  }

  static getTestStatus(result: TestResult): string {
    if (result.success) {
      return `✅ All tests passed (${result.testsPassed}/${result.testsTotal})`;
    } else {
      return `❌ ${result.failures.length} test(s) failed (${result.testsPassed}/${result.testsTotal} passed)`;
    }
  }
}