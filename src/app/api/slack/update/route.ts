import { updateItemStatusFromInput } from "@/lib/sparkdeck/commands";
import {
  createSlackTextResponse,
  formatBuildUpdatedResponse,
  formatErrorResponse,
  formatSparkUpdatedResponse,
  formatTaskUpdatedResponse
} from "@/lib/sparkdeck/formatters";
import { parseSlackSlashCommandPayload } from "@/lib/sparkdeck/parse";

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = await parseSlackSlashCommandPayload(request, {
      expectedCommand: "/update"
    });
    const updatedItem = await updateItemStatusFromInput(payload.text);

    if ("rawText" in updatedItem) {
      return createSlackTextResponse(formatSparkUpdatedResponse(updatedItem));
    }

    if ("description" in updatedItem) {
      return createSlackTextResponse(formatTaskUpdatedResponse(updatedItem));
    }

    return createSlackTextResponse(formatBuildUpdatedResponse(updatedItem));
  } catch (error) {
    const status =
      error instanceof Error && error.message === "Malformed Slack payload." ? 400 : 200;
    return createSlackTextResponse(formatErrorResponse(error), status);
  }
}
