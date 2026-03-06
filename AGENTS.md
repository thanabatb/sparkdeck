# AGENTS.md

## SparkDeck Agent Guide

This file defines how AI coding agents should work on the SparkDeck repository.

SparkDeck is a Slack-first personal command system for capturing ideas, turning them into tasks, and triggering development workflows from chat.

The goal of this file is to keep implementation simple, consistent, and aligned with the intended product direction.

---

## Product Intent

SparkDeck should feel like a lightweight personal Work OS.

It is designed for a solo builder who wants to:

- capture ideas quickly
- convert ideas into tasks
- trigger development workflows from Slack
- check progress easily
- extend the system later into design, research, writing, and software workflows

Core command flow:

```text
spark -> forge -> build -> check
```

This sequence is the main product backbone and should remain easy to understand.

---

## Current Phase

The repository is currently focused on **Phase 1**.

Phase 1 scope:

- `/spark`
- `/forge`
- `/build`
- `/check`

Phase 1 should support:

- capturing ideas
- creating tasks
- creating build entries
- checking status
- persisting data
- responding correctly to Slack slash commands

Do **not** overbuild beyond this scope unless explicitly requested.

---

## Development Philosophy

When implementing code for SparkDeck, follow these rules:

1. Prefer simplicity over cleverness.
2. Prefer explicit code over abstract frameworks.
3. Prefer small reusable helpers over premature architecture.
4. Build the minimum real product that works.
5. Keep Slack command UX clear and human-readable.
6. Keep data structures stable and easy to inspect.
7. Make future GitHub / AI / Vercel integration possible, but do not force it into Phase 1.

---

## What the Agent Should Optimize For

Prioritize the following:

- correctness
- clarity
- maintainability
- extensibility
- mobile-friendly Slack responses
- low friction for command input
- human-readable IDs and statuses

Do not optimize for:

- enterprise complexity
- multi-tenant architecture
- large-scale infra patterns
- unnecessary abstractions
- premature plugin systems
- premature MCP architecture

---

## Recommended Tech Direction

Preferred stack:

- Next.js
- TypeScript
- Slack slash command endpoints
- simple persistence layer
- Vercel deployment

Initial persistence may be:

- JSON file
- SQLite
- Supabase, only if setup is already easy

For Phase 1, a lightweight local-first implementation is acceptable.

---

## Core Domain Objects

SparkDeck currently has three main item types.

### Spark
Represents an idea.

Expected fields:

- `id`
- `title`
- `rawText`
- `status`
- `createdAt`
- `updatedAt`

Suggested statuses:

- `inbox`
- `expanded`
- `forged`
- `archived`

### Task
Represents a structured unit of work.

Expected fields:

- `id`
- `title`
- `description`
- `status`
- `sourceSparkId`
- `createdAt`
- `updatedAt`

Suggested statuses:

- `todo`
- `in_progress`
- `in_review`
- `done`

### Build
Represents a development action.

Expected fields:

- `id`
- `targetTaskId`
- `targetText`
- `status`
- `createdAt`
- `updatedAt`

Suggested statuses:

- `pending`
- `running`
- `completed`
- `failed`

---

## ID Rules

SparkDeck should use clear readable IDs.

Formats:

- `SPARK-001`
- `TASK-001`
- `BUILD-001`

Rules:

- each type increments independently
- IDs should be zero-padded to at least 3 digits
- IDs must remain stable once created
- IDs should be easy to parse and search

Create helper functions for ID generation and ID parsing.

Avoid ad hoc ID logic spread across route handlers.

---

## Command Intent

### `/spark`
Purpose:
Capture a new idea.

Input:
Free text idea description.

Example:

```text
/spark AI tool for summarizing conference talks
```

Expected behavior:

- validate input is not empty
- create a Spark item
- assign a new Spark ID
- persist the item
- return a clean confirmation message

### `/forge`
Purpose:
Convert a Spark into a Task, or create a Task directly.

Input:
- Spark ID, or
- free text task description

Example:

```text
/forge SPARK-001
```

Expected behavior:

- detect whether input is an ID or raw text
- create a Task item
- link to source Spark if relevant
- update Spark status if forged from an existing Spark
- persist everything
- return a confirmation response

### `/build`
Purpose:
Create a build action.

Input:
- Task ID, or
- free text feature description

Example:

```text
/build TASK-001
```

Phase 1 expected behavior:

- create a Build item
- mark it as `pending` or `running`
- persist it
- return a build-started message

Do not require real GitHub integration in Phase 1 unless explicitly requested.

### `/check`
Purpose:
Check status of an existing Spark, Task, or Build.

Input:
- `SPARK-xxx`
- `TASK-xxx`
- `BUILD-xxx`

Expected behavior:

- parse ID
- detect target type
- fetch item from storage
- return a formatted human-readable status response
- show clear error if not found

---

## Route and Handler Design

Prefer one of these two patterns:

### Option A: Separate endpoints
```text
/api/slack/spark
/api/slack/forge
/api/slack/build
/api/slack/check
```

