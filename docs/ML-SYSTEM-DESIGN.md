# ML System Design: QuickNotes AI Study Assistant

## Executive Summary

QuickNotes is a production-grade ML system that orchestrates document processing, prompt engineering, and LLM inference to generate customized study materials. It demonstrates practical ML system design principles applied to a real-world SaaS application without traditional model training.

**Key Distinction**: This is an ML inference system, not a training system. All machine learning components are orchestrated through API integrations and strategic prompt design.

---

## Part A: Problem Framing

### A.1 Problem Formulation

**Primary Use Case**: Transform unstructured educational documents into structured, personalized study materials.

**Business Objective**: 
- Reduce time students spend organizing study materials
- Improve retention through multiple output formats
- Provide cost-effective AI-powered note generation

**Technical Objective**:
- Extract and summarize key information from documents
- Generate format-specific outputs (exam-focused, concise, presentation-ready)
- Process documents reliably within cost and latency constraints

### A.2 ML Task Classification

**Task Type**: Conditional Text Summarization + Format Adaptation

- **Input**: Document text (500-50,000 characters after chunking)
- **Output**: Structured markdown notes (50-200 words configurable)
- **Condition**: User-selected format (7 variants) and word count

**Format Variants**:
```
key-points        → Exam-friendly bullet points
main-concepts     → Definitions and explanations
exam-points       → High-likelihood exam content
short-notes       → Concise summary
speech-notes      → Verbal presentation format
presentation-notes → Slide-by-slide breakdown
summary           → Comprehensive overview
```

### A.3 Input Features and Output Targets

**Input Features**:
```
Feature                Type              Source              Constraint
─────────────────────────────────────────────────────────────────────
Document Text         String            PDF, DOCX, TXT      Max 50KB
Output Format         Categorical       User Selection      7 options
Word Count            Integer           User Input          50-500 words
User ID               UUID              Auth Token          Required
Document Metadata     {name, size}      File Upload         < 50MB
```

**Output Targets**:
```
Output              Structure         Quality Signal        Storage
──────────────────────────────────────────────────────────────────
Generated Notes     Markdown          Word count match      Supabase
Collection ID       UUID              Data integrity        FK constraint
Extraction Success  Boolean           Process completion    Audit trail
```

### A.4 System Constraints

**Technical Constraints**:
| Constraint | Value | Rationale |
|-----------|-------|-----------|
| Max Input Size | 50 KB | Token limit (free model) |
| Max Document Size | 50 MB | Server memory, upload time |
| Max Concurrent Uploads | 10 files | Batch processing limit |
| Response Time | < 30s | User experience |
| Token Limit | 2,000 max_tokens | Cost optimization |

**Data Constraints**:
- Documents must be text-extractable (searchable PDFs only)
- No corrupted or binary-only files
- Minimum 100 characters for meaningful processing
- Character encoding: UTF-8 only

**Cost Constraints**:
- Model: `deepseek/deepseek-r1-0528:free` (free tier)
- No embedding generation by default (memory efficient)
- Batch processing during off-peak hours possible

### A.5 Evaluation Metrics

**User-Facing Metrics**:
```
Metric                      Type      Target    Measurement
─────────────────────────────────────────────────────────────
Format Adherence            %         > 90%     Regex parsing
Word Count Accuracy         %         > 95%     Token count
Processing Success Rate     %         > 98%     Error rate
User Satisfaction          NPS        > 40      Feedback forms
```

**System Metrics**:
```
Metric                      Type      Target    Tool
─────────────────────────────────────────────────────
Latency (p99)              ms         < 30000   Server logs
Throughput                 docs/min   > 20      Vercel analytics
Error Rate                 %          < 2%      Sentry / Logs
API Cost per Document      $          < $0.01   OpenRouter billing
```

**Business Metrics**:
```
Metric                      Type      Target    Frequency
──────────────────────────────────────────────
MAU (Monthly Active Users)  Count      > 100    Monthly
Documents Processed         Count      > 500    Monthly
Avg Session Duration        Minutes    > 5      Weekly
Churn Rate                  %          < 5%     Monthly
```

