import { parseItemId, type ParsedItemId } from "./ids";
import type { EntityKind } from "./types";

export interface SlackSlashCommandPayload {
  command: string;
  text: string;
  userId: string;
  channelId: string;
  teamId: string;
}

export const VALIDATION_MESSAGES = {
  sparkInputRequired: "Please provide an idea description.",
  forgeInputRequired: "Please provide a spark ID or task description.",
  buildInputRequired: "Please provide a task ID or build target.",
  invalidIdFormat: "Invalid ID format. Use SPARK-001, TASK-001, or BUILD-001."
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

function parsePayloadFromParams(params: URLSearchParams): SlackSlashCommandPayload {
  return {
    command: params.get("command") ?? "",
    text: params.get("text") ?? "",
    userId: params.get("user_id") ?? "",
    channelId: params.get("channel_id") ?? "",
    teamId: params.get("team_id") ?? ""
  };
}

function parsePayloadFromObject(data: Record<string, unknown>): SlackSlashCommandPayload {
  return {
    command: typeof data.command === "string" ? data.command : "",
    text: typeof data.text === "string" ? data.text : "",
    userId: typeof data.user_id === "string" ? data.user_id : "",
    channelId: typeof data.channel_id === "string" ? data.channel_id : "",
    teamId: typeof data.team_id === "string" ? data.team_id : ""
  };
}

export async function parseSlackSlashCommandPayload(
  request: Request
): Promise<SlackSlashCommandPayload> {
  const contentType = request.headers.get("content-type") ?? "";
  const rawBody = await request.text();

  if (!rawBody) {
    return parsePayloadFromParams(new URLSearchParams());
  }

  if (contentType.includes("application/json")) {
    try {
      const jsonPayload = JSON.parse(rawBody) as Record<string, unknown>;
      return parsePayloadFromObject(jsonPayload);
    } catch {
      throw new Error("Malformed Slack payload.");
    }
  }

  return parsePayloadFromParams(new URLSearchParams(rawBody));
}
