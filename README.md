# QuickNotes: AI-Powered Study Assistant

Transform educational documents into personalized, structured study materials using AI.

**QuickNotes** is a production-grade SaaS application that orchestrates document processing, prompt engineering, and LLM inference to generate exam-ready study notes.

---

## What Is QuickNotes?

### For Students
A web app that converts lecture notes, textbooks, and study materials into:
- Exam-focused summaries
- Concept definitions
- Key point extractions
- Presentation-ready notes
- And 4 other format variants

### For Engineers
A real-world ML system design project demonstrating:
- Document processing pipelines (PDF, DOCX, TXT)
- Prompt engineering as data quality strategy
- LLM inference orchestration
- Production SaaS architecture
- Cost optimization through free models

---

## Key Features

### 1. Multi-Format Note Generation
- **Key Points**: Bullet-point summaries
- **Main Concepts**: Definitions and explanations
- **Exam Points**: High-likelihood exam content
- **Short Notes**: Concise overviews
- **Speech Notes**: Presentation format
- **Presentation Notes**: Slide-by-slide breakdowns
- **Summary**: Comprehensive overview

### 2. Flexible Document Processing
- **Supported Formats**: PDF, DOCX, PPTX, TXT
- **Max File Size**: 50 MB
- **Batch Upload**: Up to 10 files per collection
- **Text Extraction**: Automatic language detection, UTF-8 support

### 3. Customizable Output
- **Word Count Control**: 50-500 words (user-defined)
- **Format Selection**: 7 distinct output types
- **Markdown Export**: Download notes as PDF or Markdown
- **Chat Integration**: Refine notes through conversation

### 4. Production-Ready Architecture
- **Authentication**: Supabase Auth (Google OAuth, Email/Password)
- **Database**: PostgreSQL with row-level security
- **LLM Inference**: OpenRouter (free tier: deepseek-r1-0528)
- **Deployment**: Vercel (serverless, global CDN)
- **Monitoring**: Error tracking, usage analytics

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16, React 19, TypeScript | UI/UX, state management |
| Backend | Node.js, Next.js API Routes | Document processing, inference |
| AI | OpenRouter API | LLM inference (free model) |
| Database | Supabase (PostgreSQL) | Metadata, collections, notes |
| Storage | Supabase Storage | Document archives |
| Auth | Supabase Auth | User authentication |
| Deployment | Vercel | Serverless hosting |
| Document Parsing | pdfjs-dist, mammoth, TextDecoder | Multi-format extraction |

---

## Architecture Overview

```
┌─────────────────────────────────────┐
│       User Interface (React)         │
│  - Upload documents                  │
│  - Select output format              │
│  - Set word count                    │
│  - View/download notes               │
└────────────┬────────────────────────┘
             │ HTTPS
             ↓
┌─────────────────────────────────────┐
│    API Layer (Vercel Serverless)    │
│  - /api/upload → Process documents   │
│  - /api/chat → LLM chat              │
│  - /api/notes/generate → Batch jobs  │
└────────────┬────────────────────────┘
             │
      ┌──────┴──────┐
      ↓             ↓
┌──────────────┐  ┌─────────────────┐
│  OpenRouter  │  │    Supabase     │
│  (LLM API)   │  │  - PostgreSQL   │
│              │  │  - Storage      │
│  Free Model: │  │  - Auth         │
│  tngtech/    │  │                 │
│  deepseek... │  │ Tables:         │
└──────────────┘  │  collections    │
                  │  documents      │
                  │  notes          │
                  │  messages       │
                  │  users (auth)   │
                  └─────────────────┘
```

---

## Document Processing Pipeline

```
User Upload (PDF/DOCX/TXT)
         ↓
1. Extract Text (pdfjs/mammoth/TextDecoder)
         ↓
2. Validate & Chunk (50KB → 1000-char chunks)
         ↓
3. Prompt Engineering (Select 1 of 7 templates)
         ↓
4. LLM Inference (OpenRouter API)
         ↓
5. Validate Output (Check word count, format)
         ↓
6. Store in Supabase (Collections + Notes tables)
         ↓
User Receives: Formatted markdown notes
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- Git
- Vercel account (or local deployment)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/quicknotes.git
cd quicknotes
npm install
```

### 2. Environment Configuration
Create `.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# OpenRouter (AI API)
OPENROUTER_API_KEY=your_openrouter_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OpenAI (for embeddings, optional)
OPENAI_API_KEY=your_openai_key
```

### 3. Database Setup
```bash
# Run Supabase SQL schema
# Copy contents of SUPABASE_SCHEMA.md into Supabase SQL editor
```

### 4. Run Development Server
```bash
npm run dev
# Open http://localhost:3000
```

---

## API Documentation

### POST /api/upload
Upload documents and generate study notes.

**Request**:
```json
{
  "collectionName": "Math Unit 3",
  "outputType": "exam-points",
  "wordCount": "150",
  "files": ["file1.pdf", "file2.docx"]
}
```

