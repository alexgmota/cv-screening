# Agents

## Orchestrator Agent

The orchestrator is the main agent that coordinates the entire development workflow. It reads the roadmap, spawns subagents for tasks, monitors progress, and drives the project forward.

### Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR LOOP                        │
│                                                              │
│  1. Read ROADMAP.md                                          │
│  2. Find first task where:                                   │
│     - status = [ ] (pending)                                 │
│     - all dependencies = [x] (completed)                     │
│  3. Update task status to [~] (in_progress)                  │
│  4. Write task context to current-task.md                    │
│  5. Spawn subagent with task details                         │
│  6. Wait for subagent completion                             │
│  7. Update ROADMAP.md status to [x] or [!]                   │
│  8. Write results to current-task.md                         │
│  9. Loop from step 2                                         │
│                                                              │
│  Stop when: all tasks completed OR failure threshold reached │
└─────────────────────────────────────────────────────────────┘
```

### Task Selection Algorithm

```typescript
function selectNextTask(roadmap: Task[]): Task | null {
  const completedTasks = roadmap.filter(t => t.status === 'completed');
  const completedIds = new Set(completedTasks.map(t => t.id));

  return roadmap.find(task => {
    if (task.status !== 'pending') return false;
    return task.dependencies.every(depId => completedIds.has(depId));
  });
}
```

### Subagent Context

When spawning a subagent, provide:

```typescript
interface SubagentContext {
  taskNumber: number;
  taskTitle: string;
  description: string;
  dependencies: number[];
  acceptanceCriteria: string[];
  filesToCreate: string[];
  filesToModify: string[];
  testCommands: string[];
  serviceContext: 'cv-service' | 'cv-ingestion-service' | 'cv-generator' | 'frontend' | 'shared';
}
```

## Subagent Lifecycle

Each subagent follows a strict 4-phase lifecycle:

### Phase 1: PLAN/EXPLORE (Read-Only)

```
1. Read task description from ROADMAP.md
2. Explore relevant codebase files:
   - Read existing code patterns in the target service
   - Check package.json for dependencies
   - Review shared types from packages/shared
3. Identify affected files and patterns
4. Create implementation plan:
   - List exact files to create/modify
   - Define interfaces and types
   - Identify integration points
5. Write plan to current-task.md
```

**Rules:**
- NO file modifications in this phase
- NO code generation
- ONLY reading and planning

### Phase 2: IMPLEMENT (Write)

```
1. Create/modify files per implementation plan
2. Follow existing code conventions:
   - Match indentation and style
   - Use established patterns
   - Import from shared types
3. Keep changes minimal and focused
4. Update imports and exports as needed
5. Add package dependencies if needed
```

**Rules:**
- Write TypeScript with proper types
- JSDoc on public classes and methods only
- No inline comments
- No secrets or API keys in code

### Phase 3: VALIDATE

Execute validation in order. Stop on first failure.

```
1. SMOKE TEST
   - pnpm build --filter <service>
   - Verify no TypeScript errors
   - Verify no import errors

2. UNIT TESTS
   - pnpm test --filter <service>
   - All existing tests must pass
   - New code should have tests

3. INTEGRATION TESTS (if endpoints changed)
   - pnpm test:integration --filter <service>
   - API returns expected response format
   - Error handling works correctly

4. E2E TESTS (if UI changed)
   - pnpm test:e2e
   - User flow works end-to-end
   - No console errors
```

### Phase 4: REPORT

```
1. Write results to current-task.md:
   - Files created/modified
   - Tests run and results
   - Any issues encountered
   - Key decisions made

2. Mark task complete or document blockers:
   - If all validation passed → mark [x]
   - If validation failed → mark [!] with details
```

## current-task.md Template

```markdown
# Current Task: [Task #] [Task Name]

**Started:** [timestamp]
**Status:** [in_progress | completed | failed]
**Service:** [backend | cv-generator | frontend | shared]

## Plan

### Exploration
- [Files read and analyzed]
- [Patterns identified]

### Implementation Steps
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

## Implementation

### Files Created
- path/to/file.ts

### Files Modified
- path/to/file.ts

### Key Decisions
- [Decision 1]
- [Decision 2]

## Validation

### Smoke Test
- [ ] Build passes: PASS/FAIL
- [ ] No TypeScript errors: PASS/FAIL

### Unit Tests
- [ ] Tests run: X/Y passed
- [ ] Coverage: X%

### Integration Tests
- [ ] Tests run: X/Y passed
- [ ] Endpoints tested: [...]

### E2E Tests
- [ ] Tests run: X/Y passed
- [ ] Flows tested: [...]

## Notes
[Blockers, issues, observations]
```

## Agent Communication

### Orchestrator → Subagent

```
TASK_CONTEXT:
- task_number: 7
- task_title: CV Generator Interfaces
- description: Implement HTTP interfaces: routes, controller, and error handling
- dependencies: [6]
- acceptance_criteria:
  - POST /cv/generate endpoint
  - GET /status endpoint
  - Controller with proper request/request handling
  - Error middleware
  - Express app setup
- files_to_create:
  - services/cv-generator/src/interfaces/routes/generation.routes.ts
  - services/cv-generator/src/interfaces/controllers/generation.controller.ts
  - services/cv-generator/src/interfaces/middleware/error.middleware.ts
  - services/cv-generator/src/index.ts
- files_to_modify: []
- test_commands:
  - pnpm build --filter cv-generator
  - pnpm test --filter cv-generator
- service_context: cv-generator
```

### Subagent → Orchestrator

```
TASK_RESULT:
- task_number: 7
- status: completed
- files_created:
  - services/cv-generator/src/interfaces/routes/generation.routes.ts
  - services/cv-generator/src/interfaces/controllers/generation.controller.ts
  - services/cv-generator/src/interfaces/middleware/error.middleware.ts
  - services/cv-generator/src/index.ts
- files_modified: []
- validation:
  - smoke: PASS
  - unit: PASS (12/12)
  - integration: N/A
  - e2e: N/A
- duration: 18m
- notes: Successfully implemented Express app with routes and error handling
```

## Failure Handling

### Retry Policy

```
- Max retries per task: 2
- Retry delay: 30 seconds
- On retry, include previous error context
```

### Failure Threshold

```
- Max consecutive failures: 3
- On threshold reached, orchestrator stops
- Report generated with failure summary
```

### Common Failures

| Failure | Resolution |
|---------|------------|
| TypeScript error | Fix type issues, rebuild |
| Missing dependency | Add to package.json, reinstall |
| Import error | Check path, update exports |
| Test failure | Fix code or update test |
| API error | Check .env, verify endpoint |

## Headless Mode

To run the orchestrator in headless mode:

```bash
# Start orchestrator
pnpm orchestrate

# Monitor progress
tail -f current-task.md

# Check ROADMAP.md for overall status
```

The orchestrator will:
1. Read ROADMAP.md
2. Process tasks sequentially
3. Update ROADMAP.md status
4. Write progress to current-task.md
5. Continue until all tasks complete or failure threshold
