# TASKLIST.md

## SparkDeck Phase 1 Task List

### 1. Project Setup
- [ ] Initialize a Next.js project with TypeScript
- [ ] Set up the basic folder structure
- [ ] Add environment variable support
- [ ] Add placeholders for Slack secrets and app configuration
- [ ] Ensure the app can run locally

---

### 2. Core Domain Types
- [ ] Create TypeScript types for `Spark`
- [ ] Create TypeScript types for `Task`
- [ ] Create TypeScript types for `Build`
- [ ] Create a shared union or helper type for supported item IDs
- [ ] Define status enums or string literal types

---

### 3. ID System
- [ ] Implement ID generation for `SPARK-001`
- [ ] Implement ID generation for `TASK-001`
- [ ] Implement ID generation for `BUILD-001`
- [ ] Implement ID parsing helpers
- [ ] Implement ID type detection helpers
- [ ] Add tests for ID generation and parsing

---

### 4. Storage Layer
- [ ] Create a simple storage file structure
- [ ] Implement read storage
- [ ] Implement write storage
- [ ] Implement counter management
- [ ] Implement find-by-ID helpers
- [ ] Implement update helpers
- [ ] Keep storage logic outside route handlers
- [ ] Add tests for storage read/write behavior

---

### 5. Slack Utilities
- [ ] Parse Slack slash command payload safely
- [ ] Add helpers for formatting Slack text responses
- [ ] Add input validation helpers
- [ ] Add error response helpers
- [ ] Keep Slack-specific logic isolated from business logic

---

### 6. `/spark` Command
- [ ] Create endpoint or handler for `/spark`
- [ ] Validate input text
- [ ] Create a Spark item
- [ ] Persist the Spark item
- [ ] Return a confirmation response
- [ ] Add tests for success and empty input

Example success output:

```text
SPARK-001 created
Title: AI tool for summarizing conference talks
Status: Inbox
```

---

### 7. `/forge` Command
- [ ] Create endpoint or handler for `/forge`
- [ ] Detect whether the input is a Spark ID or free text
- [ ] Create a Task item
- [ ] Link back to `sourceSparkId` if applicable
- [ ] Update source Spark status when forged from a Spark
- [ ] Persist the Task item
- [ ] Return a confirmation response
- [ ] Add tests for Spark ID input and free-text input

Example success output:

```text
TASK-001 created
Title: Build export CSV for badge recipients
Source: SPARK-001
Status: Todo
```

---

### 8. `/check` Command
- [ ] Create endpoint or handler for `/check`
- [ ] Validate ID format
- [ ] Detect target type from ID
- [ ] Fetch the correct item from storage
- [ ] Return a formatted status response
- [ ] Handle item not found cleanly
- [ ] Add tests for existing and missing items

Example success output:

```text
TASK-001
Title: Build export CSV for badge recipients
Status: In Progress
Source: SPARK-001
```

---

### 9. `/build` Command
- [ ] Create endpoint or handler for `/build`
- [ ] Accept Task ID or free text
- [ ] Create a Build item
- [ ] Persist the Build item
- [ ] Return a build-started response
- [ ] Add tests for Task ID and free-text build requests

Example success output:

```text
BUILD-001 started
Target: TASK-001
Status: Pending
```

---

### 10. Slack Endpoint Wiring
- [ ] Connect all command handlers to Slack request URLs
- [ ] Ensure request parsing works for real Slack payloads
- [ ] Add optional signature verification scaffolding
- [ ] Test each command from Slack manually

---

### 11. Error Handling
- [ ] Handle empty input safely
- [ ] Handle invalid ID format
- [ ] Handle item not found
- [ ] Handle malformed Slack payloads
- [ ] Return readable error messages

Example errors:

```text
Please provide an idea description.
```

```text
Invalid ID format. Use SPARK-001, TASK-001, or BUILD-001.
```

```text
Task not found: TASK-999
```

---

### 12. Deployment
- [ ] Prepare the project for Vercel deployment
- [ ] Add environment variables in deployment settings
- [ ] Deploy the app
- [ ] Update Slack command Request URLs with the deployed domain
- [ ] Run end-to-end checks from Slack

---

### 13. Phase 1 Done Checklist
- [ ] `/spark` works
- [ ] `/forge` works
- [ ] `/build` works
- [ ] `/check` works
- [ ] items persist correctly
- [ ] responses are mobile-friendly
- [ ] the project runs locally
- [ ] the project is deployed successfully

---

## Suggested Build Order
1. Setup project
2. Create types
3. Build ID system
4. Build storage layer
5. Add Slack helpers
6. Implement `/spark`
7. Implement `/forge`
8. Implement `/check`
9. Implement `/build`
10. Connect Slack
11. Deploy
12. Verify end-to-end

---

## Notes
- Keep Phase 1 simple and real
- Do not overengineer
- Keep logic in reusable helpers
- Route handlers should stay thin
- Future AI / GitHub / Vercel integration can be added later
