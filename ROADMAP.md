# Roadmap

## Task Status Legend

- `[ ]` pending
- `[~]` in_progress
- `[x]` completed
- `[!]` failed

## Tasks

### Task 1: Project Scaffolding

**Status:** `[x]`
**Dependencies:** None
**Estimated:** 30min

**Description:**
Initialize pnpm monorepo with workspace configuration, Docker Compose skeleton, shared volume, and .env file.

**Acceptance Criteria:**
- `pnpm-workspace.yaml` configured with packages and services
- Root `package.json` with workspace scripts
- `docker-compose.yml` with 4 service stubs and shared volume
- `.env` file with all required environment variables
- `.gitignore` configured for node_modules, dist, .env
- `tsconfig.json` base configuration

**Files:**
- `pnpm-workspace.yaml`
- `package.json`
- `docker-compose.yml`
- `.env`
- `.gitignore`
- `tsconfig.base.json`

---

### Task 2: Postgres Container with pgvector

**Status:** `[x]`
**Dependencies:** Task 1
**Estimated:** 20min

**Description:**
Configure Postgres container with pgvector extension and database initialization scripts.

**Acceptance Criteria:**
- Postgres 16 container with pgvector extension
- Init script creates `cv_screener` database
- Init script enables pgvector extension
- Health check configured
- Volume for data persistence

**Files:**
- `docker-compose.yml` (postgres service)
- `infrastructure/postgres/init.sql`

---

### Task 3: Shared Types Package

**Status:** `[x]`
**Dependencies:** Task 1
**Estimated:** 30min

**Description:**
Create shared types package with CV entities, value objects, error types, and storage interface.

**Acceptance Criteria:**
- CV types: CV, Experience, Education, Skill
- Error types: AppError, error codes
- Base entity and value object classes
- StorageService interface
- Package builds successfully
- Exports from `@leadtech/shared`

**Files:**
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `packages/shared/src/types/cv.ts`
- `packages/shared/src/types/errors.ts`
- `packages/shared/src/domain/entity.ts`
- `packages/shared/src/domain/value-object.ts`
- `packages/shared/src/domain/storage/storage.service.ts`
- `packages/shared/src/index.ts`

---

### Task 4: CV Generator Domain Layer

**Status:** `[x]`
**Dependencies:** Task 3
**Estimated:** 20min

**Description:**
Define domain entities and types for the CV Generator service.

**Acceptance Criteria:**
- CvData entity (structured JSON representation)
- CvPdf entity (PDF file representation)
- Repository interface for CV storage
- Domain errors specific to generation

**Files:**
- `services/cv-generator/src/domain/cv/cv-data.entity.ts`
- `services/cv-generator/src/domain/cv/cv-pdf.entity.ts`
- `services/cv-generator/src/domain/cv/cv.repository.ts`
- `services/cv-generator/src/domain/cv/cv.types.ts`
- `services/cv-generator/src/domain/shared/app-error.ts`

---

### Task 5: CV Generator Infrastructure

**Status:** `[x]`
**Dependencies:** Tasks 3, 4
**Estimated:** 30min

**Description:**
Implement infrastructure layer: Gemini client, photo fetcher, PDF renderer, storage service.

**Acceptance Criteria:**
- Gemini client for text generation
- Photo fetcher using ThisPersonDoesNotExist API
- PDF renderer using PDFKit
- FileSystemStorage implementation
- All services properly typed

**Files:**
- `services/cv-generator/src/infrastructure/gemini/gemini.client.ts`
- `services/cv-generator/src/infrastructure/photo/photo-fetcher.service.ts`
- `services/cv-generator/src/infrastructure/pdf/pdf-renderer.service.ts`
- `services/cv-generator/src/infrastructure/storage/file-system.storage.ts`
- `services/cv-generator/src/infrastructure/database/postgres.ts`

---

### Task 6: CV Generator Application Layer

**Status:** `[x]`
**Dependencies:** Tasks 4, 5
**Estimated:** 30min

**Description:**
Implement application layer: generation use case and orchestration service.