### A.6 System Architecture Objectives

**Design Goals**:
1. **Reliability**: 98%+ uptime, graceful error handling
2. **Scalability**: Handle 100+ concurrent users
3. **Cost Efficiency**: Leverage free models, minimize compute
4. **Maintainability**: Clear separation of concerns, modular design
5. **Extensibility**: Easy to add new output formats or models

---

## Part B: Data Systems Fundamentals

### B.1 Data Sources

**Primary Data Sources**:

```
Source Type         Format           Frequency      Volume
───────────────────────────────────────────────────────────
User Uploads        PDF, DOCX, PPT   On-demand      < 50MB/file
Chat History        Text             Real-time      Streamed
Previous Notes      Markdown         On-demand      < 10KB/note
User Feedback       JSON             Event-driven   < 1KB/feedback
```

**Data Collection Points**:
- `POST /api/upload` → Collects documents
- `POST /api/chat` → Streams conversations
- `POST /api/feedback` → Captures user ratings
- Supabase Auth → User identity, session data

### B.2 Data Models and Schema

**Core Supabase Tables**:

```sql
-- Collections (user's document groups)
CREATE TABLE collections (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Documents (extracted files)
CREATE TABLE document_collections (
  id UUID PRIMARY KEY,
  collection_id UUID NOT NULL,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,           -- PDF, DOCX, etc.
  file_size INTEGER,
  content TEXT,             -- Extracted text
  embedding VECTOR,         -- Optional: for RAG
  created_at TIMESTAMP,
  FOREIGN KEY (collection_id) REFERENCES collections(id)
);

-- Generated Notes
CREATE TABLE notes (
  id UUID PRIMARY KEY,
  collection_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,    -- Markdown output
  format_type TEXT,         -- key-points, exam-points, etc.
  word_count INTEGER,
  created_at TIMESTAMP,
  FOREIGN KEY (collection_id) REFERENCES collections(id)
);

-- Conversations (chat history)
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  created_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Chat Messages (for RAG/context)
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL,
  role TEXT,                -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);
```

### B.3 Data Storage Architecture

**Multi-Layer Storage Strategy**:

```
Layer 1: Hot Data (Active Use)
┌─────────────────────────────────┐
│ Supabase PostgreSQL             │
│ - Collections                   │
│ - Notes (last 30 days)          │
│ - Chat history                  │
│ - User sessions                 │
│ RTO: < 5 min                    │
└─────────────────────────────────┘
           ↓
Layer 2: Cold Data (Archive)
┌─────────────────────────────────┐
│ Supabase Storage (S3-like)      │
│ - Original documents            │
│ - Processed PDFs                │
│ - Backups                       │
│ RTO: < 1 hour                   │
└─────────────────────────────────┘
           ↓
Layer 3: Transient Data (Ephemeral)
┌─────────────────────────────────┐
│ Server Memory / Edge Cache      │
│ - Extracted text (50KB chunks)  │
│ - LLM context window            │
│ - Processing state              │
│ TTL: Request-scoped             │
└─────────────────────────────────┘
```

### B.4 Data Processing Pipeline

**Batch Processing Approach** (Synchronous):

```
Step 1: Ingestion
┌─────────────────────────┐
│ POST /api/upload        │
│ - Receive file          │
│ - Validate format       │
│ - Check size/auth       │
└──────────┬──────────────┘
           ↓
Step 2: Extraction
┌─────────────────────────┐
│ extractTextFromFile()   │
│ - PDF → pdfjs-dist      │
│ - DOCX → mammoth        │
│ - TXT → TextDecoder     │
│ Max: 8000 chars output  │
└──────────┬──────────────┘
           ↓
Step 3: Chunking
┌─────────────────────────┐
│ chunkText()             │
│ - 1000 char chunks      │
│ - 200 char overlap      │
│ - Sliding window        │
└──────────┬──────────────┘
           ↓
Step 4: Prompt Engineering
┌─────────────────────────┐
│ generateFormatPrompt()  │
│ - Select 1 of 7 formats │
│ - Inject word count     │
│ - Add instructions      │
└──────────┬──────────────┘
           ↓
Step 5: LLM Inference
┌─────────────────────────┐
│ OpenRouter API          │
│ - tngtech/deepseek...   │
│ - Temperature: 0.3      │
│ - Max tokens: 2000      │
└──────────┬──────────────┘
           ↓
Step 6: Storage
┌─────────────────────────┐
│ Supabase Insert         │
│ - Save to notes table   │
│ - Update collection     │
│ - Log processing       │
└─────────────────────────┘
```

