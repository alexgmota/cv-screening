# Requirements

## Functional Requirements

### CV Generation Pipeline

- Generate 25-30 unique, realistic-looking fake CVs in PDF format
- Each CV contains: name, contact info, professional summary paragraph, photo, work experience, skills, education
- Roles span multiple domains: Software Engineer, Data Scientist, Product Manager, DevOps, Designer, Marketing, Finance, HR, etc.
- Generation uses randomized role selection (shuffled, expanded role catalog) to avoid repetitive datasets
- LLM instructed to produce culturally diverse names, unique emails/phones/companies/universities, and non-overlapping skill sets
- All text content generated in English
- Each CV includes a 3-4 sentence professional summary paragraph
- AI-generated photos via RandomUser API (gender-matched portraits)
- Photos rendered as circular headshots in the top-right of the PDF
- PDFs rendered server-side via PDFKit
- Structured data (JSON) generated via Google Gemini before PDF rendering
- PDFs stored on filesystem with storage abstraction for future migration

### RAG Pipeline

- Ingestion begins with a PDF path reference (`{ pdfPath }`) posted to the cv-ingestion-service
- Ingestor reads the PDF from the shared volume (`{DATA_VOLUME_PATH}/{pdfPath}`) and parses it with pdf-parse to extract plain text
- Gemini extracts structured CV metadata from the parsed text as JSON (name, email, phone, role, summary, skills, education, experience)
- Split extracted text into overlapping chunks for embedding
- Generate vector embeddings via Google Gemini embedding model
- Store embeddings in pgvector (Postgres extension)
- Perform similarity search to retrieve relevant CV chunks for user queries
- Join chunk results with CV metadata for source attribution

### Chat Interface

- Dedicated `/chat` route in frontend
- Text input for user questions
- Display area for LLM responses (markdown rendered via react-markdown + Tailwind Typography)
- Show source CVs used in each response (name + role, no relevance bar)
- "Open CV" button opens slide-in PDF viewer panel (40% screen width)
- Hover tooltip on source names showing name, role, summary, skills chips
- Copy-to-clipboard buttons for email and phone in the hover tooltip
- Skeleton loading state while tooltip fetches candidate details
- Loading states during RAG processing
- Graceful error handling when RAG or LLM fails

### CV Database Table

- Dedicated `/cvs` route in frontend
- Table columns: Name, Role, Phone (with copy-to-clipboard button), Email (with copy-to-clipboard button), Skills (rendered as chips), Open CV button
- Text input to search candidates by name or role
- Pagination with page size of 10
- "Open CV" opens the existing slide-in PDF viewer panel
- Shared header navigation between the Chat and CV Database views

### RAG Configuration

- Chunk size, chunk overlap, and number of sources (top-K) configurable via environment variables:
  - `CHUNK_SIZE` (default 512)
  - `CHUNK_OVERLAP` (default 50)
  - `TOP_K_SOURCES` (default 3)
- Gemini embedding calls retried with exponential backoff + jitter on 429/500/502/503/504

### API Endpoints

Read side - `cv-service` (port 4002):

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send question, get RAG response with sources |
| GET | `/api/cvs` | List all CVs (metadata) with database-level pagination + search by name/role via `search`, `page`, `limit` params |
| GET | `/api/cvs/:id` | Get single CV details |
| GET | `/api/cvs/:id/pdf` | Stream generated CV PDF |
| GET | `/api/health` | Health check |

Write side - `cv-ingestion-service` (port 4003):

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cvs/index` | Ingest a generated CV from a PDF reference (read PDF, extract text + metadata via Gemini, embed) |
| GET | `/api/health` | Health check |

Producer - `cv-generator` (port 4001):

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cv/generate` | Trigger CV generation pipeline |
| GET | `/api/status/:jobId` | Get generation job status |

## Non-Functional Requirements

### Containerization

- All services run in Docker containers
- Docker Compose for local orchestration
- 5 containers: frontend, cv-service, cv-ingestion-service, cv-generator, postgres
- Shared Docker volume for PDF storage
- .env file for all secrets and configuration

### Code Quality

- TypeScript for all backend services
- Domain-Driven Design (DDD) for backend and cv-generator
- Minimal comments: JSDoc on public classes and methods only
- No inline comments on implementation logic
- pnpm monorepo with shared types package

### Testing

- Unit tests via Vitest for domain entities, services, repositories
- Integration tests via Vitest for API endpoints with test database
- E2E tests via Playwright for chat and CV generation flows
- Smoke tests: build validation for each service

### Error Handling

- Standard error model via backend middleware
- Error codes: CV_GENERATION_FAILED, LLM_UNAVAILABLE, VALIDATION_ERROR, NOT_FOUND
- LLM failures return application-level errors, not raw exceptions
- Request ID tracking for debugging

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| LLM Provider | Google Gemini (gemini-1.5-flash) | Free tier, good quality, matches embedding model |
| Vector Store | pgvector (Postgres 16) | Relational metadata + vector search in one DB |
| PDF Generation | PDFKit | Server-side, no browser dependency |
| PDF Extraction | pdf-parse | Pure Node.js, lightweight, reliable |
| Photo Generation | RandomUser API | Free, instant, gender-matched portraits |
| Frontend | Next.js 14 + Tailwind CSS | Modern React, utility-first CSS |
| Backend Framework | Express.js + TypeScript | Flexible, well-supported |
| State Management | React useState/useReducer | Sufficient for chat app scope |
| Testing | Vitest (unit/integration) + Playwright (E2E) | Fast, modern, great DX |
| Package Manager | pnpm | Fast, disk-efficient, workspace support |
| Storage | Filesystem with abstraction layer | Simple for prototype, swappable |
| Architecture | CQRS (Command Query Responsibility Segregation) | Separates read/write concerns; query service for reads, use cases for writes |
| Tooltip | Radix UI Tooltip + react-loading-skeleton | Accessible tooltips with polished skeleton loading |
| LLM Resilience | Exponential backoff + jitter on embedding retries | Handles rate limits (429) and transient server errors (5xx) |
| Data retrieval | Database-level pagination + search on GET /api/cvs | Scales cleanly on the read side and keeps the frontend thin; search via parameterized ILIKE on name/role |
| Metadata extraction | Gemini extracts CV metadata from parsed PDF text on the ingestion side | The generator→ingestor contract shrinks to a single pdfPath reference; metadata schema duplicated locally rather than a shared package |

## Constraints

- 25-30 CVs only (small dataset, no scaling concerns)
- Local-only deployment (no cloud hosting)
- Free-tier LLM usage (rate limits apply)
- Prototype scope: working product, not production-ready