**Acceptance Criteria:**
- GenerationUseCase orchestrates full pipeline
- CvGenerationService coordinates data gen → photo → PDF → store
- Proper error handling and logging
- Job status tracking

**Files:**
- `services/cv-generator/src/application/generation/cv-generation.service.ts`
- `services/cv-generator/src/application/generation/cv-generation.use-case.ts`

---

### Task 7: CV Generator Interfaces

**Status:** `[x]`
**Dependencies:** Task 6
**Estimated:** 20min

**Description:**
Implement HTTP interfaces: routes, controller, and error handling.

**Acceptance Criteria:**
- POST /generate endpoint
- GET /status endpoint
- Controller with proper request/response handling
- Error middleware
- Express app setup

**Files:**
- `services/cv-generator/src/interfaces/routes/generation.routes.ts`
- `services/cv-generator/src/interfaces/controllers/generation.controller.ts`
- `services/cv-generator/src/interfaces/middleware/error.middleware.ts`
- `services/cv-generator/src/index.ts`

---

### Task 8: CV Generator Dockerfile + Compose Integration

**Status:** `[x]`
**Dependencies:** Tasks 2, 7
**Estimated:** 20min

**Description:**
Create Dockerfile for CV Generator and integrate into Docker Compose.

**Acceptance Criteria:**
- Multi-stage Dockerfile (build + production)
- Docker Compose service configured
- Environment variables passed
- Volume mounted for PDF storage
- Service starts successfully

**Files:**
- `services/cv-generator/Dockerfile`
- `services/cv-generator/package.json`
- `services/cv-generator/tsconfig.json`
- `docker-compose.yml` (cv-generator service)

---

### Task 9: Backend Domain Layer

**Status:** `[x]`
**Dependencies:** Task 3
**Estimated:** 30min

**Description:**
Define domain entities and types for the Backend service.

**Acceptance Criteria:**
- Chat entities: Message, Conversation
- CV entities: CvEntity, CvEmbedding
- Repository interfaces for CV and embedding storage
- Chat and CV type definitions

**Files:**
- `services/backend/src/domain/chat/message.entity.ts`
- `services/backend/src/domain/chat/conversation.entity.ts`
- `services/backend/src/domain/chat/chat.types.ts`
- `services/backend/src/domain/cv/cv.entity.ts`
- `services/backend/src/domain/cv/cv-embedding.entity.ts`
- `services/backend/src/domain/cv/cv.repository.ts`
- `services/backend/src/domain/cv/cv.types.ts`
- `services/backend/src/domain/shared/app-error.ts`
- `services/backend/src/domain/shared/entity.ts`
- `services/backend/src/domain/shared/value-object.ts`

---

### Task 10: Backend Infrastructure

**Status:** `[x]`
**Dependencies:** Tasks 2, 9
**Estimated:** 30min

**Description:**
Implement infrastructure layer: database connections, repository implementations, Gemini client.

**Acceptance Criteria:**
- Postgres connection pool
- CV repository implementation
- Embedding repository implementation
- Gemini client for embedding and chat
- Proper error handling

**Files:**
- `services/backend/src/infrastructure/database/postgres.ts`
- `services/backend/src/infrastructure/database/cv.repository.impl.ts`
- `services/backend/src/infrastructure/database/embedding.repository.impl.ts`
- `services/backend/src/infrastructure/gemini/gemini.client.ts`
- `services/backend/src/infrastructure/gemini/gemini.config.ts`

---

### Task 11: Backend Application Layer

**Status:** `[x]`
**Dependencies:** Tasks 9, 10
**Estimated:** 30min

**Description:**
Implement application layer: chat service with RAG orchestration, CV ingestion service.

**Acceptance Criteria:**
- ChatService orchestrates: embed question → retrieve chunks → generate response
- CvIngestionService orchestrates: extract → chunk → embed → store
- Proper error propagation
- Request context handling

**Files:**
- `services/backend/src/application/chat/chat.service.ts`
- `services/backend/src/application/chat/chat.use-case.ts`
- `services/backend/src/application/cv/cv-ingestion.service.ts`
- `services/backend/src/application/cv/cv-ingestion.use-case.ts`

