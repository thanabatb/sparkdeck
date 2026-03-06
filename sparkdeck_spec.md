# SparkDeck

SparkDeck is a Slack-first command system for capturing ideas, turning them into tasks, and triggering development workflows from chat.

## Vision

SparkDeck is designed to be a lightweight personal Work OS for a solo builder.

It allows the user to:

- capture ideas quickly
- convert ideas into structured tasks
- trigger development workflows
- track progress
- eventually connect design, research, writing, and software workflows

Core concept:

spark → forge → build → check

---

## Command System

### /spark
Capture a new idea.

Example:

/spark AI tool for summarizing conference talks

Output:

SPARK-001 created  
Title: AI tool for summarizing conference talks  
Status: Inbox

---

### /forge
Convert a spark into a task.

Example:

/forge SPARK-001

Output:

TASK-001 created  
Title: AI tool for summarizing conference talks  
Source: SPARK-001  
Status: Todo

---

### /build
Trigger a development workflow.

Example:

/build TASK-001

Output:

BUILD-001 started  
Target: TASK-001  
Status: Pending

Future version will:

- generate code
- create GitHub branch
- open PR

---

### /check
Check the status of any item.

Examples:

/check SPARK-001  
/check TASK-001  
/check BUILD-001

Example output:

TASK-001  
Title: AI tool for summarizing conference talks  
Status: In Progress  
Source: SPARK-001

---

## ID System

SparkDeck uses readable IDs.

Formats:

SPARK-001  
TASK-001  
BUILD-001  

Each type increments independently.

---

## Data Model

### Spark

Fields

- id
- title
- rawText
- status
- createdAt
- updatedAt

---

### Task

Fields

- id
- title
- description
- status
- sourceSparkId
- createdAt
- updatedAt

---

### Build

Fields

- id
- targetTaskId
- targetText
- status
- createdAt
- updatedAt

---

## Slack Integration

Slash commands used:

/spark  
/forge  
/build  
/check  

Each command maps to an API endpoint.

Example structure:

Slack  
→ SparkDeck API  
→ Command handler  
→ Storage  
→ Slack response

---

## Suggested Tech Stack

- Next.js
- TypeScript
- Slack Slash Commands
- simple storage (JSON or SQLite)
- GitHub API (later)
- Vercel deployment

---

## Project Structure

src/
  api/
    slack/
      spark/
      forge/
      build/
      check/
  lib/
    ids.ts
    storage.ts
    types.ts
    slack.ts

data/
  sparkdeck.json

---

## Phase 1 Goals

Implement:

- /spark
- /forge
- /build
- /check

Features:

- create Spark
- create Task
- create Build
- check status
- persistent storage
- Slack responses

---

## Phase 2 Ideas

Future improvements:

- AI idea expansion
- GitHub PR creation
- Vercel preview lookup
- Figma integration
- research summarization
- weekly idea review
- tagging system
- project buckets

Potential commands:

/ignite  
/brain  
/launch  
/review  
/design  
/research  

---

## Definition of Done (Phase 1)

SparkDeck Phase 1 is complete when:

- all four Slack commands respond
- Spark items can be created
- Tasks can be created
- Builds can be created
- /check returns correct data
- storage persists
- system deploys successfully