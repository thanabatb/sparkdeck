# INITIAL_PROMPT.md

You are building **SparkDeck Phase 1**.

Please read and follow these files first:

1. `sparkdeck_spec.md`
2. `AGENTS.md`
3. `TASKLIST.md`

## Your mission

Build the smallest real, working version of SparkDeck.

SparkDeck is a Slack-first personal command system for:

- capturing ideas
- converting ideas into tasks
- creating build entries
- checking status

Core command flow:

```text
spark -> forge -> build -> check
```

## Phase 1 Commands
Implement support for these Slack slash commands:

- `/spark`
- `/forge`
- `/build`
- `/check`

## Required behavior

### `/spark`
- accept free text
- create a Spark item
- assign a readable ID like `SPARK-001`
- persist the item
- return a Slack-friendly response

### `/forge`
- accept either a Spark ID or free text
- create a Task item
- link back to `sourceSparkId` when appropriate
- update the original Spark status if forged from a Spark
- persist changes
- return a Slack-friendly response

### `/build`
- accept either a Task ID or free text
- create a Build item
- assign a readable ID like `BUILD-001`
- persist the item
- return a Slack-friendly response

### `/check`
- accept `SPARK-xxx`, `TASK-xxx`, or `BUILD-xxx`
- detect the type from the ID
- fetch the item from storage
- return a Slack-friendly response
- handle missing items gracefully

## Technical preferences
- Use **Next.js + TypeScript**
- Keep route handlers thin
- Keep business logic in reusable helpers under `lib/`
- Use a simple persistence layer for Phase 1
- Prefer readability over clever abstractions
- Do not implement AI automation yet
- Do not implement GitHub PR creation yet
- Do not overengineer architecture

## Recommended storage approach
A simple JSON file is acceptable for Phase 1.

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

## Expected output style
Slack responses should be concise, readable, and mobile-friendly.

Examples:

```text
SPARK-001 created
Title: AI tool for summarizing conference talks
Status: Inbox
```

```text
TASK-001 created
Title: Build export CSV for badge recipients
Source: SPARK-001
Status: Todo
```

```text
BUILD-001 started
Target: TASK-001
Status: Pending
```

```text
TASK-001
Title: Build export CSV for badge recipients
Status: In Progress
Source: SPARK-001
```

## Validation requirements
Handle these cases clearly:

- empty input
- invalid ID format
- item not found
- malformed Slack payloads

Examples:

```text
Please provide an idea description.
```

```text
Invalid ID format. Use SPARK-001, TASK-001, or BUILD-001.
```

```text
Task not found: TASK-999
```

## Suggested implementation order
1. Set up the project
2. Create shared types
3. Create ID generation and parsing helpers
4. Create the storage layer
5. Create Slack response formatters
6. Implement `/spark`
7. Implement `/forge`
8. Implement `/check`
9. Implement `/build`
10. Wire routes to Slack
11. Test locally
12. Prepare for Vercel deployment

## Important constraints
- Build only Phase 1
- Keep the architecture simple
- Make the code easy to extend later
- Do not add unnecessary abstractions
- Do not introduce MCP, queues, workers, or plugin systems
- Do not assume enterprise requirements

## Deliverables
Please create:

- working command handlers
- storage layer
- ID helpers
- validation helpers
- Slack-friendly formatted responses
- basic tests where useful
- a clean, understandable project structure

If something is ambiguous, choose the simplest implementation that fits the Phase 1 goals.