---

### Task 12: Backend Interfaces + Middleware

**Status:** `[x]`
**Dependencies:** Task 9
**Estimated:** 25min

**Description:**
Implement error middleware, request ID middleware, health endpoint, and Express app setup.

**Acceptance Criteria:**
- Error middleware catches all errors, formats to AppError
- Request ID middleware adds unique ID to each request
- Health endpoint returns service status
- CORS configured for frontend
- Express app properly configured

**Files:**
- `services/backend/src/interfaces/middleware/error.middleware.ts`
- `services/backend/src/interfaces/middleware/request-id.middleware.ts`
- `services/backend/src/interfaces/routes/health.routes.ts`
- `services/backend/src/index.ts`

---

### Task 13: Backend Chat Endpoint

**Status:** `[x]`
**Dependencies:** Tasks 11, 12
**Estimated:** 30min

**Description:**
Implement POST /api/chat endpoint with RAG retrieval and source citation.

**Acceptance Criteria:**
- Accepts `{ message: string }` body
- Returns `{ answer, sources, requestId }`
- Sources include CV name, role, relevance score
- Handles LLM errors gracefully
- Returns proper error responses

**Files:**
- `services/backend/src/interfaces/routes/chat.routes.ts`
- `services/backend/src/interfaces/controllers/chat.controller.ts`

---

### Task 14: Backend CV Endpoints

**Status:** `[x]`
**Dependencies:** Tasks 11, 12
**Estimated:** 25min

**Description:**
Implement CV metadata endpoints and generation proxy.

**Acceptance Criteria:**
- GET /api/cvs returns all CV metadata
- GET /api/cvs/:id returns single CV
- POST /api/cvs/generate proxies to CV Generator service
- Proper pagination support

**Files:**
- `services/backend/src/interfaces/routes/cv.routes.ts`
- `services/backend/src/interfaces/controllers/cv.controller.ts`

---

### Task 15: PDF Extraction + Ingestion Pipeline

**Status:** `[x]`
**Dependencies:** Tasks 10, 11
**Estimated:** 30min

**Description:**
Implement PDF text extraction, chunking, and embedding pipeline.

**Acceptance Criteria:**
- PDF extraction via pdf-parse
- Text chunking with overlap (512 tokens, 50 overlap)
- Embedding generation via Gemini
- Storage in pgvector
- Batch processing support

**Files:**
- `services/backend/src/infrastructure/pdf/pdf-extractor.service.ts`
- `services/backend/src/infrastructure/pdf/text-chunker.service.ts`

---

### Task 16: Frontend Next.js Setup

**Status:** `[x]`
**Dependencies:** Tasks 1, 12
**Estimated:** 45min

**Description:**
Initialize Next.js frontend with Tailwind CSS, /chat route, and chat UI components.

**Acceptance Criteria:**
- Next.js 14 with App Router
- Tailwind CSS configured
- /chat route with chat interface
- Message list component
- Input box component
- Loading states
- Error display

**Files:**
- `services/frontend/package.json`
- `services/frontend/next.config.js`
- `services/frontend/tailwind.config.js`
- `services/frontend/src/app/layout.tsx`
- `services/frontend/src/app/page.tsx`
- `services/frontend/src/app/chat/page.tsx`
- `services/frontend/src/components/chat/message-list.tsx`
- `services/frontend/src/components/chat/message-input.tsx`
- `services/frontend/src/components/chat/source-card.tsx`
- `services/frontend/Dockerfile`

---

### Task 17: Frontend-Backend Integration

**Status:** `[x]`
**Dependencies:** Tasks 13, 16
**Estimated:** 30min

**Description:**
Connect chat UI to backend API, handle responses and errors.

**Acceptance Criteria:**
- API client for backend communication
- Send messages and receive responses
- Display sources in chat
- Handle loading states
- Handle error states
- Message history in state

**Files:**
- `services/frontend/src/lib/api.ts`
- `services/frontend/src/hooks/use-chat.ts`
- Updates to chat components

---

