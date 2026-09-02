# Current Task: CV Database Table + Paginated Search Endpoint

**Started:** 2026-09-02T00:00:00Z
**Status:** completed
**Service:** shared

## Plan

### Exploration
- Mapped cv-service read side: `CvQueryService` (findById/findAll/searchSimilar), `GET /api/cvs` controller doing in-memory pagination via `findAll`.
- Confirmed `findAll` is only used by `GET /api/cvs` (ChatService uses `searchSimilar`), so it could be enhanced safely.
- Mapped frontend patterns: `/chat` client page, `CvViewerPanel` slide-in viewer, copy-to-clipboard pattern in `cv-tooltip.tsx`, API client in `src/lib/api.ts`.

### Implementation Steps
- [x] Backend: DB-level pagination + name/role search on `GET /api/cvs`, preserving response shape
- [x] Frontend: new `/cvs` route + shared nav + candidates table UI
- [x] Docs: ARCHITECTURE.md, REQUIREMENTS.md, ROADMAP.md updated

## Implementation

### Files Modified (backend `services/cv-service`)
- `src/domain/cv/cv.repository.ts` — added `CvPageResult` interface + `findPage` to `ICvRepository`
- `src/infrastructure/database/cv.repository.impl.ts` — implemented `findPage` (parameterized SQL: count + data with `ILIKE` search on name/role, `LIMIT/OFFSET`)
- `src/application/cv/cv-query.service.ts` — added `findPage` to interface + impl
- `src/interfaces/controllers/cv.controller.ts` — rewrote `getAllCvs` to use `findPage` + `search` query param; preserved response shape
- `test/infrastructure/database/cv.repository.impl.test.ts` — added 5 `findPage` unit tests
- `tests/helpers/setup.ts`, `tests/integration/cv.test.ts` — updated mocks/tests for `findPage` + search

### Files Created (frontend `services/frontend`)
- `src/app/cvs/page.tsx` — `/cvs` route with search, table, pagination (page size 10), CvViewerPanel
- `src/components/nav/nav.tsx` — shared header nav (`/chat`, `/cvs`)
- `src/components/candidates/candidates-table.tsx` — table (Name, Role, Phone+copy, Email+copy, Skills chips, Open CV)
- `src/components/candidates/copy-button.tsx` — reusable copy-to-clipboard button with feedback
- `src/hooks/use-cvs.ts` — debounced search + pagination hook

### Files Modified (frontend)
- `src/lib/api.ts` — added `getCvs`, `CvListItem`, `CvListPagination`, `CvListResponse`
- `src/app/chat/page.tsx` — added `<Nav />`

### Docs Modified
- `ARCHITECTURE.md`, `REQUIREMENTS.md`, `ROADMAP.md` (Task 39 added)

### Key Decisions
- Pagination + search executed in the database (parameterized ILIKE on name/role + LIMIT/OFFSET), not in memory.
- Reused the existing `GET /api/cvs` endpoint (response shape unchanged) to avoid a new endpoint and preserve current consumers.
- Reused the existing `CvViewerPanel` for the Open CV action; no new dependencies added.

## Validation

### Smoke Test
- [x] cv-service build (tsc): PASS
- [x] frontend build (`next build`): PASS — includes new `/cvs` route (6 static pages)

### Unit Tests
- [x] cv-service `pnpm --filter cv-service test`: 64/64 passed
- [x] frontend `next lint`: no warnings/errors

### Integration Tests
- [x] cv-service `pnpm --filter cv-service test:integration`: 64/64 passed (CV endpoints + chat)

### E2E Tests
- [ ] Not executed locally (requires running stack)

## Notes
- Pre-existing (unrelated) working-tree change in `services/cv-generator/src/infrastructure/pdf/pdf-renderer.service.ts` was present before this feature and left untouched.
