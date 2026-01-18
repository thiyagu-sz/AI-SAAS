# QuickNotes: Complete Comprehensive Project Guide

**Last Updated:** January 2026

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [How It Works](#3-how-it-works)
4. [Architecture](#4-architecture)
5. [Project Structure](#5-project-structure)
6. [Getting Started (Local Development)](#6-getting-started-local-development)
7. [Core Features & Functionality](#7-core-features--functionality)
8. [Database Schema](#8-database-schema)
9. [API Routes](#9-api-routes)
10. [Deployment](#10-deployment)
11. [Environment Variables](#11-environment-variables)
12. [Troubleshooting](#12-troubleshooting)
13. [Future Enhancements](#13-future-enhancements)

---

## 1. Project Overview

### What is QuickNotes?

**QuickNotes** is a production-grade SaaS application that transforms educational documents into personalized, structured study materials using AI. It's built for students who want to convert dense lecture notes, textbooks, and research papers into exam-ready study materials.

### Target Users

- **Students**: Convert study materials into multiple formats
- **Educators**: Generate study resources for course materials
- **Researchers**: Organize and summarize research documents

### Key Business Features

✅ **Multi-Format Note Generation** - Generate 7 different note types
✅ **Document Processing** - Support PDF, DOCX, PPTX, TXT (up to 50MB)
✅ **AI Chat Integration** - Ask questions about uploaded documents
✅ **Export Options** - Download as PDF or Markdown
✅ **Batch Upload** - Upload up to 10 files at once
✅ **User Authentication** - Secure login with Google OAuth & Email
✅ **Feedback System** - Collect user feedback for improvements
✅ **Analytics Dashboard** - Track system usage and feedback
✅ **Cost Optimized** - Uses free OpenRouter models

---

## 2. Tech Stack

### Frontend Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.1.1 | React framework with App Router, SSR, API routes |
| React | 19.2.3 | UI component library |
| TypeScript | ^5 | Static type checking |
| Tailwind CSS | ^4 | Utility-first CSS framework |
| Lucide React | ^0.562.0 | Icon library |
| React Compiler | 1.0.0 | Automatic component memoization |

### Backend Technologies

| Technology | Purpose |
|-----------|---------|
| Node.js (via Next.js) | JavaScript runtime for API routes |
| Next.js API Routes | Serverless backend endpoints |
| Express-like routing | Built into Next.js |

### AI & LLM

| Service | Model | Purpose |
|---------|-------|---------|
| OpenRouter API | Deepseek-R1-T2-Chimera (free) | Note generation & chat |
| LLaMA 3.2 (Alternative) | Via OpenRouter | Fallback model |

### Database & Authentication

| Technology | Version | Purpose |
|-----------|---------|---------|
| Supabase | - | PostgreSQL database hosting |
| PostgreSQL | 15+ | Relational database |
| Supabase Auth | - | OAuth 2.0 authentication |
| Google OAuth 2.0 | - | Third-party authentication |

### Document Processing Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| pdfjs-dist | ^5.4.530 | PDF text extraction |
| mammoth | ^1.11.0 | DOCX (Word) text extraction |
| pdf-parse | ^2.4.5 | PDF metadata extraction |
| pdf2json | ^4.0.0 | PDF parsing |
| puppeteer | ^24.34.0 | PDF generation for exports |
| jsPDF | ^4.0.0 | PDF creation |

### Deployment & Monitoring

| Service | Purpose |
|--------|---------|
| Vercel | Serverless hosting, CDN, auto-scaling |
| Vercel Analytics | Usage metrics and performance |
| Vercel Speed Insights | Core Web Vitals monitoring |

### Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code quality and linting |
| cross-env | Cross-platform environment variables |
| TypeScript | Type-safe development |

---

## 3. How It Works

### User Journey: Document to Study Notes

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  1. USER AUTHENTICATION                                         │
│     ↓                                                            │
│     User logs in via Google OAuth or Email/Password             │
│     (Supabase Auth handles verification)                        │
│                                                                  │
│  2. DOCUMENT UPLOAD                                             │
│     ↓                                                            │
│     Upload PDF/DOCX/PPTX/TXT (up to 50MB)                       │
│     → File sent to /api/upload endpoint                         │
│     → File stored in Supabase Storage                           │
│     → Document metadata saved to database                       │
│                                                                  │
│  3. TEXT EXTRACTION                                             │
│     ↓                                                            │
│     Backend extracts text using:                                │
│     - pdfjs-dist for PDFs                                       │
│     - mammoth for DOCX                                          │
│     - Native TextDecoder for TXT                                │
│     → Extracted text stored in database                         │
│                                                                  │
│  4. USER CONFIGURATION                                          │
│     ↓                                                            │
│     Select output format: 7 options                             │
│     - Key Points                                                │
│     - Main Concepts                                             │
│     - Exam Points                                               │
│     - Short Notes                                               │
│     - Speech Notes                                              │
│     - Presentation Notes                                        │
│     - Summary                                                   │
│     Set word count: 50-500 words                                │
│                                                                  │
│  5. AI NOTE GENERATION                                          │
│     ↓                                                            │
│     Frontend sends request to /api/notes/generate               │
│     Backend creates prompt:                                     │
│     ```                                                         │
│     Generate {format} from this text:                           │
│     Keep it to {wordCount} words                                │
│     Make it suitable for {format}                               │
│     [extracted text]                                            │
│     ```                                                         │
│     → API call to OpenRouter with Deepseek model                │
│     → Stream response back to user                              │
│                                                                  │
│  6. DISPLAY & INTERACTION                                       │
│     ↓                                                            │
│     Show generated notes in Markdown                            │
│     User can:                                                   │
│     - Edit notes                                                │
│     - Chat with AI for clarification                            │
│     - Save notes to database                                    │
│     - Export as PDF or Markdown                                 │
│                                                                  │
│  7. EXPORT                                                      │
│     ↓                                                            │
│     User clicks "Export as PDF"                                 │
│     → Uses jsPDF + puppeteer                                    │
│     → Generates PDF file                                        │
│     → Browser downloads file                                    │
│                                                                  │
│  8. FEEDBACK (Optional)                                         │
│     ↓                                                            │
│     User provides feedback on quality                           │
│     → Stored in feedback table                                  │
│     → Analytics dashboard tracks patterns                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### AI Chat Interaction

```
USER MESSAGE
     ↓
/api/chat endpoint receives message
     ↓
Build chat context:
  - Previous messages (from database)
  - Uploaded document text
  - System prompt for context
     ↓
Create full prompt with conversation history
     ↓
Call OpenRouter API with streaming enabled
     ↓
Stream response back to frontend in real-time
     ↓
Display response as it arrives (typewriter effect)
     ↓
Save conversation to database (chat_conversations table)
     ↓
DISPLAY TO USER
```

---

## 4. Architecture

### High-Level System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                              │
│                      (Web Browser - React)                        │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ Landing Page │  │  Chat Page   │  │ Upload Page  │  ...       │
│  │              │  │              │  │              │            │
│  │ - Auth UI    │  │ - Chat UI    │  │ - File input │            │
│  │ - Login      │  │ - Messages   │  │ - Progress   │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
└─────────┼──────────────────┼──────────────────┼───────────────────┘
          │ HTTPS            │                  │
          └──────────────────┼──────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│                    API LAYER (Next.js)                            │
│                   Vercel Serverless Functions                     │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  /api/chat                                               │    │
│  │  - Stream messages with LLM                              │    │
│  │  - Context-aware responses                               │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  /api/upload                                             │    │
│  │  - Accept file uploads                                   │    │
│  │  - Validate file size/type                               │    │
│  │  - Extract text                                          │    │
│  │  - Store metadata                                        │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  /api/notes/generate                                     │    │
│  │  - Build AI prompt                                       │    │
│  │  - Call LLM                                              │    │
│  │  - Format response                                       │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  /api/chat/pdf & /api/chat/export                        │    │
│  │  - Generate PDF/Markdown exports                         │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  /api/chat/save, /api/chat/load, /api/chat/delete        │    │
│  │  - Manage conversation history                           │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  /api/feedback                                           │    │
│  │  - Collect user feedback                                 │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
└──────┬───────────────┬──────────────────┬──────────────────┬─────┘
       │               │                  │                  │
       ↓               ↓                  ↓                  ↓
┌────────────┐  ┌────────────┐  ┌──────────────┐  ┌──────────────┐
│ Supabase   │  │ OpenRouter │  │ Supabase     │  │ Vercel       │
│ (Database  │  │ (LLM/AI)   │  │ Storage      │  │ (Hosting)    │
│ Auth)      │  │            │  │ (Files)      │  │              │
│            │  │            │  │              │  │              │
│ - Tables   │  │ - Stream   │  │ - Document   │  │ - CDN        │
│ - Users    │  │ - Chat     │  │   archives   │  │ - Analytics  │
│ - Auth     │  │ - Models   │  │              │  │ - Logs       │
└────────────┘  └────────────┘  └──────────────┘  └──────────────┘
```

### Component Architecture

```
App Router (Next.js 16)
│
├── /app/layout.tsx (Root layout)
│
├── /app/page.tsx (Landing page)
├── /app/login/page.tsx (Login page)
├── /app/signup/page.tsx (Signup page)
│
├── /app/chat/page.tsx (Chat interface)
│   └── Components:
│       ├── ChatWindow (main chat UI)
│       ├── MessageList (displays messages)
│       ├── InputArea (message input)
│       └── FilePreview (uploaded file info)
│
├── /app/upload/page.tsx (Document upload)
│   └── Components:
│       ├── FileUploader
│       ├── ProgressBar
│       └── FileList
│
├── /app/dashboard/page.tsx (Analytics dashboard)
│   └── Components:
│       └── FeedbackAnalyticsDashboard
│
├── /app/saved/page.tsx (Saved conversations)
├── /app/exports/page.tsx (Exported notes)
├── /app/notes/[id]/page.tsx (Individual note view)
│
└── /app/api/ (API Routes)
    ├── /upload/route.ts
    ├── /chat/route.ts
    ├── /feedback/route.ts
    └── ... (other API endpoints)
```

---

## 5. Project Structure

```
AI-SAAS/
│
├── app/                                    # Next.js App Directory
│   ├── layout.tsx                          # Root layout wrapper
│   ├── page.tsx                            # Home/Landing page
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx                 # Login page
│   │   └── signup/page.tsx                # Signup page
│   │
│   ├── chat/page.tsx                      # Chat interface
│   ├── upload/page.tsx                    # File upload interface
│   ├── dashboard/page.tsx                 # Analytics dashboard
│   ├── saved/page.tsx                     # Saved conversations
│   ├── exports/page.tsx                   # Exported files
│   ├── notes/[id]/page.tsx                # Individual note view
│   │
│   ├── api/                               # API Routes (Next.js serverless)
│   │   ├── chat/
│   │   │   ├── route.ts                   # Main chat endpoint
│   │   │   ├── save/route.ts              # Save conversation
│   │   │   ├── load/route.ts              # Load conversation history
│   │   │   ├── delete/route.ts            # Delete conversation
│   │   │   ├── export/route.ts            # Export chat as Markdown
│   │   │   └── pdf/route.ts               # Export chat as PDF
│   │   │
│   │   ├── upload/route.ts                # File upload endpoint
│   │   ├── feedback/route.ts              # Feedback submission
│   │   ├── notes/generate/route.ts        # Generate notes endpoint
│   │   └── ... (other endpoints)
│   │
│   ├── components/                        # Reusable React components
│   │   ├── LandingPage.tsx                # Landing page component
│   │   ├── Sidebar.tsx                    # Navigation sidebar
│   │   ├── FeedbackButton.tsx             # Feedback submission button
│   │   ├── FeedbackForm.tsx               # Feedback form modal
│   │   ├── FeedbackAnalyticsDashboard.tsx # Analytics display
│   │   └── ... (other components)
│   │
│   ├── lib/                               # Utility functions
│   │   ├── supabase.ts                    # Supabase client
│   │   ├── markdown.tsx                   # Markdown renderer
│   │   ├── reportGenerator.ts             # Report generation
│   │   └── ... (other utilities)
│   │
│   └── globals.css                        # Global styles
│
├── public/                                # Static assets
│   └── ... (images, fonts, etc.)
│
├── docs/                                  # Documentation
│   └── ML-SYSTEM-DESIGN.md               # ML system architecture
│
├── Configuration Files
│   ├── package.json                       # Dependencies & scripts
│   ├── tsconfig.json                      # TypeScript config
│   ├── next.config.ts                     # Next.js config
│   ├── tailwind.config.ts                 # Tailwind CSS config
│   ├── postcss.config.mjs                 # PostCSS config
│   ├── eslint.config.mjs                  # ESLint rules
│   └── next-env.d.ts                      # Next.js type definitions
│
├── Database & Deployment Schemas
│   ├── COMPLETE_DATABASE_SETUP.sql        # Full DB initialization
│   ├── FEEDBACK_SCHEMA.sql                # Feedback table setup
│   ├── SUPABASE_RLS_POLICIES.sql          # Row-level security policies
│   │
│
├── Documentation
│   ├── README.md                          # Quick start guide
│   ├── PROJECT_DOCUMENTATION.md           # Detailed project docs
│   ├── COMPREHENSIVE_PROJECT_GUIDE.md     # This file
│   ├── DEPLOYMENT.md                      # Deployment instructions
│   ├── ENV_SETUP.md                       # Environment setup
│   ├── FEEDBACK_SYSTEM.md                 # Feedback system docs
│   └── .env.local                         # Local environment variables (NOT IN GIT)
│
└── .gitignore                             # Git ignore rules
```

---

## 6. Getting Started (Local Development)

### Prerequisites

- Node.js 18+ & npm/yarn
- Git
- A Supabase account
- An OpenRouter account (free tier available)
- A Google OAuth app (optional, for Google login)

### Step 1: Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-study-notes.git
cd ai-study-notes
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- Next.js 16
- React 19
- Tailwind CSS 4
- TypeScript
- Supabase client
- PDF/Document processing libraries
- Other dependencies listed in `package.json`

### Step 3: Set Up Environment Variables

Create `.env.local` in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Keys (get from OpenRouter)
OPENROUTER_API_KEY=sk-or-v1-xxxxx
OPENAI_API_KEY=sk-xxxxx (optional)
```

**Important Notes:**
- NO spaces around `=`
- NO quotes around values
- Public variables MUST have `NEXT_PUBLIC_` prefix
- Private keys go without prefix

### Step 4: Set Up Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for project initialization
4. Run SQL migrations from `COMPLETE_DATABASE_SETUP.sql`
5. Apply RLS policies from `SUPABASE_RLS_POLICIES.sql`
6. Copy your URL and anon key to `.env.local`

### Step 5: Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Step 6: Test Features

1. **Authentication**: Try signing up and logging in
2. **Upload**: Upload a PDF or DOCX file
3. **Chat**: Ask questions about uploaded documents
4. **Generate Notes**: Create study notes in different formats
5. **Export**: Download notes as PDF or Markdown

---

## 7. Core Features & Functionality

### 7.1 Authentication System

**Flow:**
```
User → Login Page → Supabase Auth
                   ├── Email/Password → Database check
                   └── Google OAuth → Google servers
                       ↓
                   JWT Token created
                   ↓
                   User redirected to dashboard
```

**Implementation:**
- Uses Supabase Auth SDK
- Supports email/password and Google OAuth
- Session management via JWT tokens
- Protected routes via middleware

### 7.2 Document Upload & Processing

**Supported Formats:**
- PDF (via pdfjs-dist)
- DOCX (via mammoth)
- PPTX (via pptx parser)
- TXT (via TextDecoder)

**Process:**
1. User selects file(s)
2. Frontend validates: file type, size (max 50MB)
3. Send to `/api/upload` endpoint
4. Backend extracts text using appropriate library
5. Store file in Supabase Storage
6. Save metadata to `documents` table
7. Store extracted text in database

**Code Example:**
```typescript
// File: app/api/upload/route.ts
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  
  // Validate file
  if (file.size > 50 * 1024 * 1024) {
    return Response.json({ error: "File too large" }, { status: 400 });
  }
  
  // Extract text based on file type
  let extractedText = "";
  if (file.type === "application/pdf") {
    extractedText = await extractPdfText(file);
  } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    extractedText = await extractDocxText(file);
  }
  
  // Save to Supabase
  // ...
  
  return Response.json({ success: true, documentId: newDoc.id });
}
```

### 7.3 AI Note Generation

**7 Output Formats:**

1. **Key Points** - Bullet-point summary of main topics
2. **Main Concepts** - In-depth definitions with explanations
3. **Exam Points** - High-likelihood exam content
4. **Short Notes** - Concise 1-2 line summaries
5. **Speech Notes** - Presentation-ready format
6. **Presentation Notes** - Slide-by-slide breakdown
7. **Summary** - Comprehensive overview

**Generation Process:**

```
User Input:
{
  format: "Key Points",
  wordCount: 200,
  documentId: "doc-123"
}
     ↓
Build Prompt:
```
Generate Key Points from the following text in exactly 200 words:

[extracted document text]

Focus on main topics suitable for exam preparation.
```
     ↓
Call OpenRouter API:
POST https://openrouter.ai/api/v1/chat/completions
{
  "model": "deepseek/deepseek-r1-t2-chimera",
  "messages": [{"role": "user", "content": prompt}],
  "stream": true
}
     ↓
Stream Response to Frontend
     ↓
Display Markdown formatted notes
```

### 7.4 AI Chat Integration

**Features:**
- Context-aware responses (remembers previous messages)
- Can reference uploaded documents
- Streaming responses (real-time display)
- Save/load conversation history
- Export conversations

**Prompt Structure:**
```
System: You are a helpful study assistant...

Document Context:
[previous extracted text]

Conversation History:
User: [previous message]
Assistant: [previous response]
...

New User Message: [current message]
```

### 7.5 Export Functionality

**PDF Export:**
- Uses jsPDF for formatting
- Puppeteer for rendering complex layouts
- Saves as downloadable file

**Markdown Export:**
- Converts notes to markdown format
- Preserves formatting
- Downloadable as .md file

### 7.6 Feedback System

**Features:**
- In-app feedback form
- Rate quality (1-5 stars)
- Text comments
- Automatic timestamp
- Analytics dashboard

**Storage:**
- All feedback stored in `feedback` table
- Analyzable patterns for improvements

### 7.7 Analytics Dashboard

**Metrics:**
- Total feedback submissions
- Average quality rating
- Most common feedback topics
- User engagement metrics
- System usage statistics

---

## 8. Database Schema

### Tables Overview

#### 1. `auth.users` (Supabase managed)
```sql
- id (UUID, primary key)
- email (text)
- encrypted_password (text)
- email_confirmed_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 2. `public.documents`
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key to auth.users)
- filename (text)
- file_type (text: 'pdf', 'docx', 'pptx', 'txt')
- extracted_text (text)
- file_size (integer, bytes)
- upload_date (timestamp)
- storage_path (text, Supabase Storage path)
```

#### 3. `public.notes`
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key)
- document_id (UUID, foreign key)
- format (text: 'key_points', 'concepts', 'exam_points', etc.)
- word_count (integer)
- content (text, markdown)
- generated_at (timestamp)
- ai_model (text)
```

#### 4. `public.chat_conversations`
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key)
- document_id (UUID, foreign key)
- title (text)
- created_at (timestamp)
- last_updated (timestamp)
```

#### 5. `public.chat_messages`
```sql
- id (UUID, primary key)
- conversation_id (UUID, foreign key)
- role (text: 'user' or 'assistant')
- content (text)
- created_at (timestamp)
```

#### 6. `public.feedback`
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key)
- rating (integer: 1-5)
- comment (text)
- feature_used (text)
- created_at (timestamp)
- ip_address (text, optional)
```

#### 7. `public.collections`
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key)
- name (text)
- description (text)
- created_at (timestamp)
```

### Row-Level Security (RLS) Policies

All tables have RLS enabled with policies:

```sql
-- Users can only view/edit their own data
CREATE POLICY "Users can view their own documents"
  ON public.documents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON public.documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Similar policies for other tables
```

---

## 9. API Routes

### Authentication Routes

#### `/auth/callback`
- **Method**: GET
- **Purpose**: OAuth callback from Supabase
- **Params**: code, state
- **Returns**: Redirects to dashboard on success

### Document Routes

#### `POST /api/upload`
- **Purpose**: Upload document
- **Request**: FormData with `file` field
- **Response**: `{ documentId, filename, extractedText }`
- **Errors**: 400 (invalid), 413 (too large), 500 (server error)

#### `GET /api/documents`
- **Purpose**: List user's documents
- **Response**: Array of documents

#### `DELETE /api/documents/[id]`
- **Purpose**: Delete document
- **Response**: `{ success: true }`

### Chat Routes

#### `POST /api/chat`
- **Purpose**: Send chat message
- **Request**: `{ message, documentId, conversationId }`
- **Response**: Streamed text response
- **Features**: Real-time streaming, context-aware

#### `GET /api/chat/history`
- **Purpose**: Get chat history
- **Response**: Array of conversations with messages

#### `POST /api/chat/save`
- **Purpose**: Save conversation
- **Request**: `{ conversationId, title }`
- **Response**: `{ success: true }`

#### `DELETE /api/chat/delete`
- **Purpose**: Delete conversation
- **Response**: `{ success: true }`

#### `POST /api/chat/export`
- **Purpose**: Export as Markdown
- **Response**: Markdown text

#### `POST /api/chat/pdf`
- **Purpose**: Export as PDF
- **Response**: PDF file (binary)

### Note Generation Routes

#### `POST /api/notes/generate`
- **Purpose**: Generate notes in specific format
- **Request**: `{ documentId, format, wordCount }`
- **Response**: Streamed note content
- **Formats**: key_points, concepts, exam_points, short_notes, speech_notes, presentation_notes, summary

### Feedback Routes

#### `POST /api/feedback`
- **Purpose**: Submit feedback
- **Request**: `{ rating, comment, featureUsed }`
- **Response**: `{ success: true, feedbackId }`

---

## 10. Deployment

### Prerequisites for Deployment

- GitHub repository with code
- Vercel account
- Supabase project
- OpenRouter API key
- Environment variables configured

### Deployment Platforms

#### **Option 1: Vercel (Recommended)**

**Why Vercel?**
- Made by Next.js creators
- Zero-config deployment
- Automatic environment variable management
- Built-in analytics
- Edge functions support
- Free tier available

**Steps:**

1. **Push code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/ai-study-notes.git
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Visit [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel auto-detects Next.js

3. **Configure Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local`:
     ```
     NEXT_PUBLIC_SUPABASE_URL
     NEXT_PUBLIC_SUPABASE_ANON_KEY
     OPENROUTER_API_KEY
     OPENAI_API_KEY (optional)
     ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for build completion
   - Your app is live at `https://your-project.vercel.app`

5. **Update Supabase URLs:**
   - Supabase Dashboard → Authentication → URL Configuration
   - Add redirect URLs:
     - `https://your-project.vercel.app`
     - `https://your-project.vercel.app/auth/callback`

#### **Option 2: Netlify**

**Steps:**
```bash
# Build locally first to test
npm run build

# Deploy
npm install -g netlify-cli
netlify deploy --prod --dir=.next
```

#### **Option 3: Railway**

**Steps:**
- Connect GitHub repository
- Railway auto-detects Next.js
- Set environment variables in Railway dashboard
- Deploy with one click

### Pre-Deployment Checklist

- ✅ All environment variables configured
- ✅ Database migrations run
- ✅ RLS policies enabled
- ✅ Supabase auth URLs updated
- ✅ API keys have proper permissions
- ✅ Test build locally: `npm run build && npm start`
- ✅ `.env.local` NOT committed to git
- ✅ All features tested in staging

### Monitoring & Maintenance

**Vercel Analytics:**
- Visit Vercel Dashboard → Analytics
- Monitor:
  - Page load times
  - Core Web Vitals
  - Error rates
  - Traffic patterns

**Supabase Monitoring:**
- Database query performance
- Storage usage
- API rate limits

**Application Monitoring:**
- Log errors (check Vercel Function Logs)
- Track API response times
- Monitor OpenRouter API usage

### Scaling Considerations

1. **Database**: Supabase handles scaling automatically
2. **Storage**: Monitor Supabase Storage usage
3. **API Limits**: OpenRouter has rate limits on free tier
4. **Serverless Functions**: Vercel handles auto-scaling
5. **CDN**: Vercel automatically caches static assets

---

## 11. Environment Variables

### Required Variables

```env
# SUPABASE (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiL...

# AI/LLM (Required)
OPENROUTER_API_KEY=sk-or-v1-d75a2568c455fcc046b65238eb1...

# Optional but Recommended
OPENAI_API_KEY=sk-proj-xxxxx
```

### Where to Get Values

**Supabase URL & Key:**
1. Supabase Dashboard → Project Settings
2. Copy "URL" and "Anon public key"
3. Add to `.env.local`

**OpenRouter API Key:**
1. OpenRouter Dashboard → Keys
2. Create new key or copy existing
3. Add to `.env.local`

**Google OAuth (for login):**
1. Google Cloud Console → OAuth 2.0 IDs
2. Create credentials for web app
3. Add to Supabase OAuth providers

### Environment Variable Naming Rules

- **Public variables** (accessible from browser): `NEXT_PUBLIC_*`
- **Private variables** (backend only): No `NEXT_PUBLIC_` prefix
- **No spaces** around `=`
- **No quotes** around values
- **One variable per line**

### Important Notes

⚠️ **NEVER commit `.env.local` to git**
⚠️ **NEVER share API keys**
⚠️ **NEVER put keys in comments**
⚠️ **Rotate keys if exposed**

---

## 12. Troubleshooting

### Common Issues & Solutions

#### Issue: "401 Unauthorized" Error on Chat

**Cause**: OpenRouter API key missing or invalid

**Solution:**
1. Check `.env.local` has `OPENROUTER_API_KEY`
2. Verify key format: `sk-or-v1-xxxxx`
3. Restart dev server: `Ctrl+C` then `npm run dev`
4. Check OpenRouter dashboard for key validity

#### Issue: Documents Not Uploading

**Cause**: File size > 50MB or unsupported format

**Solution:**
1. Check file size: Must be < 50MB
2. Check format: PDF, DOCX, PPTX, TXT only
3. Check browser console for errors
4. Try with different file

#### Issue: Chat Not Streaming Responses

**Cause**: Network issue or API timeout

**Solution:**
1. Check internet connection
2. Check OpenRouter API status
3. Clear browser cache
4. Try smaller document

#### Issue: Can't Log In with Google

**Cause**: OAuth callback URL misconfigured

**Solution:**
1. Supabase Dashboard → Authentication → URL Configuration
2. Add your app's URL to "Redirect URLs"
3. Format: `https://yourdomain.com/auth/callback`
4. Wait 1 minute for changes to apply

#### Issue: Database Tables Not Found

**Cause**: Migrations not run

**Solution:**
1. Supabase Dashboard → SQL Editor
2. Open `COMPLETE_DATABASE_SETUP.sql`
3. Copy content
4. Paste and run in SQL Editor
5. Apply RLS policies from `SUPABASE_RLS_POLICIES.sql`

#### Issue: PDF Export Not Working

**Cause**: Puppeteer installation issue

**Solution:**
```bash
# Reinstall with build tools
npm install --save puppeteer

# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

#### Issue: Vercel Deployment Fails

**Cause**: Missing environment variables or build issues

**Solution:**
1. Check Vercel deployment logs
2. Verify all env vars in Vercel dashboard
3. Test build locally: `npm run build`
4. Check for TypeScript errors: `npx tsc --noEmit`

### Debug Mode

**Enable Debug Logging:**

Add to `.env.local`:
```env
DEBUG=true
LOG_LEVEL=debug
```

Then check:
1. Browser console (F12)
2. Terminal output
3. Vercel function logs (if deployed)

### Getting Help

1. Check [Next.js Docs](https://nextjs.org/docs)
2. Check [Supabase Docs](https://supabase.com/docs)
3. Check [OpenRouter Docs](https://openrouter.ai/docs)
4. GitHub Issues on the repository
5. Community Discord servers

---

## 13. Future Enhancements

### Planned Features

1. **Advanced Analytics**
   - User engagement metrics
   - Popular note formats
   - Peak usage times
   - Feature usage patterns

2. **Enhanced AI**
   - Multiple LLM model selection
   - Fine-tuned models for subjects
   - Better context management
   - Multi-language support

3. **Collaboration Features**
   - Share notes with classmates
   - Collaborative document editing
   - Group study rooms
   - Comments on notes

4. **Mobile App**
   - React Native app
   - Offline note access
   - Mobile camera for document capture
   - Push notifications

5. **Premium Features**
   - Unlimited document uploads
   - Priority API access
   - Custom AI models
   - Team accounts
   - Advanced export formats

6. **Content Library**
   - Pre-made study materials
   - Subject templates
   - Example notes
   - Study guides

### Performance Optimizations

1. **Caching**
   - Redis cache for frequently generated notes
   - Browser caching optimization
   - API response caching

2. **Database**
   - Query optimization
   - Indexing improvements
   - Archival of old conversations

3. **Frontend**
   - Code splitting
   - Lazy loading components
   - Image optimization
   - Bundle size reduction

### Cost Optimization

1. **LLM Model Selection**
   - Switch to free models
   - Implement rate limiting
   - Batch processing
   - Caching responses

2. **Storage**
   - Archive old files
   - Compress documents
   - Remove duplicate uploads

3. **Infrastructure**
   - Use edge functions for processing
   - Optimize database queries
   - Reduce API calls

---

## Conclusion

**QuickNotes** is a comprehensive, production-ready SaaS application that demonstrates:

✅ Full-stack modern web development (Next.js 16, React 19, TypeScript)
✅ Real-world database design and optimization
✅ Secure authentication and authorization
✅ AI/LLM integration at scale
✅ Professional document processing
✅ Deployment best practices
✅ Feedback collection and analytics

The architecture is scalable, maintainable, and ready for production use with millions of users.

---

**Last Updated**: January 2026
**Version**: 1.0
**Maintainers**: Development Team