### Task 18: Unit Tests

**Status:** `[x]`
**Dependencies:** Tasks 8, 14, 15
**Estimated:** 45min

**Description:**
Write unit tests for domain entities, services, and repositories.

**Acceptance Criteria:**
- Tests for domain entities (CV, Message, Embedding)
- Tests for application services (ChatService, CvGenerationService)
- Tests for infrastructure (repository implementations)
- All tests pass
- Vitest configured

**Files:**
- `services/backend/src/**/*.test.ts`
- `services/cv-generator/src/**/*.test.ts`
- `services/backend/vitest.config.ts`
- `services/cv-generator/vitest.config.ts`

---

### Task 19: Integration Tests

**Status:** `[x]`
**Dependencies:** Tasks 13, 14
**Estimated:** 30min

**Description:**
Write integration tests for API endpoints with test database.

**Acceptance Criteria:**
- Test database setup/teardown
- Chat endpoint integration tests
- CV endpoint integration tests
- Error handling tests
- All tests pass

**Files:**
- `services/backend/tests/integration/chat.test.ts`
- `services/backend/tests/integration/cv.test.ts`
- `services/backend/tests/helpers/setup.ts`

---

### Task 20: E2E Tests

**Status:** `[x]`
**Dependencies:** Tasks 17, 19
**Estimated:** 45min

**Description:**
Write E2E tests with Playwright for chat and CV generation flows.

**Acceptance Criteria:**
- Playwright configured
- Chat flow test: send question, receive answer with sources
- CV generation flow test: trigger generation, verify status
- Error handling test
- All tests pass

**Files:**
- `tests/e2e/chat.spec.ts`
- `tests/e2e/cv-generation.spec.ts`
- `playwright.config.ts`

---

### Task 21: Documentation CQRS Update

**Status:** `[x]`
**Dependencies:** None
**Estimated:** 15min

**Description:**
Update ARCHITECTURE.md, REQUIREMENTS.md, and ROADMAP.md to document the CQRS pattern already in the codebase.

**Acceptance Criteria:**
- ARCHITECTURE.md has CQRS section explaining read/write separation
- REQUIREMENTS.md decisions log includes CQRS
- ROADMAP.md includes tasks 21-26

**Files:**
- `ARCHITECTURE.md`
- `REQUIREMENTS.md`
- `ROADMAP.md`

---

### Task 22: CV Generator Name Diversity

**Status:** `[x]`
**Dependencies:** None
**Estimated:** 10min

**Description:**
Fix the Gemini prompt to generate diverse, culturally varied names instead of defaulting to common names like "Alex".

**Acceptance Criteria:**
- Prompt explicitly requests culturally diverse names
- Names span varied ethnic backgrounds
- No placeholder names like Alex, John, Jane

**Files:**
- `services/cv-generator/src/infrastructure/gemini/gemini.client.ts`

---

### Task 23: Frontend Centered Layout

**Status:** `[x]`
**Dependencies:** None
**Estimated:** 15min

**Description:**
Constrain the chat UI to a centered column with margins on left, right, and bottom instead of using the full screen width.

**Acceptance Criteria:**
- Chat content centered with max-width constraint
- Left/right margins of at least 24px
- Bottom padding for breathing room
- Responsive on different screen sizes

**Files:**
- `services/frontend/src/app/chat/page.tsx`

---

### Task 24: Markdown Rendering in Chat

**Status:** `[x]`
**Dependencies:** Task 23
**Estimated:** 20min

**Description:**
Render LLM markdown responses with proper formatting (bold, lists, code blocks, etc.) using react-markdown and Tailwind Typography.

**Acceptance Criteria:**
- react-markdown renders assistant messages
- Bold, italic, lists, code blocks styled via @tailwindcss/typography
- User messages remain plain text

**Files:**
- `services/frontend/package.json`
- `services/frontend/tailwind.config.js`
- `services/frontend/src/components/chat/message-list.tsx`

---

### Task 25: Backend PDF Endpoint + Source Card Redesign

**Status:** `[x]`
**Dependencies:** None
**Estimated:** 30min

