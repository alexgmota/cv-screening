# Architecture

## System Overview

AI-powered CV screening tool with RAG pipeline. Users ask questions about a collection of generated CVs and receive grounded answers with source attribution.

## CQRS Pattern

The system uses Command Query Responsibility Segregation (CQRS) split at the service level, so reads and writes live in separate deployable services:

**Read Side (Query) - `cv-service` (port 4002):**
- Serves the frontend: `GET /api/cvs`, `GET /api/cvs/:id`, `GET /api/cvs/:id/pdf`, `POST /api/chat`
- `CvQueryService` handles all read operations: `findById`, `findAll`, `searchSimilar`
- Optimized for fast retrieval with pgvector similarity search
- Contains no write endpoints or save paths

**Write Side (Command) - `cv-ingestion-service` (port 4003):**
- Consumed by the cv-generator: `POST /api/cvs/index` — receives a PDF path reference only (`{ pdfPath }`), reads the PDF from the shared volume (`/data/cvs`), extracts text with `pdf-parse`, and uses Google Gemini to extract structured CV metadata (name, email, phone, role, summary, skills, education, experience) before persisting
- `CvIngestionUseCase` → `CvIngestionService`: handles PDF read → text extraction → Gemini metadata extraction → save → chunk → embed → store
- Contains no read endpoints

**Generation (producer) - `cv-generator` (port 4001):**
- `GenerationUseCase` → `CvGenerationService`: creates CVs (generate data → fetch photo → render PDF → store → notify write service)

**Separation Benefits:**
- Independent scaling and deployment of read vs write paths
- Clear boundaries: ingestion is a command, search/chat are queries
- Frontend never touches the write side; cv-generator never reads via HTTP

## System Topology

```
┌───────────────────────────────────────────────────────────────────────┐
│                         Docker Compose                                 │
│                                                                       │
│   ┌─────────────┐       ┌──────────────────┐                          │
│   │  Frontend   │reads  │   cv-service     │  (CQRS read)             │
│   │ Next.js 14  │──────▶│  Express + RAG   │                          │
│   │  Port: 3000 │       │  Port: 4002      │                          │
│   └─────────────┘       └────────┬─────────┘                          │
│                           │       │                                   │
│                           │       ▼                                   │
│                           │  ┌────────────────────┐                   │
│   ┌─────────────┐ write   │  │      Postgres      │                   │
│   │  cv-generator│────────┼─▶│   + pgvector       │                   │
│   │  Port: 4001  │        │  │    Port: 5432      │                   │
│   │ POST /cv/generate│      │   Port: 5432      │
│   └──────┬──────┘         │        ▲                                  │
│          │                │        │                                  │
│          └──────────────┐ │        │                                  │
│                   ┌─────┴─┴────────┴──┐  (CQRS write)                │
│                   │ cv-ingestion-service│                             │
│                   │      Port: 4003     │  POST /api/cvs/index        │
│                   └─────────┬──────────┘                              │
│                             │                                         │
│  ┌────────────────────┐     │  Shared volume: /data/cvs               │
│  │ Shared volume       ◀────┘  (PDFs/photos written by cv-generator,  │
│  │ /data/cvs           │         served by cv-service)                │
│  └────────────────────┘                                               │
│                                                                       │
│  External: Google Gemini (LLM + embeddings), RandomUser (portraits)     │
└───────────────────────────────────────────────────────────────────────┘
```

## Service Responsibilities

| Service | Port | Responsibility |
|---------|------|----------------|
| Frontend | 3000 | Next.js SPA with /chat and /cvs routes, shared header nav, Tailwind UI |
| cv-service | 4002 | CQRS read: Chat API (RAG), CV metadata + PDF endpoints |
| cv-ingestion-service | 4003 | CQRS write: CV ingestion (save, chunk, embed) |
| CV Generator | 4001 | CV data generation, photo fetch, PDF rendering, ingestion push |
| Postgres | 5432 | CV metadata storage, pgvector embeddings |

