---
description: Repository Information Overview
alwaysApply: true
---

# QuickNotes Information

## Summary
**QuickNotes** is a production-grade AI-powered study assistant SaaS. It transforms educational documents (PDF, DOCX, TXT) into personalized, structured study materials such as exam-focused summaries, concept definitions, and presentation-ready notes. The system utilizes OpenRouter for LLM inference and Supabase for authentication, database, and storage.

## Structure
The project follows the **Next.js App Router** architecture:
- **`app/`**: Contains all frontend pages, components, and backend API routes.
  - **`api/`**: Serverless functions for document processing, AI chat, and note generation.
  - **`components/`**: Reusable UI components.
  - **`chat/`**, **`upload/`**, **`dashboard/`**: Main application modules.
- **`docs/`**: Technical documentation including ML system design.
- **`public/`**: Static assets like logos and icons.
- **`logoss/`**: Additional brand assets.

## Language & Runtime
**Language**: TypeScript  
**Version**: Node.js 18+, Next.js 16.1.1, React 19.2.3  
**Build System**: Next.js (Webpack/Turbo)  
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- **Framework**: `next`, `react`, `react-dom`
- **AI/LLM**: `OpenRouter API` (Inference), `deepseek-r1-t2-chimera` (Free model)
- **Backend/BaaS**: `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`, `@supabase/ssr`
- **Document Parsing**: `pdfjs-dist`, `mammoth`, `pdf-parse`, `pdf2json`
- **Export/PDF**: `jspdf`, `puppeteer`
- **UI/Icons**: `lucide-react`, `tailwindcss`
- **Analytics**: `@vercel/analytics`, `@vercel/speed-insights`

**Development Dependencies**:
- **Testing**: `jest`, `ts-jest`, `@types/jest`
- **Linting**: `eslint`, `eslint-config-next`
- **Styling**: `tailwindcss`, `@tailwindcss/postcss`, `postcss`
- **Compiler**: `babel-plugin-react-compiler`

## Build & Installation
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm build

# Start production server
npm start
```

## Testing
**Framework**: Jest with `ts-jest`  
**Test Location**: `**/__tests__/**/*.ts(x)` or `**/*.test.ts(x)`  
**Naming Convention**: `*.test.ts`, `*.test.tsx`  
**Configuration**: `jest.config.js`

**Run Command**:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Main Files & Resources
- **Frontend Entry**: `app/page.tsx`
- **API Endpoints**:
  - `app/api/upload/route.ts`: Document processing and text extraction.
  - `app/api/chat/route.ts`: LLM-powered chat orchestration.
  - `app/api/notes/generate/route.ts`: AI study note generation.
- **Configuration**:
  - `next.config.ts`: Next.js configuration.
  - `tsconfig.json`: TypeScript configuration.
  - `COMPLETE_DATABASE_SETUP.sql`: PostgreSQL/Supabase schema.
  - `.env.local`: Environment variables (see `ENV_SETUP.md`).
- **Documentation**:
  - `README.md`: Project overview and quick start.
  - `COMPREHENSIVE_PROJECT_GUIDE.md`: Deep dive into architecture and features.
  - `docs/ML-SYSTEM-DESIGN.md`: Machine Learning system design details.