**Description:**
Add GET /api/cvs/:id/pdf endpoint to serve CV PDFs, and redesign source cards to show Name (Role) with an Open CV button instead of relevance scores.

**Acceptance Criteria:**
- GET /api/cvs/:id/pdf serves PDF with correct Content-Type
- Source cards show "Name (Role)" format
- Relevance bar and percentage removed
- "Open CV" button on each source card
- Backend returns 404 for missing CVs or PDFs

**Files:**
- `services/backend/src/interfaces/controllers/cv.controller.ts`
- `services/backend/src/interfaces/routes/cv.routes.ts`
- `services/frontend/src/components/chat/source-card.tsx`
- `services/frontend/src/components/chat/message-list.tsx`
- `services/frontend/src/hooks/use-chat.ts`

---

### Task 26: PDF Viewer Slide-in Panel

**Status:** `[x]`
**Dependencies:** Tasks 23, 25
**Estimated:** 30min

**Description:**
Implement a slide-in panel from the right side that displays a candidate's CV PDF using an iframe.

**Acceptance Criteria:**
- Slide-in panel at 40% screen width from right
- Loads PDF via iframe from backend endpoint
- Close button and backdrop overlay
- Escape key closes panel
- Smooth CSS transition animation

**Files:**
- `services/frontend/src/components/cv-viewer/cv-viewer-panel.tsx`
- `services/frontend/src/components/cv-viewer/index.ts`
- `services/frontend/src/app/chat/page.tsx`
- `services/frontend/src/components/chat/message-list.tsx`
- `services/frontend/src/components/chat/source-card.tsx`

---

### Task 27: RAG Configuration via Env Vars

**Status:** `[x]`
**Dependencies:** None
**Estimated:** 15min

**Description:**
Make chunk size, chunk overlap, and number of sources (top-K) configurable via environment variables, defaulting to 512/50/3.

**Acceptance Criteria:**
- `CHUNK_SIZE`, `CHUNK_OVERLAP`, `TOP_K_SOURCES` added to `.env`
- `TextChunkerService` configured from env in `backend/src/index.ts`
- `ChatService` topK configured from env (default 3)
- Backend builds and all tests pass

**Files:**
- `.env`
- `services/backend/src/index.ts`

---

### Task 28: Gemini Embedding Retry with Backoff + Jitter

**Status:** `[x]`
**Dependencies:** None
**Estimated:** 20min

**Description:**
Add retry logic to Gemini embedding calls with exponential backoff + jitter when the API returns 429 or 5xx statuses.

**Acceptance Criteria:**
- `withRetry` helper wraps `embedContent` calls (single + batch)
- Retries on 429, 500, 502, 503, 504
- Exponential backoff with full jitter (250ms base, 8s cap)
- Non-retryable errors thrown immediately
- Configurable via constructor options

**Files:**
- `services/backend/src/infrastructure/gemini/gemini.client.ts`

---

### Task 29: Source Card Hover Tooltip with CV Details

**Status:** `[x]`
**Dependencies:** Task 25
**Estimated:** 30min

**Description:**
Add a hover tooltip on source card names showing candidate name, role, summary, and skills as chips, with copy-to-clipboard buttons for email and phone.

**Acceptance Criteria:**
- Radix UI Tooltip on source name hover
- Summary derived server-side from experience descriptions
- Skills rendered as chips
- Copy buttons for email and phone with feedback
- Skeleton loading placeholder while fetching

**Files:**
- `services/frontend/src/components/chat/cv-tooltip.tsx` (new)
- `services/frontend/src/components/chat/source-card.tsx`
- `services/frontend/src/lib/api.ts`
- `services/backend/src/interfaces/controllers/cv.controller.ts`
- `services/frontend/package.json`

---

### Task 30: Source Card Hover Tooltip Skeleton Loading

**Status:** `[x]`
**Dependencies:** Task 29
**Estimated:** 10min

**Description:**
Use react-loading-skeleton for the tooltip loading state while CV details are fetched on hover.