## API Design

### cv-service (read) - port 4002

#### POST /api/chat

**Request:**
```json
{
  "message": "Who has experience with Python?"
}
```

**Response:**
```json
{
  "answer": "Based on the CVs, three candidates have Python experience...",
  "sources": [
    {
      "cv_id": "uuid-1",
      "name": "Jane Doe",
      "role": "Data Scientist",
      "relevance": 0.92
    }
  ],
  "requestId": "req-uuid"
}
```

**Error Response:**
```json
{
  "status": "error",
  "code": "LLM_UNAVAILABLE",
  "message": "Unable to process request at this time",
  "timestamp": "2024-01-01T00:00:00Z",
  "requestId": "req-uuid"
}
```

#### GET /api/cvs

Lists CV metadata with database-level pagination and search.

**Query Params:**
- `search` - optional, case-insensitive (ILIKE) match against `name` or `role`
- `page` - optional, defaults to `1`
- `limit` - optional, defaults to `20`, max `100`

Pagination and search are performed in the database (Postgres).

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+1-555-0100",
      "role": "Data Scientist",
      "skills": ["Python", "Machine Learning", "SQL"],
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 30,
    "totalPages": 2
  }
}
```

#### GET /api/cvs/:id

Returns full CV details (metadata + summary + experience/education) for the tooltip viewer.

#### GET /api/cvs/:id/pdf

Streams the generated PDF for the CV from the shared `/data/cvs` volume.

#### GET /api/health

Health check returning `{ status, service: 'cv-service', uptime, timestamp }`.

### cv-ingestion-service (write) - port 4003

#### POST /api/cvs/index

**Request (sent by cv-generator):**
```json
{
  "pdfPath": "cvs/uuid.pdf"
}
```

The `pdfPath` is relative to the shared storage volume; the full file is at `{DATA_VOLUME_PATH}/{pdfPath}` (e.g. `/data/cvs/cvs/uuid.pdf`). The ingestion flow:

1. Read the PDF from the shared volume via `FileSystemStorage`
2. Extract plain text from the PDF with `pdf-parse`
3. Send the extracted text to Google Gemini with a prompt to produce structured CV metadata as JSON (`name`, `email`, `phone`, `role`, `summary`, `skills[]`, `education[]`, `experience[]`). The metadata schema is duplicated locally in the ingestor (`cv-metadata-extractor.ts`) — there is no shared metadata package between the services.
4. Build a `CvEntity` (with `pdfPath` = the incoming reference; `photoPath` left unset because the portrait lives inside the PDF) and persist via the existing UnitOfWork transaction: save CV → chunk text → embed chunks → upsert embeddings.

**Response:**
```json
{ "data": { "id": "uuid", "status": "indexed" } }
```

#### GET /api/health

Health check returning `{ status, service: 'cv-ingestion-service', uptime, timestamp }`.

### cv-generator (producer) - port 4001

#### POST /api/cv/generate

**Request:**
```json
{
  "count": 30
}
```

**Response:**
```json
{
  "status": "accepted",
  "jobId": "job-uuid",
  "message": "CV generation started"
}
```

#### GET /api/status/:jobId

Returns the current status of a previously accepted generation job.

## Domain-Driven Design Structure

### cv-service - read (CQRS query side)

```
┌── services/cv-service/src/
├── domain/                          # Core business logic
│   ├── chat/
│   │   ├── message.entity.ts        # Message value object
│   │   ├── conversation.entity.ts   # Conversation aggregate
│   │   └── chat.types.ts
│   ├── cv/
│   │   ├── cv.entity.ts             # CV entity
│   │   ├── cv-embedding.entity.ts   # Embedding value object
│   │   ├── cv.repository.ts         # Read-only repository interface
│   │   └── cv.types.ts
│   └── shared/
│       ├── app-error.ts             # Domain error types
│       ├── value-object.ts          # Base value object
│       └── entity.ts                # Base entity
│
├── application/
│   ├── chat/
│   │   ├── chat.service.ts          # Orchestrates RAG + Gemini
│   │   └── chat.use-case.ts
│   └── cv/
│       └── cv-query.service.ts      # Read-side: findById, findAll, searchSimilar
│
├── infrastructure/
│   ├── database/
│   │   ├── postgres.ts              # Connection pool
│   │   ├── cv.repository.impl.ts    # SELECT findById/findAll
│   │   └── embedding.repository.impl.ts  # pgvector searchSimilar
│   └── gemini/
│       ├── gemini.client.ts
│       └── gemini.config.ts
│
├── interfaces/
│   ├── middleware/
│   │   ├── error.middleware.ts
│   │   └── request-id.middleware.ts
│   ├── routes/
│   │   ├── health.routes.ts
│   │   ├── chat.routes.ts
│   │   └── cv.routes.ts             # GET only
│   └── controllers/
│       ├── chat.controller.ts
│       └── cv.controller.ts
│
└── index.ts
```

### cv-ingestion-service - write (CQRS command side)

```
┌── services/cv-ingestion-service/src/
├── domain/
│   ├── cv/
│   │   ├── cv.entity.ts             # CV entity
│   │   ├── cv-embedding.entity.ts   # Embedding value object
│   │   ├── cv.repository.ts         # Write-only repository interface
│   │   └── cv.types.ts
│   └── shared/
│       ├── app-error.ts
│       ├── value-object.ts
│       └── entity.ts
│
├── application/
│   └── cv/
│       ├── cv-ingestion.service.ts  # Save → chunk → embed (write)
│       └── cv-ingestion.use-case.ts
│
├── infrastructure/
│   ├── database/
│   │   ├── postgres.ts              # Connection pool
│   │   ├── cv.repository.impl.ts    # INSERT/upsert save
│   │   └── embedding.repository.impl.ts  # INSERT save/saveBatch
│   ├── gemini/
│   │   ├── gemini.client.ts
│   │   └── gemini.config.ts
│   └── pdf/
│       └── text-chunker.service.ts
│
├── interfaces/
│   ├── middleware/
│   ├── routes/
│   │   ├── health.routes.ts
│   │   └── cv.routes.ts             # POST /cvs/index only
│   └── controllers/
│       └── cv.controller.ts
│
└── index.ts
```

### CV Generator (`services/cv-generator/src/`)

```
├── domain/
│   ├── cv/
│   │   ├── cv-data.entity.ts        # Generated CV data
│   │   ├── cv-pdf.entity.ts         # PDF representation
│   │   └── cv.types.ts
│   └── shared/
│       └── app-error.ts
│
├── application/
│   └── generation/
│       ├── cv-generation.service.ts
│       └── cv-generation.use-case.ts
│
├── infrastructure/
│   ├── gemini/
│   │   └── gemini.client.ts
│   ├── photo/
│   │   └── photo-fetcher.service.ts
│   ├── pdf/
│   │   └── pdf-renderer.service.ts
│   ├── storage/
│   │   └── file-system.storage.ts
│   └── database/
│       ├── postgres.ts
│       └── cv.repository.impl.ts
│
├── interfaces/
│   ├── routes/
│   │   └── generation.routes.ts
│   └── controllers/
│       └── generation.controller.ts
│
└── index.ts
```

## Data Flow

### CV Generation

```
1. POST /api/cv/generate on cv-generator (count: 30)
2. CV Generator receives request
3. For each CV:
   a. Gemini generates structured JSON (name, role, skills, experience, education, summary)
   b. RandomUser fetches a gender-matched portrait
   c. PDFKit renders PDF from JSON + photo
   d. StorageService saves PDF/photo to shared volume
    e. cv-generator notifies cv-ingestion-service with pdfPath reference only