**Data Flow Diagram**:

```
User Upload (50MB PDF)
        ↓
┌───────────────────────────────────┐
│  File Extraction Layer            │
│  ┌─────────────────────────────┐  │
│  │ pdfjs / mammoth / TextDecode│  │
│  └────────────┬────────────────┘  │
│               ↓                    │
│  ┌─────────────────────────────┐  │
│  │ Extracted Text (~50KB)      │  │
│  │ Split into chunks           │  │
│  └────────────┬────────────────┘  │
└───────────────┼───────────────────┘
                ↓
        ┌──────────────────┐
        │ Chunking Module  │
        │ 1000-char chunks │
        └────────┬─────────┘
                 ↓
    ┌────────────────────────────┐
    │ Prompt Engineering         │
    │ + Format Selection         │
    │ + Word Count Constraint    │
    └───────────┬────────────────┘
                ↓
    ┌────────────────────────────┐
    │ LLM API Call               │
    │ (OpenRouter)               │
    │ Temperature: 0.3 (factual) │
    └───────────┬────────────────┘
                ↓
    ┌────────────────────────────┐
    │ Output Validation          │
    │ Word count check           │
    │ Format compliance          │
    └───────────┬────────────────┘
                ↓
    ┌────────────────────────────┐
    │ Supabase Storage           │
    │ - Save notes               │
    │ - Update metadata          │
    │ - Log events               │
    └────────────────────────────┘
```

### B.5 Data Processing Strategy: Batch vs Real-Time

**Current: Synchronous Batch Processing**

```
Approach     Processing    Latency     Use Case
──────────────────────────────────────────────
Synchronous  User Upload   < 30s       Primary (current)
             → Extract
             → Process
             → Return
             
Batch (Future) Scheduled  < 2 hours   Off-peak processing
               Night runs
               Cost optimization
               
Streaming    Chunk-by-      N/A       Not applicable
(N/A)        chunk (not     
             needed here)
```

**Why Synchronous?**
- Small document sizes (< 50KB after extraction)
- Low processing time (< 10s per document)
- Users expect immediate feedback
- Single file processing per request

---

## Part C: Training Data Challenges (Inference-Based ML System)

**Important Note**: QuickNotes does NOT train models. This section addresses how we handle data quality for LLM prompting and inference orchestration.

### C.1 Training Data Requirements (Proxy: Prompt Quality)

**Problem**: Without training, data quality is ensured through prompt engineering and prompt templates.

**Solution: Prompt-as-Data Framework**

```
Traditional ML          →  Prompt-Based ML (This System)
─────────────────────────────────────────────────────────
Training Data Quality   →  Prompt Template Quality
Model Fine-tuning       →  Instruction Engineering
Labeling               →  Instruction Design
Data Augmentation      →  Prompt Variation
```

**Prompt Quality Checklist**:

```markdown
✓ Specificity: Format defined in 7 distinct ways
✓ Constraints: Word count limits enforced
✓ Examples: Format structure shown in system message
✓ Instruction Clarity: "Use markdown", "Use headings"
✓ Context: User-provided document + format selection
✓ Temperature: Set to 0.3 for factual consistency
✓ Token Management: Max 2000 tokens to prevent hallucination
```

**Example Prompt Template** (Key Points Format):

