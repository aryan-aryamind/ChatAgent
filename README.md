# AI Chatbot Agent - AI Chatbot Platform

A powerful AI agent builder designed for sales, customer support, and user engagement automation. Built with Next.js, Python FastAPI, and modern AI technologies.

![Version](https://img.shields.io/badge/version-0.0.1-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![Python](https://img.shields.io/badge/Python-3.9+-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [How It Works](#how-it-works)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Deployment](#deployment)

## 🎯 Overview

**AI Chatbot Agent** is a comprehensive AI chatbot platform that enables users to:

- **Create AI Agents**: Build custom chatbots trained on your own data
- **Multiple Data Sources**: Upload documents, scrape websites, or paste text
- **Dual Response Modes**: Choose between LLM-based or RAG-based responses
- **Full Website Scraping**: Automatically scrape entire websites for training data
- **Advanced Analytics**: Track conversations, performance, and user interactions
- **Easy Deployment**: Embed on websites, integrate with APIs, or use chat widgets

### Original Design
The project design is available at [Figma](https://www.figma.com/design/FqFcuc7HZZAikV7CC0O25s/Chatbase-Clone-Development).

## ✨ Features

### Core Features

- 🤖 **AI-Powered Chatbots**: Train ChatGPT on your data and create custom AI chatbots
- 📄 **Multiple Data Sources**: 
  - File uploads (PDF, DOCX, TXT)
  - Website scraping (entire websites, not just single pages)
  - Text input
  - Q&A pairs
  - Notion integration
- ⚡ **Lightning Fast Setup**: Get your chatbot running in under 2 minutes
- 🔒 **Secure & Private**: Encrypted data storage, never train on your data
- 🌐 **Deploy Anywhere**: Embed on websites, integrate with WhatsApp, Slack, or use API
- 📊 **Analytics & Insights**: Track conversations, measure performance
- 💬 **Conversation History**: View all conversations, export data
- 🎨 **Fully Customizable**: Customize appearance, behavior, and responses
- 🚀 **GPT-4 Powered**: Use latest AI models (GPT-4, Claude, Gemini)
- 🔗 **Integrations**: Connect with Zapier, Slack, WhatsApp, and 5000+ tools
- 🌍 **Multi-Language**: Support for 95+ languages

### Advanced Features

- **RAG (Retrieval Augmented Generation)**: Answer questions directly from scraped content
- **Full Website Scraping**: Scrape entire websites (up to 100 pages) with multi-page crawling
- **Semantic Search**: Find relevant content using sentence transformers
- **Intent Classification**: Automatically classify user queries
- **Dual Response Modes**: 
  - **LLM Mode**: Traditional AI responses using GPT/Claude
  - **CrewAI Mode**: Intent-based responses using Q&A pairs or content
- **Content Storage**: Store scraped content in JSON format for efficient retrieval
- **Smart Link Detection**: Automatically discover and crawl website pages using Playwright and BeautifulSoup
- **Compliance**: Built-in support for Indian data protection laws (DPDP Act 2023)
- **Legal Pages**: Integrated Privacy Policy, Terms of Service, and Cookie Policy

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14.2 (React 18.3)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **State Management**: React Context API
- **Forms**: React Hook Form
- **Authentication**: NextAuth.js
- **Database ORM**: Prisma
- **Charts**: Recharts

### Backend
- **Framework**: FastAPI (Python)
- **Language**: Python 3.9+
- **AI/ML**:
  - Sentence Transformers (semantic search)
  - Ollama (local LLM support)
- **Web Scraping**: BeautifulSoup4, lxml
- **HTTP Client**: Requests
- **Server**: Uvicorn

### Database
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js with Prisma Adapter

### Additional Tools
- **Web Scraping**: BeautifulSoup4, lxml, html5lib
- **Content Processing**: Turndown (HTML to Markdown)
- **File Parsing**: Cheerio, JSDOM

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Landing    │  │   Dashboard  │  │ Agent Builder│       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│              Next.js API Routes                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   /api/auth  │  │ /api/agents  │  │ /api/scrape  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Requests
                            │
┌─────────────────────────────────────────────────────────────┐
│         Python FastAPI Service (Port 8016)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   /scrape    │  │   /chat      │  │/chat-content │       │
│  │  (Playwright)│  │  (CrewAI)    │  │   (RAG)      │       │
│  │   /process   │  │              │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │Content       │  │Semantic      │  │LLM Agent     │       │
│  │Storage       │  │Search        │  │(Ollama)      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │    Users     │  │    Agents    │  │   Sessions   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User creates agent** → Enters website URL or uploads files
2. **Content scraping** → Python service scrapes website (multi-page crawling)
3. **Content storage** → Scraped content saved to JSON files
4. **User asks question** → Frontend sends query to API
5. **Semantic search** → Find relevant content chunks
6. **LLM generation** → Generate answer from relevant content
7. **Response** → Return answer with sources

## 📁 Project Structure

```
Chatbase-Clone/
├── 📄 README.md                    # This file
├── 📄 package.json                 # Frontend dependencies
├── 📄 tsconfig.json                # TypeScript configuration
├── 📄 tailwind.config.js           # Tailwind CSS configuration
├── 📄 next.config.js               # Next.js configuration
│
├── 📂 pages/                       # Next.js pages and API routes
│   ├── _app.tsx                    # App wrapper with providers
│   ├── _document.tsx               # Custom document
│   ├── index.tsx                   # Landing page
│   ├── login.tsx                   # Login page
│   ├── signup.tsx                  # Signup page
│   ├── privacy-policy/             # Privacy Policy page
│   ├── cookie-policy/              # Cookie Policy page
│   ├── terms-of-service/           # Terms of Service page
│   ├── dashboard/                  # Dashboard pages
│   ├── agents/                     # Agent pages
│   │   ├── index.tsx              # Agents list
│   │   ├── [id].tsx               # Agent builder
│   │   └── new/                    # Agent creation flow
│   │       ├── index.tsx          # Step 1: Start
│   │       ├── details.tsx         # Step 2: Details
│   │       ├── sources.tsx         # Step 3: Sources
│   │       └── model.tsx           # Step 4: Model
│   └── api/                        # API routes
│       ├── auth/                   # Authentication endpoints
│       └── agents/                 # Agent endpoints
│           └── [id]/
│               ├── chat.ts        # Chat API
│               └── scrape.ts      # Scraping API
│
├── 📂 src/
│   ├── 📂 app/
│   │   └── 📂 components/          # React components
│   │       ├── agent-builder/     # Agent builder components
│   │       ├── agent-creation/    # Agent creation flow
│   │       ├── auth/              # Authentication components
│   │       ├── chat-widget/       # Chat widget component
│   │       ├── dashboard/         # Dashboard components
│   │       ├── landing/           # Landing page components
│   │       └── ui/                # Reusable UI components
│   │
│   ├── 📂 contexts/               # React Context providers
│   │   ├── AgentCreationContext.tsx
│   │   ├── AgentsContext.tsx
│   │   └── AuthContext.tsx
│   │
│   ├── 📂 lib/                    # Utility libraries
│   │   ├── prisma.ts             # Prisma client
│   │   └── scraper/              # TypeScript scraper (fallback)
│   │       └── index.ts
│   │
│   └── 📂 styles/                 # Global styles
│       ├── globals.css
│       └── tailwind.css
│
├── 📂 prisma/                     # Database schema and migrations
│   ├── schema.prisma              # Prisma schema
│   └── migrations/               # Database migrations
│
├── 📂 crewai-service/             # Python FastAPI backend
│   ├── main.py                   # FastAPI application
│   ├── requirements.txt          # Python dependencies
│   ├── 📂 agents/                # AI agents
│   │   ├── intent_classifier.py  # Intent classification
│   │   ├── qa_matcher.py         # Q&A matching
│   │   ├── response_generator.py # Response generation
│   │   ├── llm_agent.py          # LLM integration
│   │   └── content_retriever.py  # Semantic search
│   ├── 📂 scraper/               # Web scraping module
│   │   ├── __init__.py
│   │   └── website_scraper.py    # BeautifulSoup scraper
│   ├── content_storage.py        # Content storage system
│   └── 📂 content_storage/       # Stored content (JSON files)
│
└── 📂 public/                     # Static assets
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **PostgreSQL** database
- **Ollama** (optional, for local LLM support)

### Frontend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Chatbase-Clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/chatbase"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3006"
   NEXTAUTH_SECRET="your-secret-key-here"

   # Python Service
   CREWAI_SERVICE_URL="http://localhost:8016"

   # Optional: Ollama
   OLLAMA_URL="http://localhost:11434"
   OLLAMA_MODEL="phi3:mini"
   ```

4. **Set up database**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   Frontend will be available at `http://localhost:3000`

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd crewai-service
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Mac/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up Ollama (Optional)**
   ```bash
   # Install Ollama from https://ollama.ai
   ollama pull phi3:mini
   ```

5. **Start Python service**
   ```bash
   python main.py
   ```

   Backend will be available at `http://localhost:8016`

### Verify Installation

1. **Frontend**: Visit `http://localhost:3006`
2. **Backend**: Visit `http://localhost:8016/health` (should return `{"status": "ok"}`)

## 🔄 How It Works

### Agent Creation Flow

1. **Step 1: Start**
   - User enters website URL or chooses manual setup
   - If URL entered → automatically creates source and skips to Step 3
   - If manual → proceeds to Step 2

2. **Step 2: Details** (Optional if URL entered)
   - Add multiple data sources:
     - Files (PDF, DOCX, TXT)
     - Links (website URLs)
     - Text (direct input)
     - Q&A pairs
     - Notion integration

3. **Step 3: Sources Processing**
   - Automatically scrapes all URLs
   - Extracts content from files
   - Generates Q&A pairs (optional)
   - Shows processing status for each source

4. **Step 4: Model Selection**
   - Choose response mode:
     - **LLM Mode**: GPT-4, Claude, Gemini
     - **CrewAI Mode**: Q&A pairs or RAG-based
   - Configure settings (temperature, tokens, etc.)
   - Create agent

### Web Scraping Process

1. **URL Input** → User provides website URL
2. **Multi-Page Crawling**:
   - Starts from homepage
   - Finds all internal links
   - Follows links up to specified depth (default: 5 levels)
   - Scrapes up to 100 pages (configurable)
   - Uses sitemap.xml if available
3. **Content Extraction**:
   - Removes ads, navigation, scripts
   - Extracts main content
   - Preserves headings and structure
   - Extracts metadata
4. **Storage**:
   - Saves all content to JSON format
   - Chunks content for efficient retrieval
   - Stores in `content_storage/` directory

### RAG-Based Chat Flow

1. **User Query** → User asks a question
2. **Content Retrieval**:
   - Loads stored content for agent
   - Splits into chunks
   - Uses semantic search to find relevant chunks
3. **Answer Generation**:
   - Combines relevant content chunks
   - Sends to LLM with context
   - Generates answer from content
4. **Response**:
   - Returns answer with source URLs
   - Shows confidence score
   - Provides citations

## 📡 API Documentation

### Frontend API Routes

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

#### Agents
- `POST /api/agents/[id]/chat` - Chat with agent
- `POST /api/agents/[id]/scrape` - Scrape website

### Backend API Endpoints

#### Health Check
```http
GET /health
```
Returns: `{"status": "ok"}`

#### Scrape Website
```http
POST /scrape
Content-Type: application/json

{
  "url": "https://example.com",
  "agent_id": "agent-123",
  "max_pages": 100,
  "max_depth": 5,
  "follow_external": false,
  "respect_robots": true,
  "delay": 0.3
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Page Title",
    "content": "Full website content...",
    "url": "https://example.com",
    "headings": [...],
    "metadata": {...},
    "stats": {
      "totalPages": 25,
      "totalCharacters": 50000,
      "headingsCount": 50
    },
    "pages": [...]
  }
}
```

#### Chat (CrewAI Mode)
```http
POST /chat
Content-Type: application/json

{
  "message": "What is your company about?",
  "qa_pairs": [...],
  "confidence_threshold": 0.8
}
```

#### Chat with Content (RAG Mode)
```http
POST /chat-content
Content-Type: application/json

{
  "message": "What services do you offer?",
  "agent_id": "agent-123",
  "confidence_threshold": 0.3
}
```

**Response:**
```json
{
  "text": "Answer generated from content...",
  "intent": "content_based",
  "confidence": 85,
  "sources": [
    {
      "url": "https://example.com/services",
      "title": "Our Services",
      "relevance": 0.92
    }
  ]
}
```

## 💻 Development

### Available Scripts

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx prisma studio    # Open Prisma Studio
npx prisma migrate   # Run migrations
npx prisma generate  # Generate Prisma client
```

### Code Structure

- **Components**: Reusable React components in `src/app/components/`
- **Contexts**: Global state management in `src/contexts/`
- **API Routes**: Server-side logic in `pages/api/`
- **Types**: TypeScript interfaces and types
- **Utils**: Helper functions in `src/lib/`

### Key Features Implementation

- **Agent Creation**: Multi-step wizard with context state
- **Web Scraping**: Python BeautifulSoup with multi-page crawling
- **RAG System**: Semantic search + LLM generation
- **Authentication**: NextAuth.js with Prisma adapter
- **Database**: Prisma ORM with PostgreSQL

## 🚢 Deployment

### Frontend Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel/Netlify**
   - Connect your repository
   - Set environment variables
   - Deploy automatically

### Backend Deployment

1. **Deploy Python service**
   - Use services like Railway, Render, or AWS
   - Set environment variables
   - Install dependencies: `pip install -r requirements.txt`
   - Run: `python main.py` or use `uvicorn main:app`

2. **Update frontend environment**
   - Set `CREWAI_SERVICE_URL` to your deployed backend URL

### Database

- Use managed PostgreSQL (Supabase, Railway, etc.)
- Update `DATABASE_URL` in environment variables
- Run migrations: `npx prisma migrate deploy`

## 📚 Additional Documentation

- [Agent Creation Flow](./AGENT_CREATION_FLOW.md) - Detailed agent creation process
- [Scraping Guide](./SCRAPING_GUIDE.md) - Web scraping documentation
- [Scraping Setup](./SCRAPING_SETUP.md) - Scraping setup instructions
- [RAG Implementation](./RAG_IMPLEMENTATION.md) - RAG system documentation
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md) - Dual-mode implementation
- [Authentication](./AUTHENTICATION_IMPLEMENTATION.md) - Auth setup guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Original design from [Figma](https://www.figma.com/design/FqFcuc7HZZAikV7CC0O25s/Chatbase-Clone-Development)
- Built with Next.js, FastAPI, and modern AI technologies

---

**Made with ❤️ for building better AI chatbots**
