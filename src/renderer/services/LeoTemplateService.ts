import { LeoProject, LeoFile } from '../types';

export interface LeoTemplate {
  name: string;
  description: string;
  files: Array<{
    name: string;
    path: string;
    content: string;
    type: 'leo' | 'md' | 'json';
  }>;
}

export class LeoTemplateService {
  private static templates: LeoTemplate[] = [
    {
      name: 'Basic Smart Contract',
      description: 'A simple Leo smart contract template with basic structure',
      files: [
        {
          name: 'main.leo',
          path: 'src/main.leo',
          content: `// Basic Leo Smart Contract
program basic_contract.aleo {
    // Define a simple record type
    record Token {
        owner: address,
        amount: u64,
    }

    // Transition function to mint tokens
    transition mint_public(public receiver: address, public amount: u64) -> Token {
        return Token {
            owner: receiver,
            amount: amount,
        };
    }

    // Transition function to transfer tokens
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
          type: 'leo' as const,
        },
        {
          name: 'program.json',
          path: 'program.json',
          content: `{
  "program": "basic_contract.aleo",
  "version": "0.0.0",
  "description": "A basic Leo smart contract",
  "license": "MIT"
}`,
          type: 'json' as const,
        },
        {
          name: 'README.md',
          path: 'README.md',
          content: `# Basic Contract

A simple Leo smart contract that demonstrates:
- Record definitions
- Public and private transitions
- Token minting and transfer functionality

## Build

\`\`\`bash
leo build
\`\`\`

## Test

\`\`\`bash
leo test
\`\`\`

## Run

\`\`\`bash
leo run mint_public aleo1... 100u64
\`\`\`
`,
          type: 'md' as const,
        },
      ],
    },
    {
      name: 'Voting System',
      description: 'A decentralized voting system with privacy features',
      files: [
        {
          name: 'main.leo',
          path: 'src/main.leo',
          content: `// Decentralized Voting System
program voting_system.aleo {
    // Record representing a vote
    record Vote {
        owner: address,
        proposal_id: u64,
        choice: bool, // true for yes, false for no
    }

    // Mapping to store vote counts
    mapping vote_counts: u64 => u64;

    // Transition to cast a vote
    transition cast_vote(public proposal_id: u64, public choice: bool) -> Vote {
        return Vote {
            owner: self.caller,
            proposal_id: proposal_id,
            choice: choice,
        };
    }

    // Finalize function to update vote counts
    finalize cast_vote(proposal_id: u64, choice: bool) {
        let current_count: u64 = Mapping::get_or_use(vote_counts, proposal_id, 0u64);
        let new_count: u64 = choice ? current_count + 1u64 : current_count;
        Mapping::set(vote_counts, proposal_id, new_count);
    }

    // Transition to get vote count for a proposal
    transition get_vote_count(public proposal_id: u64) -> u64 {
        return Mapping::get(vote_counts, proposal_id);
    }
}`,
          type: 'leo' as const,
        },
        {
          name: 'program.json',
          path: 'program.json',
          content: `{
  "program": "voting_system.aleo",
  "version": "0.0.0",
  "description": "A decentralized voting system with privacy features",
  "license": "MIT"
}`,
          type: 'json' as const,
        },
        {
          name: 'README.md',
          path: 'README.md',
          content: `# Voting System

A decentralized voting system that provides:
- Private vote casting
- Public vote counting
- Proposal-based voting structure

## Features

- **Privacy**: Individual votes are private records
- **Transparency**: Vote counts are publicly verifiable
- **Decentralization**: No central authority required

## Usage

### Cast a Vote
\`\`\`bash
leo run cast_vote 1u64 true
\`\`\`

### Check Vote Count
\`\`\`bash
leo run get_vote_count 1u64
\`\`\`
`,
          type: 'md' as const,
        },
      ],
    },
    {
      name: 'Auction System',
      description: 'A sealed-bid auction system with privacy guarantees',
      files: [
        {
          name: 'main.leo',
          path: 'src/main.leo',
          content: `// Sealed-Bid Auction System
program auction_system.aleo {
    // Record representing a bid
    record Bid {
        owner: address,
        auction_id: u64,
        amount: u64,
        bidder: address,
    }

    // Record representing auction info
    record AuctionInfo {
        owner: address,
        auction_id: u64,
        item_name: field,
        end_time: u64,
        min_bid: u64,
    }

    // Mapping to store highest bids
    mapping highest_bids: u64 => u64;

    // Transition to create an auction
    transition create_auction(
        public auction_id: u64,
        public item_name: field,
        public end_time: u64,
        public min_bid: u64
    ) -> AuctionInfo {
        return AuctionInfo {
            owner: self.caller,
            auction_id: auction_id,
            item_name: item_name,
            end_time: end_time,
            min_bid: min_bid,
        };
    }

    // Transition to place a bid
    transition place_bid(public auction_id: u64, public amount: u64) -> Bid {
        return Bid {
            owner: self.caller,
            auction_id: auction_id,
            amount: amount,
            bidder: self.caller,
        };
    }

    // Finalize function to update highest bid
    finalize place_bid(auction_id: u64, amount: u64) {
        let current_highest: u64 = Mapping::get_or_use(highest_bids, auction_id, 0u64);
        let new_highest: u64 = amount > current_highest ? amount : current_highest;
        Mapping::set(highest_bids, auction_id, new_highest);
    }

    // Transition to reveal winning bid
    transition reveal_winner(public auction_id: u64) -> u64 {
        return Mapping::get(highest_bids, auction_id);
    }
}`,
          type: 'leo' as const,
        },
        {
          name: 'program.json',
          path: 'program.json',
          content: `{
  "program": "auction_system.aleo",
  "version": "0.0.0",
  "description": "A sealed-bid auction system with privacy guarantees",
  "license": "MIT"
}`,
          type: 'json' as const,
        },
        {
          name: 'README.md',
          path: 'README.md',
          content: `# Auction System

A sealed-bid auction system featuring:
- Private bid submission
- Automatic highest bid tracking
- Time-based auction management

## How it Works

1. **Create Auction**: Set up an auction with item details and parameters
2. **Place Bids**: Bidders submit private bids
3. **Reveal Winner**: After auction ends, reveal the winning bid amount

## Commands

### Create an Auction
\`\`\`bash
leo run create_auction 1u64 123456field 1000000u64 10u64
\`\`\`

### Place a Bid
\`\`\`bash
leo run place_bid 1u64 50u64
\`\`\`

### Reveal Winner
\`\`\`bash
leo run reveal_winner 1u64
\`\`\`
`,
          type: 'md' as const,
        },
      ],
    },
  ];

