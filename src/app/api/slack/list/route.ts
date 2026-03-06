import {
  createSlackTextResponse,
  formatBuildsListResponse,
  formatErrorResponse,
  formatSparksListResponse,
  formatTasksListResponse
} from "@/lib/sparkdeck/formatters";
import { parseSlackSlashCommandPayload } from "@/lib/sparkdeck/parse";
import { readStorage } from "@/lib/sparkdeck/storage";

type ListTarget = "sparks" | "tasks" | "builds";

function parseListTarget(input: string): ListTarget {
  const normalized = input.trim().toLowerCase();

  if (!normalized) {
    return "sparks";
  }

  if (normalized === "sparks" || normalized === "tasks" || normalized === "builds") {
    return normalized;
  }

  throw new Error("Invalid list target. Use sparks, tasks, or builds.");
}

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = await parseSlackSlashCommandPayload(request, {
      expectedCommand: "/list"
    });
    const target = parseListTarget(payload.text);
    const storage = await readStorage();

    if (target === "sparks") {
      if (storage.sparks.length === 0) {
        return createSlackTextResponse("No sparks found.");
      }

      return createSlackTextResponse(formatSparksListResponse(storage.sparks));
    }

    if (target === "tasks") {
      if (storage.tasks.length === 0) {
        return createSlackTextResponse("No tasks found.");
      }

      return createSlackTextResponse(formatTasksListResponse(storage.tasks));
    }

    if (storage.builds.length === 0) {
      return createSlackTextResponse("No builds found.");
    }

    return createSlackTextResponse(formatBuildsListResponse(storage.builds));
  } catch (error) {
    const status =
      error instanceof Error && error.message === "Malformed Slack payload." ? 400 : 200;
    return createSlackTextResponse(formatErrorResponse(error), status);
  }
}
