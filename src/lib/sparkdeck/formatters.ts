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

export function formatItemStatusResponse(item: ItemStatusResponse): string {
  if (item.type === "spark") {
    return `${item.id}\nTitle: ${item.title}\nStatus: ${toStatusLabel(item.status)}`;
  }

  if (item.type === "task") {
    const lines = [`${item.id}`, `Title: ${item.title}`, `Status: ${toStatusLabel(item.status)}`];

    if (item.sourceSparkId) {
      lines.push(`Source: ${item.sourceSparkId}`);
    }

    return lines.join("\n");
  }

  const target = item.targetTaskId ?? item.targetText ?? "N/A";
  return `${item.id}\nTarget: ${target}\nStatus: ${toStatusLabel(item.status)}`;
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
