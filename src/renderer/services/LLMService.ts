import { LeoProject, LeoFile, ChatMessage, CodeChange, CodeSuggestion } from '../types';
import CodeAnalysisService from './CodeAnalysisService';
import { LeoTemplateService } from './LeoTemplateService';
import { LeoCompilationService, CompilationResult, TestResult } from './LeoCompilationService';

export interface CodeAnalysis {
  issues: Array<{
    line: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  suggestions: string[];
  complexity: number;
}

export interface CodeSuggestion {
  id: string;
  description: string;
  changes: CodeChange[];
  confidence: number;
}

export interface ChatContext {
  projectId?: string;
  currentFile?: LeoFile;
  recentMessages: ChatMessage[];
}

class LLMService {
  private static instance: LLMService;
  private responseDelay = 1500; // Base delay in ms

  private constructor() {}

  static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  private async simulateDelay(baseDelay: number = this.responseDelay): Promise<void> {
    // Add some randomness to make it feel more realistic
    const delay = baseDelay + Math.random() * 1000;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  private generateProjectId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getLeoTemplate(projectType: string, description: string): LeoFile[] {
    const templates = {
      basic: this.getBasicTemplate(),
      token: this.getTokenTemplate(),
      auction: this.getAuctionTemplate(),
      voting: this.getVotingTemplate(),
      default: this.getDefaultTemplate(description)
    };

    // Simple keyword matching to determine project type
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('token') || lowerDesc.includes('coin')) {
      return templates.token;
    } else if (lowerDesc.includes('auction') || lowerDesc.includes('bid')) {
      return templates.auction;
    } else if (lowerDesc.includes('vote') || lowerDesc.includes('governance')) {
      return templates.voting;
    } else if (lowerDesc.includes('basic') || lowerDesc.includes('simple')) {
      return templates.basic;
    }
    
    return templates.default;
  }

  private getBasicTemplate(): LeoFile[] {
    return [
      {
        id: this.generateFileId(),
        name: 'main.leo',
        path: 'src/main.leo',
        content: `// Basic Leo Program
program hello_world.aleo {
    // A simple transition that adds two numbers
    transition main(public a: u32, b: u32) -> u32 {
        return a + b;
    }
    
    // A transition that demonstrates conditional logic
    transition is_even(public num: u32) -> bool {
        return num % 2u32 == 0u32;
    }
}`,
        type: 'leo',
        isModified: false
      },
      {
        id: this.generateFileId(),
        name: 'README.md',
        path: 'README.md',
        content: `# Hello World Leo Program

A basic Leo program demonstrating simple arithmetic and conditional operations.

## Functions

- \`main(a, b)\`: Adds two u32 numbers
- \`is_even(num)\`: Checks if a number is even

## Usage

\`\`\`bash
leo run main 5u32 3u32
leo run is_even 4u32
\`\`\``,
        type: 'md',
        isModified: false
      }
    ];
  }

  private getTokenTemplate(): LeoFile[] {
    return [
      {
        id: this.generateFileId(),
        name: 'token.leo',
        path: 'src/main.leo',
        content: `// Simple Token Contract
program token.aleo {
    // Token record structure
    record Token {
        owner: address,
        amount: u64,
    }
    
    // Mint new tokens
    transition mint_public(public receiver: address, public amount: u64) -> Token {
        return Token {
            owner: receiver,
            amount: amount,
        };
    }
    
    // Transfer tokens between addresses
    transition transfer_private(token: Token, to: address, amount: u64) -> (Token, Token) {
        let difference: u64 = token.amount - amount;
        
        let remaining: Token = Token {
            owner: token.owner,
            amount: difference,
        };
        
        let transferred: Token = Token {
            owner: to,
            amount: amount,
        };
        
        return (remaining, transferred);
    }
}`,
        type: 'leo',
        isModified: false
      },
      {
        id: this.generateFileId(),
        name: 'README.md',
        path: 'README.md',
        content: `# Token Contract

A simple token implementation in Leo with minting and transfer capabilities.

## Features

- Token minting
- Private token transfers
- Balance management

## Usage

\`\`\`bash
# Mint tokens
leo run mint_public aleo1... 1000u64

# Transfer tokens
leo run transfer_private "{owner: aleo1..., amount: 1000u64}" aleo1... 500u64
\`\`\``,
        type: 'md',
        isModified: false
      }
    ];
  }

