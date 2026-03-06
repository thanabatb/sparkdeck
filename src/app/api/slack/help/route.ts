import {
  createSlackTextResponse,
  formatErrorResponse,
  formatHelpResponse
} from "@/lib/sparkdeck/formatters";
import { parseSlackSlashCommandPayload } from "@/lib/sparkdeck/parse";

export async function POST(request: Request): Promise<Response> {
  try {
    await parseSlackSlashCommandPayload(request, {
      expectedCommand: "/help"
    });

    return createSlackTextResponse(formatHelpResponse());
  } catch (error) {
    const status =
      error instanceof Error && error.message === "Malformed Slack payload." ? 400 : 200;
    return createSlackTextResponse(formatErrorResponse(error), status);
  }
}
