# SparkDeck

SparkDeck is a Slack-first personal command system.

## Local Setup

1. Install dependencies:
```bash
npm install
```
2. Copy env placeholders:
```bash
cp .env.example .env.local
```
3. Start the dev server:
```bash
npm run dev
```
4. Open `http://localhost:3000`.

## Current Status

Step 1 (project foundation) is complete:
- Next.js + TypeScript app with App Router and `src/` structure
- base SparkDeck folders and placeholder core files
- initial JSON storage file at `data/sparkdeck.json`

Slack command logic is intentionally not implemented yet.