  private getAuctionTemplate(): LeoFile[] {
    return [
      {
        id: this.generateFileId(),
        name: 'auction.leo',
        path: 'src/main.leo',
        content: `// Simple Auction Contract
program auction.aleo {
    // Bid record
    record Bid {
        owner: address,
        bidder: address,
        amount: u64,
        is_winner: bool,
    }
    
    // Place a bid
    transition place_bid(public bidder: address, public amount: u64) -> Bid {
        return Bid {
            owner: self.caller,
            bidder: bidder,
            amount: amount,
            is_winner: false,
        };
    }
    
    // Resolve auction and determine winner
    transition resolve(first: Bid, second: Bid) -> Bid {
        let winner: Bid = first.amount >= second.amount ? first : second;
        
        return Bid {
            owner: winner.owner,
            bidder: winner.bidder,
            amount: winner.amount,
            is_winner: true,
        };
    }
}`,
        type: 'leo',
        isModified: false
      },
      {
        id: this.generateFileId(),
        name: 'README.md',
        path: 'README.md',
        content: `# Auction Contract

A simple auction system where users can place bids and determine winners.

## Features

- Bid placement
- Winner determination
- Auction resolution

## Usage

\`\`\`bash
# Place bids
leo run place_bid aleo1... 1000u64
leo run place_bid aleo1... 1500u64

# Resolve auction
leo run resolve "{owner: aleo1..., bidder: aleo1..., amount: 1000u64, is_winner: false}" "{owner: aleo1..., bidder: aleo1..., amount: 1500u64, is_winner: false}"
\`\`\``,
        type: 'md',
        isModified: false
      }
    ];
  }

  private getVotingTemplate(): LeoFile[] {
    return [
      {
        id: this.generateFileId(),
        name: 'voting.leo',
        path: 'src/main.leo',
        content: `// Simple Voting Contract
program voting.aleo {
    // Vote record
    record Vote {
        owner: address,
        voter: address,
        proposal_id: u32,
        vote: bool, // true for yes, false for no
    }
    
    // Cast a vote
    transition cast_vote(public voter: address, public proposal_id: u32, public vote: bool) -> Vote {
        return Vote {
            owner: self.caller,
            voter: voter,
            proposal_id: proposal_id,
            vote: vote,
        };
    }
    
    // Tally votes (simplified version)
    transition tally_votes(vote1: Vote, vote2: Vote) -> u32 {
        assert_eq(vote1.proposal_id, vote2.proposal_id);
        
        let yes_count: u32 = 0u32;
        if (vote1.vote) {
            yes_count = yes_count + 1u32;
        }
        if (vote2.vote) {
            yes_count = yes_count + 1u32;
        }
        
        return yes_count;
    }
}`,
        type: 'leo',
        isModified: false
      },
      {
        id: this.generateFileId(),
        name: 'README.md',
        path: 'README.md',
        content: `# Voting Contract

A simple voting system for proposals with yes/no votes.

## Features

- Vote casting
- Vote tallying
- Proposal management

## Usage

\`\`\`bash
# Cast votes
leo run cast_vote aleo1... 1u32 true
leo run cast_vote aleo1... 1u32 false

# Tally votes
leo run tally_votes "{owner: aleo1..., voter: aleo1..., proposal_id: 1u32, vote: true}" "{owner: aleo1..., voter: aleo1..., proposal_id: 1u32, vote: false}"
\`\`\``,
        type: 'md',
        isModified: false
      }
    ];
  }

