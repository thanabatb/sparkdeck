import type { ItemStatusResponse } from "./commands";
import type { Build, Spark, Task } from "./types";

function toStatusLabel(status: string): string {
  return status
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function formatSparkCreatedResponse(spark: Spark): string {
  return `${spark.id} created\nTitle: ${spark.title}\nStatus: ${toStatusLabel(spark.status)}`;
}

export function formatTaskCreatedResponse(task: Task): string {
  const lines = [`${task.id} created`, `Title: ${task.title}`];

  if (task.sourceSparkId) {
    lines.push(`Source: ${task.sourceSparkId}`);
  }

  lines.push(`Status: ${toStatusLabel(task.status)}`);
  return lines.join("\n");
}

export function formatBuildCreatedResponse(build: Build): string {
  const target = build.targetTaskId ?? build.targetText ?? "N/A";
  return `${build.id} started\nTarget: ${target}\nStatus: ${toStatusLabel(build.status)}`;
}

export function formatSparkUpdatedResponse(spark: Spark): string {
  return `${spark.id} updated\nStatus: ${toStatusLabel(spark.status)}`;
}

export function formatTaskUpdatedResponse(task: Task): string {
  return `${task.id} updated\nStatus: ${toStatusLabel(task.status)}`;
}

export function formatBuildUpdatedResponse(build: Build): string {
  return `${build.id} updated\nStatus: ${toStatusLabel(build.status)}`;
}

export function formatSparkStatusResponse(item: Extract<ItemStatusResponse, { type: "spark" }>): string {
  return `${item.id}\nTitle: ${item.title}\nStatus: ${toStatusLabel(item.status)}`;
}

export function formatTaskStatusResponse(item: Extract<ItemStatusResponse, { type: "task" }>): string {
  const lines = [`${item.id}`, `Title: ${item.title}`, `Status: ${toStatusLabel(item.status)}`];

  if (item.sourceSparkId) {
    lines.push(`Source: ${item.sourceSparkId}`);
  }

  return lines.join("\n");
}

export function formatBuildStatusResponse(
  item: Extract<ItemStatusResponse, { type: "build" }>
): string {
  const target = item.targetTaskId ?? item.targetText ?? "N/A";
  return `${item.id}\nTarget: ${target}\nStatus: ${toStatusLabel(item.status)}`;
}

export function formatItemStatusResponse(item: ItemStatusResponse): string {
  if (item.type === "spark") {
    return formatSparkStatusResponse(item);
  }

  if (item.type === "task") {
    return formatTaskStatusResponse(item);
  }

  return formatBuildStatusResponse(item);
}

export function formatErrorResponse(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export function createSlackTextResponse(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8"
    }
  });
}

function toEpochMillis(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortNewestFirst<T extends { createdAt: string; id: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const byCreatedAt = toEpochMillis(b.createdAt) - toEpochMillis(a.createdAt);
    if (byCreatedAt !== 0) {
      return byCreatedAt;
    }

    return b.id.localeCompare(a.id);
  });
}

export function formatSparksListResponse(sparks: Spark[]): string {
  if (sparks.length === 0) {
    return "SPARKS\nNo sparks found.";
  }

  const lines = sortNewestFirst(sparks).map(
    (spark) => `${spark.id} — ${spark.title} — ${toStatusLabel(spark.status)}`
  );

  return ["SPARKS", ...lines].join("\n");
}

export function formatTasksListResponse(tasks: Task[]): string {
  if (tasks.length === 0) {
    return "TASKS\nNo tasks found.";
  }

  const lines = sortNewestFirst(tasks).map(
    (task) => `${task.id} — ${task.title} — ${toStatusLabel(task.status)}`
  );

  return ["TASKS", ...lines].join("\n");
}

export function formatBuildsListResponse(builds: Build[]): string {
  if (builds.length === 0) {
    return "BUILDS\nNo builds found.";
  }

  const lines = sortNewestFirst(builds).map((build) => {
    const target = build.targetTaskId ?? build.targetText ?? "N/A";
    return `${build.id} — ${target} — ${toStatusLabel(build.status)}`;
  });

  return ["BUILDS", ...lines].join("\n");
}
