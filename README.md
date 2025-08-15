# LeoForge Neo

Modern Electron application combining LLM chat with Leo smart contract development environment.

## Features

- **Electron + React + TypeScript**: Modern development stack
- **LLM Integration**: Chat interface for AI-assisted development
- **Monaco Editor**: Advanced code editing with Leo syntax support
- **Theme System**: Dark and light themes with gold accents
- **Project Management**: Multi-project support with chat histories

## Development Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

1. Build the application:
   ```bash
   npm run build:dev
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── main/           # Electron main process
│   ├── main.ts     # Main process entry point
│   └── preload.ts  # Preload script for IPC
└── renderer/       # React renderer process
    ├── index.html  # HTML template
    ├── index.tsx   # React entry point
    └── App.tsx     # Main App component
```

## Architecture

- **Main Process**: Handles window management and system integration
- **Renderer Process**: React-based UI with Monaco Editor
- **IPC Communication**: Secure communication between processes
- **TypeScript**: Full type safety across the application

## License

MIT