**Response**:
```json
{
  "success": true,
  "collection": {
    "id": "uuid",
    "name": "Math Unit 3"
  },
  "documents": [
    { "id": "uuid", "name": "file1.pdf", "status": "completed" }
  ],
  "notesId": "uuid",
  "notesSaved": true
}
```

### POST /api/chat
Stream chat responses with optional format conversion.

**Request**:
```json
{
  "question": "Explain quantum entanglement",
  "userId": "uuid",
  "format": "short-notes",
  "wordCount": 100
}
```

**Response**: Streaming text (Server-Sent Events)

---

## ML System Design

This project is a **practical ML system design** case study. See [docs/ML-SYSTEM-DESIGN.md](./docs/ML-SYSTEM-DESIGN.md) for:

- Problem framing (task formulation, objectives, metrics)
- Data systems fundamentals (sources, schemas, pipelines)
- Training data challenges (prompt engineering, sampling, quality)
- Production architecture and scalability

### Quick Summary: What Makes This ML System Design?

| Aspect | Details |
|--------|---------|
| **Does it train models?** | No. Focuses on inference orchestration. |
| **What replaces training data?** | Prompt engineering templates (7 variants). |
| **Data quality strategy?** | Instruction design + format templates. |
| **Scalability approach?** | Multi-layer storage, async processing, rate limiting. |
| **Cost strategy?** | Free LLM model (deepseek/deepseek-r1-0528), serverless compute. |

---

## Usage Examples

### Example 1: Generate Exam Notes from PDF
1. Upload `biology_chapter5.pdf`
2. Select "Exam Points" format
3. Set word count: 200
4. View auto-generated notes with definitions, dates, key facts
5. Download as PDF

### Example 2: Quick Summary for Presentation
1. Upload `marketing_case_study.docx`
2. Select "Presentation Notes" format
3. Set word count: 150
4. Get slide-by-slide breakdown with talking points
5. Copy-paste into PowerPoint

### Example 3: Refinement via Chat
1. Upload documents
2. Generate initial notes
3. Chat: "Make this more technical" or "Simplify for 10th grade"
4. Model refines notes based on conversation

---

## Monitoring & Logging

### Metrics Tracked
- Document extraction success rate (target: > 98%)
- Note generation latency (target: < 30 seconds)
- Format adherence rate (target: > 90%)
- API error rate (target: < 2%)
- User satisfaction (NPS > 40)

### Logging
Structured JSON logs sent to:
- Vercel (production)
- Console (development)

```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "level": "info",
  "message": "Document processed",
  "userId": "uuid",
  "processingTimeMs": 8500,
  "outputFormat": "exam-points",
  "wordCount": 150,
  "success": true
}
```

---

## Performance Characteristics

| Metric | Value | Notes |
|-------|-------|-------|
| Max Document Size | 50 MB | Upload limit |
| Max Extracted Text | 50 KB | Post-extraction limit |
| Max LLM Input | 8 KB | Token limit (free model) |
| Processing Latency | < 30 sec | p99 |
| Concurrent Users | ~100 | Vercel limit |
| Monthly Cost | ~$50 | Supabase + Vercel + free LLM |

---

## Deployment

### Deploy to Vercel (Recommended)
```bash
git push origin main
# Automatic deployment triggered
```

### Deploy Locally
```bash
npm run build
npm run start
```

### Environment Variables in Vercel
1. Go to Project Settings → Environment Variables
2. Add all `.env.local` variables
3. Redeploy

---

## Roadmap

- [ ] Background job processing (Bull/BullMQ)
- [ ] Vector embeddings for semantic search
- [ ] Fine-tuned model support (OpenAI Assistants API)
- [ ] Collaborative notes (real-time multiplayer)
- [ ] Mobile app (React Native)
- [ ] Batch processing API (async jobs)
- [ ] Advanced analytics dashboard

---

## Contributing

Contributions welcome! Please:
1. Fork repository
2. Create feature branch (`git checkout -b feature/xyz`)
3. Commit changes (`git commit -m "Add feature"`)
4. Push to branch (`git push origin feature/xyz`)
5. Open Pull Request

---

## License

MIT License. See [LICENSE](./LICENSE) file.

---

## Support

- **Issues**: Report bugs on GitHub Issues
- **Documentation**: See [docs/ML-SYSTEM-DESIGN.md](./docs/ML-SYSTEM-DESIGN.md)
- **Email**: support@quicknotess.space

---

## Acknowledgments

- **OpenRouter**: Free LLM API for inference
- **Supabase**: Backend-as-a-service (PostgreSQL, Auth, Storage)
- **Vercel**: Serverless deployment platform
- **Next.js**: React framework
- **PDF.js**: PDF text extraction
- **Mammoth**: DOCX to Markdown converter

---

**QuickNotes** © 2025. Built with Next.js, Supabase, and OpenRouter.