```python
system_prompt = """You are an expert study assistant. Extract and organize 
KEY POINTS from study materials.

REQUIREMENTS:
- Use markdown formatting (# for headings, - for bullet points)
- Focus ONLY on the most important information
- Use clear headings (##) to organize sections
- Use bullet points (-) for key points
- Use **bold** for important terms
- Keep paragraphs short (max 2-3 sentences)
- Limit to EXACTLY {wordCount} words
- Structure: Main Topic → Key Points → Important Details
- Make it exam-friendly and readable"""

user_prompt = f"""Extract and organize KEY POINTS from this study material. 
Focus on the most important information only:

{extractedText}"""
```

### C.2 Sampling Techniques

**Challenge**: Documents vary widely in size (100 to 50,000+ characters).

**Solution: Intelligent Truncation and Chunking**

**Strategy 1: Length-Based Sampling**

```python
# File: app/api/upload/route.ts, line ~750

const maxTextLength = 50000  // 50KB limit
const textToProcess = combinedText.length > maxTextLength 
  ? combinedText.substring(0, maxTextLength) + 
    '\n\n[Content truncated due to size limits...]'
  : combinedText

// Handles:
// - Short docs (< 50KB): Use 100% of content
// - Medium docs (50-200KB): Use first 50KB
// - Large docs (> 200KB): Use first 50KB
```

**Strategy 2: Semantic Chunking**

```python
# File: app/api/upload/route.ts, line ~27

function chunkText(text, chunkSize = 1000, overlap = 200) {
  // Creates overlapping 1000-char chunks
  // Sliding window: 200-char overlap between chunks
  // Reason: Preserve context at chunk boundaries
  // Result: Multiple valid extraction points per document
}
```

**Strategy 3: Document Type Sampling**

```python
# Different extraction strategies per format:

PDF Files
├─ Use pdfjs-dist (main method)
├─ Fallback: pdf2json
└─ Fallback: pdf-parse
   (Ensures coverage even for unusual PDFs)

DOCX Files
├─ Use mammoth (standard)
├─ Preserve formatting
└─ Max extraction: Full document

PowerPoint Files
└─ Return placeholder (requires OCR/additional library)

TXT Files
└─ Direct text decode (UTF-8)
```

### C.3 Data Quality Issues and Mitigation

**Issue 1: Empty or Corrupt Documents**

```
Problem:        File is extracted but contains no readable text
Detection:      if (!extractedText || extractedText.trim().length === 0)
Response:       Skip file + log error + continue with others
Prevention:     Validate at upload time (mime type, size)
User Feedback:  "File appears to be empty or contains no extractable text"
```

**Issue 2: Hallucination in LLM Output**

```
Problem:        Model generates text not in source document
Control:        Set temperature = 0.3 (low = factual)
                Enforce max_tokens = 2000 (prevent rambling)
                Use specific format instructions
Validation:     Check word count matches user request (±10%)
Fallback:       Return first 1500 chars if generation fails
```

**Issue 3: Format Inconsistency**

```
Problem:        Output doesn't match selected format
Solution:       
  1. Use format-specific system prompts (7 variants)
  2. Include format examples in instructions
  3. Validate markdown structure before storage
  4. Log format violations for monitoring
```

**Issue 4: Language and Encoding Issues**

```
Problem:        Non-UTF8 documents, mixed encodings
Solution:       
  1. Use TextDecoder with 'utf-8' only
  2. Strip invalid characters during extraction
  3. Log encoding errors
  4. Suggest re-upload with proper encoding
```

### C.4 Handling Document Variability

**Challenge**: Documents range from 100 characters to 50+ MB.

**Solution Framework**:

```
Document Size    Processing         Output          Strategy
────────────────────────────────────────────────────────────
Tiny             Use full content   Full analysis   100% coverage
(< 5KB)          No truncation      High quality    

Small            Use full content   Full analysis   100% coverage
(5-50KB)         Small chunks       Good quality    

Medium           Use first 50KB     Partial         Truncation with
(50-200KB)       Overlap chunks     analysis        disclaimer

Large            Use first 50KB     Summary only    Focus on intro
(200KB+)         Top-focused        Medium quality  + conclusion

Huge             Use first 50KB     Extraction      Warn user
(> 10MB)         (Server limit)     may be limited  about truncation
```

