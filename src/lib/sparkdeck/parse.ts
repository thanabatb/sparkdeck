import { parseItemId, type ParsedItemId } from "./ids";
import type { EntityKind } from "./types";

export interface SlackSlashCommandPayload {
  command: string;
  text: string;
  userId: string;
  channelId: string;
  teamId: string;
}

export interface SlackPayloadOptions {
  expectedCommand?: string;
}

export const VALIDATION_MESSAGES = {
  sparkInputRequired: "Please provide an idea description.",
  forgeInputRequired: "Please provide a spark ID or task description.",
  buildInputRequired: "Please provide a task ID or build target.",
  invalidIdFormat: "Invalid ID format. Use SPARK-001, TASK-001, or BUILD-001.",
  malformedSlackPayload: "Malformed Slack payload."
} as const;

const ITEM_LABEL_BY_KIND: Record<EntityKind, string> = {
  spark: "Spark",
  task: "Task",
  build: "Build"
};

export function normalizeInputText(inputText: string): string {
  return inputText.trim();
}

export function requireNonEmptyInput(inputText: string, errorMessage: string): string {
  const normalized = normalizeInputText(inputText);

  if (!normalized) {
    throw new Error(errorMessage);
  }

  return normalized;
}

export function parseItemIdOrThrow(id: string): ParsedItemId {
  const parsed = parseItemId(id);

  if (!parsed) {
    throw new Error(VALIDATION_MESSAGES.invalidIdFormat);
  }

  return parsed;
}

export function createNotFoundMessage(kind: EntityKind, id: string): string {
  return `${ITEM_LABEL_BY_KIND[kind]} not found: ${id}`;
}

function normalizeField(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parsePayloadFromParams(params: URLSearchParams): SlackSlashCommandPayload {
  return {
    command: normalizeField(params.get("command")),
    text: normalizeField(params.get("text")),
    userId: normalizeField(params.get("user_id")),
    channelId: normalizeField(params.get("channel_id")),
    teamId: normalizeField(params.get("team_id"))
  };
}

function parsePayloadFromObject(data: Record<string, unknown>): SlackSlashCommandPayload {
  return {
    command: normalizeField(data.command),
    text: normalizeField(data.text),
    userId: normalizeField(data.user_id),
    channelId: normalizeField(data.channel_id),
    teamId: normalizeField(data.team_id)
  };
}

export function validateSlackSlashCommandPayload(
  payload: SlackSlashCommandPayload,
  options?: SlackPayloadOptions
): void {
  if (!payload.command || !payload.userId || !payload.channelId) {
    throw new Error(VALIDATION_MESSAGES.malformedSlackPayload);
  }

  if (options?.expectedCommand && payload.command !== options.expectedCommand) {
    throw new Error(VALIDATION_MESSAGES.malformedSlackPayload);
  }
}

export async function parseSlackSlashCommandPayload(
  request: Request,
  options?: SlackPayloadOptions
): Promise<SlackSlashCommandPayload> {
  const contentType = request.headers.get("content-type") ?? "";
  let payload: SlackSlashCommandPayload;

  if (contentType.includes("application/json")) {
    const rawBody = await request.text();
    try {
      const jsonPayload = JSON.parse(rawBody) as Record<string, unknown>;
      payload = parsePayloadFromObject(jsonPayload);
    } catch {
      throw new Error(VALIDATION_MESSAGES.malformedSlackPayload);
    }
  } else {
    const rawBody = await request.text();
    payload = parsePayloadFromParams(new URLSearchParams(rawBody));
  }

  validateSlackSlashCommandPayload(payload, options);
  return payload;
}