**Acceptance Criteria:**
- Skeleton blocks for name, role, summary lines, and skill chips
- Skeleton styling via react-loading-skeleton
- Clean fallback if the CV detail fetch fails

**Files:**
- `services/frontend/src/components/chat/cv-tooltip.tsx`
- `services/frontend/package.json`

---

### Task 31: Randomized CV Generation Data

**Status:** `[x]`
**Dependencies:** Task 22
**Estimated:** 20min

**Description:**
Make generated CVs more varied by strengthening the LLM prompt for diverse names, emails, phones, companies, universities, and skills, and randomizing role selection with an expanded role catalog.

**Acceptance Criteria:**
- Prompt instructs culturally diverse names and unique contact/company/school data
- Emails derived from names with varied providers, phones with varied country codes
- Role selection shuffled with 24 role options
- No placeholder names like Alex, John, Jane

**Files:**
- `services/cv-generator/src/infrastructure/gemini/gemini.client.ts`
- `services/cv-generator/src/application/generation/cv-generation.use-case.ts`

---

### Task 32: Professional Summary Paragraph

**Status:** `[x]`
**Dependencies:** Task 31
**Estimated:** 30min

**Description:**
Add a professional summary paragraph (3-4 sentences) to each generated CV, threaded through the full pipeline and rendered in the PDF and hover tooltip.

**Acceptance Criteria:**
- `summary` field added to CV generation data
- LLM prompt generates a 3-4 sentence summary paragraph
- PDF renders the professional summary section as a paragraph
- Summary persisted in Postgres and exposed via GET /api/cvs/:id
- Backend falls back to a derived summary for legacy rows

**Files:**
- `services/cv-generator/src/domain/cv/cv-data.entity.ts`
- `services/cv-generator/src/infrastructure/gemini/gemini.client.ts`
- `services/cv-generator/src/infrastructure/pdf/pdf-renderer.service.ts`
- `services/cv-generator/src/application/generation/cv-generation.service.ts`
- `services/cv-generator/src/application/generation/cv-generation.use-case.ts`
- `services/backend/src/domain/cv/cv.entity.ts`
- `services/backend/src/infrastructure/database/cv.repository.impl.ts`
- `services/backend/src/infrastructure/database/embedding.repository.impl.ts`
- `services/backend/src/interfaces/controllers/cv.controller.ts`
- `infrastructure/postgres/init.sql`

---

### Task 33: PDF Photo Top-Right Headshot

**Status:** `[x]`
**Dependencies:** Task 5
**Estimated:** 15min

**Description:**
Render the candidate photo as a circular headshot in the top-right corner of the generated PDF instead of the top-left.

**Acceptance Criteria:**
- Photo positioned at top-right of the A4 page
- Circular crop applied via PDFKit clipping
- Name/contact text constrained to remaining width so no overlap
- Renders correctly when photo is unavailable (falls back to layout without photo)

**Files:**
- `services/cv-generator/src/infrastructure/pdf/pdf-renderer.service.ts`

---

### Task 34: CQRS Split - Read Service (cv-service)

**Status:** `[x]`
**Dependencies:** None
**Estimated:** 60min

**Description:**
Create a standalone read-only `services/cv-service` (CQRS query side) that serves the frontend: `GET /api/cvs`, `GET /api/cvs/:id`, `GET /api/cvs/:id/pdf`, `POST /api/chat`, `GET /api/health`. Only SELECT / similarity-search against Postgres; no write endpoints. Port 4002.

**Acceptance Criteria:**
- Package `@leadtech/cv-service` with build/test/start scripts
- `CvQueryService`, `ChatService`, `GeminiClient`, read-only repo impls (`findById`, `findAll`, `searchSimilar`)
- No write endpoints exposed (no `/generate`, no `/index`)
- Unit + integration tests pass

**Files:**
- `services/cv-service/**` (full package)

---

### Task 35: CQRS Split - Write Service (cv-ingestion-service)

**Status:** `[x]`
**Dependencies:** None
**Estimated:** 60min

**Description:**
Create a standalone write `services/cv-ingestion-service` (CQRS command side) used by the cv-generator: `POST /api/cvs/index` (save CV + chunk + embed + upsert) and `GET /api/health`. No read endpoints. Port 4003.

