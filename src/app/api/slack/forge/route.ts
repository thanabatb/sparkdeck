import { createTaskFromInput } from "@/lib/sparkdeck/commands";
import {
  createSlackTextResponse,
  formatErrorResponse,
  formatTaskCreatedResponse
} from "@/lib/sparkdeck/formatters";
import { parseSlackSlashCommandPayload } from "@/lib/sparkdeck/parse";

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = await parseSlackSlashCommandPayload(request, {
      expectedCommand: "/forge"
    });
    const task = await createTaskFromInput(payload.text);
    return createSlackTextResponse(formatTaskCreatedResponse(task));
  } catch (error) {
    const status =
      error instanceof Error && error.message === "Malformed Slack payload." ? 400 : 200;
    return createSlackTextResponse(formatErrorResponse(error), status);
  }
}