  private getDefaultTemplate(description: string): LeoFile[] {
    return [
      {
        id: this.generateFileId(),
        name: 'main.leo',
        path: 'src/main.leo',
        content: `// Generated Leo Program
// Based on: ${description}
program custom.aleo {
    // Main transition - customize based on your needs
    transition main(public input: u32) -> u32 {
        // Add your logic here
        return input * 2u32;
    }
    
    // Helper transition
    transition process_data(public data: u64) -> u64 {
        // Process your data
        return data + 1u64;
    }
}`,
        type: 'leo',
        isModified: false
      },
      {
        id: this.generateFileId(),
        name: 'README.md',
        path: 'README.md',
        content: `# Custom Leo Program

Generated based on: "${description}"

## Description

This is a custom Leo program generated based on your project description. 
Modify the transitions in \`src/main.leo\` to implement your specific logic.

## Usage

\`\`\`bash
leo run main 42u32
leo run process_data 100u64
\`\`\`

## Next Steps

1. Customize the transitions to match your requirements
2. Add additional functions as needed
3. Test your implementation
4. Deploy to the Aleo network`,
        type: 'md',
        isModified: false
      }
    ];
  }

  async generateProject(description: string): Promise<LeoProject> {
    await this.simulateDelay(2000); // Longer delay for project generation
    
    const projectId = this.generateProjectId();
    const projectName = this.extractProjectName(description);
    const files = this.getLeoTemplate(this.detectProjectType(description), description);
    
    return {
      id: projectId,
      name: projectName,
      description: description,
      files: files,
      createdAt: new Date(),
      updatedAt: new Date(),
      chatHistory: []
    };
  }

  private extractProjectName(description: string): string {
    // Simple name extraction from description
    const words = description.toLowerCase().split(' ');
    const meaningfulWords = words.filter(word => 
      word.length > 3 && 
      !['the', 'and', 'for', 'with', 'that', 'this', 'will', 'can', 'should'].includes(word)
    );
    
    if (meaningfulWords.length > 0) {
      return meaningfulWords.slice(0, 2).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ') + ' Project';
    }
    
    return `Leo Project ${Date.now()}`;
  }

  private detectProjectType(description: string): string {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('token') || lowerDesc.includes('coin')) return 'token';
    if (lowerDesc.includes('auction') || lowerDesc.includes('bid')) return 'auction';
    if (lowerDesc.includes('vote') || lowerDesc.includes('governance')) return 'voting';
    if (lowerDesc.includes('basic') || lowerDesc.includes('simple')) return 'basic';
    return 'default';
  }