### C.5 Data Labeling Strategy (Instruction-Based)

**Model**: Instruction-based output (no traditional labels needed).

```
Labeling Component   Implementation              Authority
──────────────────────────────────────────────────────────
Format Labels        7 hardcoded instructions    Product design
Word Count Labels    User input (50-500)         User control
Quality Labels       User feedback form          User feedback
Content Labels       Document metadata           File upload
User Labels          Auth token                  Supabase Auth
```

**Instruction Hierarchy**:

```
Level 1: System Prompt (Most Important)
├─ Defines role: "expert study assistant"
├─ Sets format constraints
├─ Specifies markdown structure
└─ Enforces word count

Level 2: User Prompt
├─ Includes actual document text
├─ Repeats format requirement
├─ Adds context

Level 3: Model Parameters
├─ Temperature: 0.3 (factual)
├─ Max tokens: 2000
└─ Top-p: Default (varied)
```

### C.6 Data Quality Monitoring

**Metrics Tracked**:

```python
# In server logs (structured JSON)

{
  "extraction_success_rate": 98.5,    # % of files successfully extracted
  "format_adherence_rate": 94.2,      # % of outputs matching format
  "word_count_accuracy": 97.1,        # % within ±10% of target
  "processing_latency_p99": 28500,    # milliseconds
  "api_error_rate": 1.2,              # % of OpenRouter failures
  "chunk_efficiency": 85,              # avg % of first chunk used
  "user_satisfaction_nps": 38,        # Net Promoter Score
}
```

**Alerting Rules**:

```
Metric                    Threshold   Action
──────────────────────────────────────────
Success Rate              < 95%       Page oncall
Format Adherence          < 90%       Review prompts
Latency (p99)             > 30s       Scale compute
API Error Rate            > 5%        Check quota
```

---

## Part D: System Architecture

### D.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React/Next.js Frontend                             │   │
│  │  - Upload UI                                         │   │
│  │  - Chat Interface                                    │   │
│  │  - Notes Viewer                                      │   │
│  │  - Format Selection (7 variants)                     │   │
│  └────────────────────┬─────────────────────────────────┘   │
└─────────────────────┼────────────────────────────────────────┘
                      │ HTTPS / WebSocket
┌─────────────────────┼────────────────────────────────────────┐
│                     ↓                                         │
│          API Gateway Layer (Vercel Edge)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Authentication Middleware                          │   │
│  │  - Verify JWT tokens (Supabase)                     │   │
│  │  - Rate limiting                                    │   │
│  │  - CORS handling                                    │   │
│  └────────────────────┬─────────────────────────────────┘   │
└─────────────────────┼────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
    /api/upload  /api/chat    /api/notes
        │             │             │
┌───────┴─────────────┴─────────────┴──────────────┐
│        Processing Layer (Node.js Serverless)     │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Upload Endpoint                         │   │
│  │  1. Extract text (PDF/DOCX/TXT)         │   │
│  │  2. Chunk content (1000 chars)          │   │
│  │  3. Call LLM API                        │   │
│  │  4. Store in Supabase                   │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Chat Endpoint                           │   │
│  │  1. Stream user message                 │   │
│  │  2. Query conversation history          │   │
│  │  3. Apply format (if selected)          │   │
│  │  4. Stream LLM response                 │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Prompt Engineering Module               │   │
│  │  - 7 format templates                   │   │
│  │  - Dynamic word count injection         │   │
│  │  - Temperature control (0.3)            │   │
│  └──────────────────────────────────────────┘   │
└───────┬──────────────┬──────────────┬────────────┘
        │              │              │
        ↓              ↓              ↓