  static getTemplates(): LeoTemplate[] {
    return this.templates;
  }

  static getTemplate(name: string): LeoTemplate | undefined {
    return this.templates.find(template => template.name === name);
  }

  static createProjectFromTemplate(templateName: string, projectName: string, description?: string): LeoProject {
    const template = this.getTemplate(templateName);
    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }

    const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const files: LeoFile[] = template.files.map((templateFile, index) => ({
      id: `file_${index}_${Date.now()}`,
      name: templateFile.name,
      path: templateFile.path,
      content: templateFile.content.replace(/basic_contract\.aleo/g, `${projectName}.aleo`),
      type: templateFile.type,
      isModified: false,
    }));

    return {
      id: projectId,
      name: projectName,
      description: description || template.description,
      files: files,
      createdAt: now,
      updatedAt: now,
      chatHistory: [],
    };
  }

  static createEmptyProject(projectName: string, description: string): LeoProject {
    const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const mainLeoContent = `// ${projectName} Smart Contract
program ${projectName}.aleo {
    // Define your program logic here
    
    transition main() {
        // Your main transition logic
    }
}`;

    const programJsonContent = `{
  "program": "${projectName}.aleo",
  "version": "0.0.0",
  "description": "${description}",
  "license": "MIT"
}`;

    const readmeContent = `# ${projectName}

${description}

## Build

\`\`\`bash
leo build
\`\`\`

## Test

\`\`\`bash
leo test
\`\`\`

## Run

\`\`\`bash
leo run main
\`\`\`
`;

    const files: LeoFile[] = [
      {
        id: `file_main_${Date.now()}`,
        name: 'main.leo',
        path: 'src/main.leo',
        content: mainLeoContent,
        type: 'leo',
        isModified: false,
      },
      {
        id: `file_program_${Date.now()}`,
        name: 'program.json',
        path: 'program.json',
        content: programJsonContent,
        type: 'json',
        isModified: false,
      },
      {
        id: `file_readme_${Date.now()}`,
        name: 'README.md',
        path: 'README.md',
        content: readmeContent,
        type: 'md',
        isModified: false,
      },
    ];

    return {
      id: projectId,
      name: projectName,
      description: description,
      files: files,
      createdAt: now,
      updatedAt: now,
      chatHistory: [],
    };
  }

  static getProjectStructure(): string[] {
    return [
      'src/',
      'src/main.leo',
      'inputs/',
      'inputs/main.in',
      'program.json',
      'README.md',
      '.gitignore',
    ];
  }

  static generateLeoBoilerplate(contractName: string): string {
    return `// ${contractName} Smart Contract
program ${contractName}.aleo {
    // Define your records here
    record ExampleRecord {
        owner: address,
        value: u64,
    }

    // Define your transitions here
    transition main(public input: u64) -> ExampleRecord {
        return ExampleRecord {
            owner: self.caller,
            value: input,
        };
    }

    // Add more transitions as needed
    transition example_function(record: ExampleRecord, public amount: u64) -> ExampleRecord {
        return ExampleRecord {
            owner: record.owner,
            value: record.value + amount,
        };
    }
}`;
  }
}