4. cv-ingestion-service reads PDF from shared volume, extracts text with pdf-parse, uses Gemini to extract CV metadata, then saves metadata + chunks + embeddings
5. Return job status
```

### CQRS Read/Write Split

```
Write path: cv-generator → POST /api/cvs/index (cv-ingestion-service) → save → chunk → embed → store
Read path:  cv-service POST /api/chat → embed question → searchSimilar → generate response
Read path:  cv-service GET /api/cvs/:id/pdf → stream from shared volume
```

### RAG Ingestion (per CV)

```
1. cv-ingestion-service receives PDF path reference via POST /api/cvs/index
2. Reads PDF from shared volume /data/cvs, extracts text with pdf-parse
3. Gemini extracts structured CV metadata (name, email, phone, role, summary, skills, education, experience)
4. Text split into overlapping chunks (512 tokens, 50 overlap)
5. Each chunk embedded via Gemini embedding model
6. Embeddings stored in pgvector with CV metadata
7. Index updated for similarity search
```

### Chat

```
1. POST /api/chat { message: "Who has Python experience?" }
2. cv-service embeds question via Gemini
3. pgvector similarity search (top 5 chunks)
4. Chunks joined with CV metadata
5. Gemini generates grounded response with sources
6. Return { answer, sources }
```

## Storage Abstraction

```typescript
/** Interface for blob storage operations */
export interface StorageService {
  /** Save data and return storage key */
  save(key: string, data: Buffer): Promise<string>;
  /** Retrieve data by key */
  get(key: string): Promise<Buffer>;
  /** Check if key exists */
  exists(key: string): Promise<boolean>;
  /** Delete data by key */
  delete(key: string): Promise<void>;
}
```

**Implementations:**
- `FileSystemStorage`: Local filesystem (default)
- Future: `S3Storage`, `MinIOStorage`

**Shared volume:** The `cv-ingestion-service` also reads from the `shared_cvs:/data/cvs` volume (shared with cv-generator and cv-service), using the `DATA_VOLUME_PATH` env (default `/data/cvs`) to resolve the incoming `pdfPath` reference.

## Error Model

```typescript
interface AppError {
  status: 'error';
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
  requestId?: string;
}
```

**Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid request payload |
| NOT_FOUND | 404 | Resource not found |
| CV_GENERATION_FAILED | 500 | Error during CV generation |
| LLM_UNAVAILABLE | 503 | Gemini API error |
| EMBEDDING_FAILED | 500 | Error generating embeddings |
| STORAGE_ERROR | 500 | File system error |

## Database Schema

```sql
CREATE TABLE cvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL,
  photo_path TEXT,
  pdf_path TEXT,
  skills TEXT[],
  education JSONB,
  experience JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cv_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id UUID REFERENCES cvs(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(768),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON cv_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);
```

## Monorepo Structure

```
leadtech-cv-screening/
├── packages/
│   └── shared/                    # Shared types, value objects, errors
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── types/
│           │   ├── cv.ts
│           │   └── errors.ts
│           └── domain/
│               ├── entity.ts
│               ├── value-object.ts
│               └── storage/
│                   └── storage.service.ts
├── services/
│   ├── frontend/                  # Next.js 14 + Tailwind
│   │   ├── src/app/chat/page.tsx
│   │   └── Dockerfile
│   ├── cv-service/                # CQRS read: Express.js + DDD
│   │   ├── src/
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── interfaces/
│   │   └── Dockerfile
│   ├── cv-ingestion-service/      # CQRS write: Express.js + DDD
│   │   ├── src/
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── interfaces/
│   │   └── Dockerfile
│   └── cv-generator/              # Express.js + DDD
│       ├── src/
│       │   ├── domain/
│       │   ├── application/
│       │   ├── infrastructure/
│       │   └── interfaces/
│       └── Dockerfile
├── docker-compose.yml
├── pnpm-workspace.yaml
├── .env
└── package.json
```