┌──────────────┐ ┌─────────────┐ ┌──────────────┐
│  OpenRouter  │ │  Supabase   │ │  Supabase    │
│   API        │ │  PostgreSQL │ │  Storage     │
│              │ │  (Metadata) │ │  (Documents) │
│  LLM Calls   │ │             │ │              │
│  (Inference) │ │  Collections│ │  Uploads     │
│              │ │  Notes      │ │  Backups     │
└──────────────┘ │  Messages   │ └──────────────┘
                 │  Users      │
                 │  Feedback   │
                 └─────────────┘

                 Authentication
                 ┌──────────────────┐
                 │ Supabase Auth    │
                 │ - Google OAuth   │
                 │ - Email/Password │
                 │ - Session Mgmt   │
                 └──────────────────┘
```

### D.2 Data Flow for Core Operations

**Operation 1: Upload & Process Document**

```
User Action: Upload PDF → Select Format (Key Points) → Set Word Count (100)
                                    ↓
Step 1: POST /api/upload (multipart/form-data)
├─ File: myfile.pdf (5MB)
├─ Format: key-points
└─ WordCount: 100
                                    ↓
Step 2: Authentication Check
├─ Verify JWT from cookie
├─ Query Supabase Auth
└─ Get user_id
                                    ↓
Step 3: File Extraction
├─ Read file buffer
├─ Detect type: PDF
├─ Run pdfjs-dist
├─ Output: "Machine Learning is..."
└─ Size check: OK (< 50KB)
                                    ↓
Step 4: Chunking
├─ Split 50KB text into 1000-char chunks
├─ Add 200-char overlap
└─ Result: [chunk1, chunk2, ..., chunkN]
                                    ↓
Step 5: Prompt Construction
├─ Retrieve key-points template
├─ Inject wordCount = 100
├─ Inject userPrompt with text
└─ Final: [systemPrompt, userPrompt]
                                    ↓
Step 6: LLM API Call (OpenRouter)
├─ POST https://openrouter.ai/api/v1/chat/completions
├─ Model: deepseek/deepseek-r1-0528:free
├─ Messages: [system, user]
├─ Temperature: 0.3
├─ Max_tokens: 2000
└─ Response: "# Machine Learning\n## Key Points..."
                                    ↓
Step 7: Validation
├─ Parse markdown structure
├─ Count words
├─ Check ≈100 words
└─ Status: PASS
                                    ↓
Step 8: Storage
├─ Insert into collections table
├─ Insert into notes table
├─ Store metadata
└─ Return collection_id to client
                                    ↓
User Sees: "✓ Notes created successfully!"
├─ Button: View Notes
└─ Button: Download PDF
```

### D.3 ML Inference Pipeline Details

**Component: generateAINotes() Function**

```typescript
async function generateAINotes(
  text: string,                        // Extracted document text
  outputType: 'key-points' | ...,     // Format selector
  wordCount: number                    // Word limit
): Promise<string>

Process:
1. Validate: apiKey exists
2. Truncate: text to 8000 chars (token limit)
3. Template: Call generateFormatPrompt(outputType, wordCount)
   └─ Returns: { systemPrompt, userPromptPrefix }
4. Build: Final prompt with user text
5. Call: OpenRouter API with inference params
6. Parse: LLM response
7. Return: Markdown notes string
```

**Parameters Tuning**:

```python
# In generateAINotes() - optimized for study materials