### Option B: Unified endpoint with router
```text
/api/slack/command
```

Both are acceptable.

If using a unified endpoint, keep command routing simple and explicit.

Do not introduce heavy framework-level command buses unless clearly useful.

---

## Suggested Project Structure

```text
src/
  app/
  api/
    slack/
      spark/
      forge/
      build/
      check/
  lib/
    sparkdeck/
      types.ts
      ids.ts
      parse.ts
      storage.ts
      commands.ts
      formatters.ts
      slack.ts
data/
  sparkdeck.json
```

Alternative structures are acceptable if they remain simple and clear.

---

## Storage Guidance

Use a single clear storage layer.

Responsibilities:

- read items
- write items
- generate or track next IDs
- find items by ID
- update items safely

Important:

- keep storage logic outside route handlers
- route handlers should stay thin
- storage shape should be easy to inspect manually

If JSON is used, keep the file shape simple and deterministic.

Suggested shape:

```json
{
  "sparks": [],
  "tasks": [],
  "builds": [],
  "counters": {
    "spark": 1,
    "task": 1,
    "build": 1
  }
}
```

---

## Slack Response Style

Slack responses should be:

- short
- readable
- structured
- friendly but not noisy

Prefer output like this:

```text
SPARK-001 created
Title: AI tool for summarizing conference talks
Status: Inbox
```

Or:

```text
TASK-001
Title: Build export CSV for badge recipients
Status: In Progress
Source: SPARK-001
```

Avoid overly verbose responses.

Avoid decorative formatting that reduces readability on mobile.

---

## Validation Rules

Implement basic validation from the start.

### Empty input
Return a clear message such as:

```text
Please provide an idea description.
```

### Invalid ID format
Return a clear message such as:

```text
Invalid ID format. Use SPARK-001, TASK-001, or BUILD-001.
```

### Not found
Return a clear message such as:

```text
Task not found: TASK-999
```

Validation should be centralized where possible.

---

## Error Handling

Agents should implement safe predictable errors.

Requirements:

- never crash on malformed Slack input
- return a helpful user-facing message
- log enough information for debugging
- avoid leaking secrets or internal implementation details

Prefer controlled failures over silent failures.

---

## Slack Integration Notes

Slash command payloads typically include:

- `command`
- `text`
- `user_id`
- `channel_id`
- `team_id`

The implementation should parse these fields safely.

If signature verification is implemented, keep it modular and isolated.

If signature verification is not implemented yet, structure the code so it can be added later cleanly.

---

## Build Order

AI agents should implement features in this order unless told otherwise:

1. shared types
2. ID generation
3. storage layer
4. formatting helpers
5. `/spark`
6. `/forge`
7. `/check`
8. `/build`
9. Slack endpoint wiring
10. local and deployed verification

This order helps reduce rework.

---

## Testing Guidance

At minimum, test:

- ID generation
- ID parsing
- storage read/write
- `/spark` happy path
- `/forge` from Spark ID
- `/forge` from free text
- `/check` existing item
- `/check` missing item
- `/build` creation flow

Tests do not need to be extensive in Phase 1, but critical logic should be covered.

---

## Extensibility Guidance

SparkDeck is expected to expand later.

Likely future areas:

- AI idea expansion
- GitHub PR creation
- Vercel preview lookup
- Figma integration
- research summarization
- weekly review digests
- project buckets
- tags
- channel-aware behavior
- permissions

When writing Phase 1 code:

- keep future extension possible
- but do not implement future features unless explicitly required

The right approach is:
**simple now, extensible later**

---

## What to Avoid

Do not introduce the following unless explicitly requested:

- event sourcing
- CQRS
- plugin registries
- dependency injection frameworks
- complex ORM setup
- message queues
- background workers
- agent orchestration systems
- MCP-first architecture
- multi-user workspace complexity
- elaborate RBAC systems

SparkDeck should begin as a focused personal tool.

---

## Code Style Preferences

- use TypeScript types clearly
- prefer named helper functions
- keep route handlers small
- avoid giant files
- keep business logic in `lib/`
- choose readability over terseness

Naming should be straightforward.

Good examples:

- `createSpark`
- `createTaskFromSpark`
- `createBuild`
- `findItemById`
- `formatSparkResponse`

Avoid vague names.

---

## Definition of Done for Phase 1

Phase 1 is complete when:

- Slack commands are registered
- endpoints respond successfully
- Spark items can be created
- Task items can be created
- Build items can be created
- `/check` can retrieve them
- storage persists reliably
- app runs locally
- app can be deployed

---

## Agent Instruction Summary

If you are an AI coding agent working on SparkDeck:

- build the smallest real version first
- keep architecture simple
- implement only Phase 1 unless asked otherwise
- keep Slack UX clean
- keep storage understandable
- prefer deterministic logic over speculative abstractions
- make future AI/GitHub/Vercel integration possible, but not required now

SparkDeck should feel like a real product foundation, not a prototype full of shortcuts and not an overengineered platform.