**Acceptance Criteria:**
- Package `@leadtech/cv-ingestion-service` with build/test/start scripts
- `CvIngestionService`, `CvIngestionUseCase`, `TextChunkerService`, `GeminiClient`, write-only repo impls (`save`, `saveBatch`)
- No read endpoints exposed
- Unit + integration tests pass

**Files:**
- `services/cv-ingestion-service/**` (full package)

---

### Task 36: CQRS Split - cv-generator + e2e Re-point

**Status:** `[x]`
**Dependencies:** Tasks 34, 35
**Estimated:** 15min

**Description:**
Point the cv-generator's indexing push to the new write service via `CV_INGESTION_URL` and update the e2e spec to hit the cv-generator natively.

**Acceptance Criteria:**
- cv-generator notifies `cv-ingestion-service` (`/api/cvs/index`) using `CV_INGESTION_URL` env (fallback `http://cv-ingestion-service:4003`)
- e2e `tests/e2e/cv-generation.spec.ts` targets `http://localhost:4001/api/cv/generate` natively
- No `BACKEND_URL` / `localhost:4000` references remain in cv-generator or e2e

**Files:**
- `services/cv-generator/src/application/generation/cv-generation.use-case.ts`
- `tests/e2e/cv-generation.spec.ts`

---

### Task 37: CQRS Split - Frontend Re-point

**Status:** `[x]`
**Dependencies:** Task 34
**Estimated:** 10min

**Description:**
Point the frontend at the new read service: rename env to `NEXT_PUBLIC_CV_SERVICE_URL` (default `http://localhost:4002`) and update API helpers and iframe source.

**Acceptance Criteria:**
- `src/lib/api.ts` and `cv-viewer-panel.tsx` use `CV_SERVICE_URL` from `NEXT_PUBLIC_CV_SERVICE_URL`
- No `NEXT_PUBLIC_BACKEND_URL` / `localhost:4000` references remain in frontend

**Files:**
- `services/frontend/src/lib/api.ts`
- `services/frontend/src/components/cv-viewer/cv-viewer-panel.tsx`

---

### Task 38: CQRS Split - Compose, Env, Scripts, Cleanup, Docs

**Status:** `[x]`
**Dependencies:** Tasks 34, 35, 36, 37
**Estimated:** 45min

**Description:**
Replace the `backend` container with `cv-service` and `cv-ingestion-service` in docker-compose, update env/scripts, remove `services/backend`, and refresh docs.

**Acceptance Criteria:**
- docker-compose runs 5 containers: postgres, cv-service, cv-ingestion-service, cv-generator, frontend
- cv-generator pushes to `cv-ingestion-service`; frontend reads from `cv-service`
- `services/backend` removed; root `dev:*` scripts updated
- ARCHITECTURE.md, REQUIREMENTS.md, AGENTS.md updated; no stale backend references in docs

**Files:**
- `docker-compose.yml`
- `.env`
- `package.json`
- `services/backend/**` (deleted)
- `ARCHITECTURE.md`
- `REQUIREMENTS.md`
- `AGENTS.md`

---

## Critical Path

```
1 → 3 → 4 → 5 → 6 → 7 → 8 → 15 → 11 → 13 → 17 → 20 → 26
```

## Parallel Opportunities

- Tasks 1, 2, 3 can start immediately
- Tasks 4, 9 can run in parallel (different services)
- Tasks 5, 10 can run in parallel
- Tasks 16 can run while backend tasks complete
- Tasks 18, 19, 20 can run after their dependencies
- Tasks 21, 22, 23, 25 can all run in parallel (no dependencies)
- Task 24 waits on 23, Task 26 waits on 23 + 25
- Tasks 27, 28 can run in parallel (independent backend changes)
- Tasks 31, 33 can run after Task 22/25; Task 32 depends on 31
- Tasks 34, 35 can run in parallel (new standalone services)
- Tasks 36, 37 can run in parallel after 34/35
- Task 38 waits on 34-37