  async chatWithAgent(message: string, context: ChatContext): Promise<string> {
    await this.simulateDelay();
    
    // Simple response generation based on message content
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('compile') || lowerMessage.includes('build')) {
      return this.getCompilationResponse(lowerMessage, context);
    } else if (lowerMessage.includes('test') || lowerMessage.includes('testing')) {
      return this.getTestResponse(lowerMessage, context);
    } else if (lowerMessage.includes('export') || lowerMessage.includes('package')) {
      return this.getExportResponse(lowerMessage, context);
    } else if (lowerMessage.includes('template') || lowerMessage.includes('scaffold')) {
      return this.getTemplateResponse(lowerMessage, context);
    } else if (lowerMessage.includes('analyze') || lowerMessage.includes('analysis')) {
      return this.getAnalysisResponse(lowerMessage, context);
    } else if (lowerMessage.includes('suggest') || lowerMessage.includes('improve') || lowerMessage.includes('optimize')) {
      return this.getImprovementResponse(lowerMessage, context);
    } else if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      return this.getHelpResponse(lowerMessage, context);
    } else if (lowerMessage.includes('error') || lowerMessage.includes('bug')) {
      return this.getErrorResponse(lowerMessage, context);
    } else if (lowerMessage.includes('explain') || lowerMessage.includes('what')) {
      return this.getExplanationResponse(lowerMessage, context);
    } else {
      return this.getGeneralResponse(lowerMessage, context);
    }
  }

  private getCompilationResponse(message: string, context: ChatContext): string {
    const responses = [
      "I'll compile your Leo project now. Let me check for any syntax errors and build the program...",
      "Starting compilation process. I'll analyze your code and generate the executable program.",
      "Compiling your Leo smart contract. This will check for errors and create the deployable program.",
      "Running Leo compiler on your project. I'll show you the build results and any issues found."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getTestResponse(message: string, context: ChatContext): string {
    const responses = [
      "Running tests for your Leo project. I'll execute all test functions and show you the results.",
      "Starting test execution. This will validate your smart contract logic and catch any issues.",
      "Testing your Leo code now. I'll run all tests and provide detailed feedback on any failures.",
      "Executing test suite for your project. Let me check if all your functions work as expected."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getExportResponse(message: string, context: ChatContext): string {
    const responses = [
      "I'll package your Leo project for export. This will create a deployable package with all necessary files.",
      "Creating export package for your smart contract. I'll include source code, documentation, and metadata.",
      "Packaging your Leo project now. This will generate a complete package ready for deployment or sharing.",
      "Preparing your project for export. I'll bundle everything needed for deployment to the Aleo network."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getTemplateResponse(message: string, context: ChatContext): string {
    const templates = LeoTemplateService.getTemplates();
    const templateNames = templates.map(t => t.name).join(', ');
    
    const responses = [
      `I can help you create a new Leo project from a template. Available templates: ${templateNames}. Which one would you like to use?`,
      `Let me scaffold a new Leo project for you. I have templates for: ${templateNames}. What type of project are you building?`,
      `I'll create a new Leo project structure. Choose from these templates: ${templateNames}. What fits your needs?`,
      `Ready to generate a new Leo project! Available templates include: ${templateNames}. Which template should I use?`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getHelpResponse(message: string, context: ChatContext): string {
    const responses = [
      "I'm here to help! I can assist with Leo compilation, testing, project templates, code analysis, and more. What do you need?",
      "I can help you with Leo syntax, smart contract patterns, debugging, compilation, testing, and optimization. What do you need?",
      "Let me know what you're trying to accomplish and I'll guide you through it step by step. I can compile, test, and analyze your Leo code.",
      "I'm ready to assist with your Leo development. I can help with compilation, testing, templates, and code improvements. What's the challenge you're facing?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getErrorResponse(message: string, context: ChatContext): string {
    const responses = [
      "Let me help you debug that issue. Can you share the specific error message you're seeing?",
      "Debugging Leo code can be tricky. Let's work through this together - what's the error?",
      "I'll help you fix that bug. Could you show me the problematic code section?",
      "Error handling is important in Leo. Let me help you identify and resolve the issue."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getAnalysisResponse(message: string, context: ChatContext): string {
    const responses = [
      "I'll analyze your Leo code for potential issues and improvements. Let me examine the current file...",
      "Running code analysis on your smart contract. I'll check for security issues, performance optimizations, and best practices.",
      "Analyzing your Leo code now. I'll look for potential bugs, style issues, and suggest improvements.",
      "Let me perform a comprehensive analysis of your code. I'll check for common issues and optimization opportunities."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getImprovementResponse(message: string, context: ChatContext): string {
    const responses = [
      "Great idea to optimize! I can suggest improvements for gas efficiency and code clarity.",
      "Let's make your Leo code better. I can help with performance optimizations and best practices.",
      "Optimization is key in blockchain development. I'll analyze your code and suggest improvements.",
      "I'd be happy to help improve your smart contract. What specific areas are you looking to optimize?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getExplanationResponse(message: string, context: ChatContext): string {
    const responses = [
      "I'll explain that concept clearly. Leo has some unique features compared to other smart contract languages.",
      "Let me break that down for you. Understanding Leo's approach to privacy and zero-knowledge is important.",
      "Good question! Leo's record-based model is different from account-based systems. Here's how it works...",
      "I'll walk you through that. Leo's syntax and concepts can be different if you're coming from other languages."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getGeneralResponse(message: string, context: ChatContext): string {
    const responses = [
      "That's an interesting point about your Leo project. How would you like to proceed?",
      "I understand what you're looking for. Let me help you implement that in Leo.",
      "That sounds like a great feature for your smart contract. Shall we work on implementing it?",
      "I can definitely help with that. Leo provides good tools for what you're trying to achieve."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  async analyzeCode(code: string): Promise<CodeAnalysis> {
    await this.simulateDelay(1000);
    
    const issues: Array<{
      line: number;
      message: string;
      severity: 'error' | 'warning' | 'info';
    }> = [];
    const suggestions: string[] = [];
    let complexity = 1;
    
    // Simple static analysis
    const lines = code.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('TODO') || line.includes('FIXME')) {
        issues.push({
          line: index + 1,
          message: 'TODO or FIXME comment found',
          severity: 'info' as const
        });
      }
      
      if (line.includes('assert') && !line.includes('assert_eq')) {
        suggestions.push('Consider using assert_eq for better error messages');
      }
      
      if (line.includes('transition') && line.includes('public')) {
        complexity += 1;
      }
    });
    
    if (code.includes('u32') && code.includes('u64')) {
      suggestions.push('Consider using consistent integer types throughout your contract');
    }
    
    if (!code.includes('// ')) {
      suggestions.push('Add comments to improve code readability');
    }
    
    return {
      issues,
      suggestions,
      complexity
    };
  }

  async suggestImprovements(code: string): Promise<CodeSuggestion[]> {
    await this.simulateDelay(1200);
    
    const suggestions: CodeSuggestion[] = [];
    
    // Example improvement suggestions
    if (code.includes('return a + b;')) {
      suggestions.push({
        id: 'improve_1',
        title: 'Add Input Validation',
        description: 'Add input validation for arithmetic operations',
        changes: [{
          fileId: 'current',
          oldContent: 'return a + b;',
          newContent: `// Validate inputs to prevent overflow
        assert(a <= u32::MAX - b);
        return a + b;`,
          description: 'Add overflow protection'
        }],
        confidence: 0.8,
        category: 'security',
        impact: 'high'
      });
    }
    
    if (code.includes('transition main(')) {
      suggestions.push({
        id: 'improve_2',
        title: 'Add Documentation',
        description: 'Add documentation for the main transition',
        changes: [{
          fileId: 'current',
          oldContent: 'transition main(',
          newContent: `// Main entry point for the program
    // @param a: First input parameter
    // @param b: Second input parameter
    // @returns: Result of the operation
    transition main(`,
          description: 'Add function documentation'
        }],
        confidence: 0.9,
        category: 'maintainability',
        impact: 'medium'
      });
    }
    
    return suggestions;
  }

  async analyzeAndSuggest(code: string, fileName: string = 'main.leo'): Promise<{ analysis: string; suggestions: CodeSuggestion[] }> {
    const result = await CodeAnalysisService.analyzeCode(code, fileName);
    
    const analysisText = this.formatAnalysisResult(result.analysis);
    
    return {
      analysis: analysisText,
      suggestions: result.suggestions
    };
  }

  private formatAnalysisResult(analysis: CodeAnalysis): string {
    let result = "📊 **Code Analysis Results**\n\n";
    
    result += `**Complexity:** ${analysis.complexity} (${this.getComplexityLevel(analysis.complexity)})\n`;
    result += `**Maintainability Index:** ${analysis.maintainabilityIndex}/100\n\n`;
    
    if (analysis.issues.length > 0) {
      result += `**Issues Found (${analysis.issues.length}):**\n`;
      analysis.issues.forEach((issue, index) => {
        const icon = issue.severity === 'error' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
        result += `${index + 1}. ${icon} Line ${issue.line}: ${issue.message}\n`;
      });
      result += "\n";
    }
    
    if (analysis.suggestions.length > 0) {
      result += `**General Suggestions:**\n`;
      analysis.suggestions.forEach((suggestion, index) => {
        result += `${index + 1}. ${suggestion}\n`;
      });
    }
    
    return result;
  }

  private getComplexityLevel(complexity: number): string {
    if (complexity <= 5) return 'Low';
    if (complexity <= 10) return 'Medium';
    return 'High';
  }

  async compileProject(project: LeoProject): Promise<{ message: string; result: CompilationResult }> {
    const result = await LeoCompilationService.compileProject(project);
    
    let message = "🔨 **Compilation Results**\n\n";
    
    if (result.success) {
      message += "✅ **Compilation Successful!**\n\n";
      message += `Build completed in ${result.buildTime}ms\n\n`;
      message += "```\n" + result.output + "\n```\n\n";
      message += "Your Leo program is ready to deploy! 🚀";
    } else {
      message += "❌ **Compilation Failed**\n\n";
      message += `Found ${result.errors.length} error(s):\n\n`;
      
      result.errors.forEach((error, index) => {
        message += `**Error ${index + 1}:** ${error.message}\n`;
        message += `📍 ${error.file}:${error.line}:${error.column}\n\n`;
      });
      
      if (result.warnings.length > 0) {
        message += `⚠️ **Warnings (${result.warnings.length}):**\n\n`;
        result.warnings.forEach((warning, index) => {
          message += `${index + 1}. ${warning.message} (${warning.file}:${warning.line})\n`;
        });
        message += "\n";
      }
      
      message += "Fix the errors above and try compiling again.";
    }
    
    return { message, result };
  }

  async runTests(project: LeoProject): Promise<{ message: string; result: TestResult }> {
    const result = await LeoCompilationService.runTests(project);
    
    let message = "🧪 **Test Results**\n\n";
    
    if (result.success) {
      message += "✅ **All Tests Passed!**\n\n";
      message += `${result.testsPassed}/${result.testsTotal} tests passed in ${result.duration}ms\n\n`;
      message += "```\n" + result.output + "\n```\n\n";
      message += "Great job! Your Leo code is working correctly. 🎉";
    } else {
      message += "❌ **Some Tests Failed**\n\n";
      message += `${result.testsPassed}/${result.testsTotal} tests passed\n\n`;
      
      if (result.failures.length > 0) {
        message += "**Failed Tests:**\n\n";
        result.failures.forEach((failure, index) => {
          message += `**${index + 1}. ${failure.testName}**\n`;
          message += `${failure.message}\n`;
          message += `Expected: \`${failure.expected}\`\n`;
          message += `Actual: \`${failure.actual}\`\n\n`;
        });
      }
      
      message += "Review the failed tests and fix the issues.";
    }
    
    return { message, result };
  }

  async exportProject(project: LeoProject, options = { 
    includeSource: true, 
    includeTests: true, 
    includeDocumentation: true, 
    format: 'zip' as const 
  }): Promise<{ message: string; exportPath: string }> {
    const exportPath = await LeoCompilationService.exportProject(project, options);
    
    const message = `📦 **Project Export Complete**\n\n` +
      `Your Leo project has been exported successfully!\n\n` +
      `**Export Details:**\n` +
      `• Project: ${project.name}\n` +
      `• Format: ${options.format.toUpperCase()}\n` +
      `• Source Code: ${options.includeSource ? '✅' : '❌'}\n` +
      `• Tests: ${options.includeTests ? '✅' : '❌'}\n` +
      `• Documentation: ${options.includeDocumentation ? '✅' : '❌'}\n\n` +
      `📁 Export saved to: \`${exportPath}\`\n\n` +
      `Your project is ready for deployment or sharing! 🚀`;
    
    return { message, exportPath };
  }

  async createFromTemplate(templateName: string, projectName: string, description?: string): Promise<{ message: string; project: LeoProject }> {
    try {
      const project = LeoTemplateService.createProjectFromTemplate(templateName, projectName, description);
      
      const message = `🎯 **Project Created from Template**\n\n` +
        `Successfully created "${projectName}" using the "${templateName}" template!\n\n` +
        `**Project Structure:**\n` +
        project.files.map(file => `• ${file.path}`).join('\n') + '\n\n' +
        `Your Leo project is ready for development. Start by exploring the generated code! 🚀`;
      
      return { message, project };
    } catch (error) {
      const message = `❌ **Template Creation Failed**\n\n` +
        `Could not create project from template "${templateName}".\n` +
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
        `Available templates: ${LeoTemplateService.getTemplates().map(t => t.name).join(', ')}`;
      
      throw new Error(message);
    }
  }
}

export default LLMService.getInstance();