temperature = 0.3          # Low: Focus on factual content, not creative
max_tokens = 2000          # High enough for detailed notes
top_p = 1.0                # Default: Diverse but coherent output
frequency_penalty = 0      # No penalty: Allow repetition of terms
presence_penalty = 0       # No penalty: Allow all token types
```

---

## Part E: Production Considerations

### E.1 Scalability

**Current Capacity**:
- ~500 MB/day data throughput
- ~100 concurrent users (Vercel limits)
- ~5 requests/second sustained

**Scaling Strategy**:
1. Horizontal: Deploy to multiple Vercel regions
2. Caching: Cache formatted prompts (no change per format)
3. Async: Move non-critical operations to background jobs (future)
4. Rate Limiting: 10 uploads/hour per user

### E.2 Cost Optimization

**Current Costs**:
- OpenRouter: FREE tier (deepseek-r1t2-chimera)
- Supabase: ~$25/month (starter tier)
- Vercel: ~$20/month (pro tier)

**Cost Per Operation**:
- Typical document processing: $0.00 (free model)
- Storage: ~$0.02 per 1GB
- Auth: Included in Supabase

### E.3 Error Handling and Resilience

**Error Categories**:

```
Category          Handling                    Recovery
──────────────────────────────────────────────────────
File Extraction   Log + Skip file + Continue  Try next file
API Timeout       Retry 3x with backoff       Return error
Storage Failure   Log error + notify admin    Manual review
Auth Failure      Return 401                  User re-login
```

**Resilience Patterns**:
1. Graceful degradation: Process what you can
2. Fallback chains: 3 PDF parsers available
3. Retry logic: Exponential backoff on API calls
4. Circuit breaker: Stop retries after 3 failures

---

## Part E.4: Feature Engineering, Evaluation Focus & Constraints

### Feature Engineering

| Aspect | Traditional ML | Inference Systems | Input Data | Feature Source |
|--------|---|---|---|---|
| **Numerical vectors** | Raw text + constraints | Raw text + constraints | Structured data | Manual engineering |
| **LLM semantic extraction** | Fixed features | Dynamic features | Unstructured data | LLM semantic extraction |

### Evaluation Focus

| Metric Type | Traditional ML | Inference Systems | Primary Metric | Secondary Metric |
|---|---|---|---|---|
| **Precision/recall** | Historical accuracy | Real-time accuracy | User experience | Loss metrics |
| **System performance** | Model inference speed | End-to-end latency | Response time | Resource usage |

### Constraints

| Limitation | Traditional ML | Inference Systems | Key Restrictions | Optimization Focus |
|---|---|---|---|---|
| **Hardware capacity** | GPU memory | Cloud API limits | Model accuracy | Cost-latency balance |
| **API/cloud policies** | Model serving | Rate limiting | Token limits | Model accuracy |

---

## Part F: ML System vs Traditional ML

**Why This is ML System Design (Not Just ML)**:

```
Traditional ML                  vs    ML System Design (This Project)
─────────────────────────────────────────────────────────────────
Focus: Model accuracy           Focus: End-to-end reliability
Data: Labeled dataset           Data: Prompt engineering
Training: Hours of GPU time     Training: None (inference only)
Evaluation: Precision/Recall    Evaluation: User satisfaction + latency
Deployment: Model serving       Deployment: API orchestration

This project excels at:
✓ System design: Document → Process → LLM → Storage → User
✓ Data pipelines: Multi-format extraction, chunking, sampling
✓ Integration: 3 extraction libraries, 1 LLM API, 1 database
✓ Orchestration: Conditional flows, error handling, fallbacks
✓ User experience: Format selection, word count control, feedback
```

---

## References and Implementation Details

**Key Files**:
- `app/api/upload/route.ts` - Document processing pipeline
- `app/api/chat/route.ts` - Inference and chat logic
- `app/components/FeedbackButton.tsx` - User feedback collection
- `app/lib/supabase.ts` - Database client

**External Systems**:
- OpenRouter API: https://openrouter.ai/docs
- Supabase Docs: https://supabase.com/docs
- pdfjs-dist: https://mozilla.github.io/pdf.js/
- Mammoth.js: https://github.com/mwilson/mammoth.js

---

## Conclusion

QuickNotes demonstrates production ML system design principles applied to a real SaaS platform. While it doesn't train models, it orchestrates complex data flows, optimizes inference through prompt engineering, and manages the full lifecycle from user upload to stored output.

**Key Takeaways**:
1. ML System Design ≠ Traditional ML (training)
2. Prompt engineering IS a data quality technique
3. System reliability requires multiple fallbacks
4. Cost optimization through architecture choices
5. User feedback loops enable continuous improvement

