import { createSpark } from "@/lib/sparkdeck/commands";
import {
  createSlackTextResponse,
  formatErrorResponse,
  formatSparkCreatedResponse
} from "@/lib/sparkdeck/formatters";
import { parseSlackSlashCommandPayload } from "@/lib/sparkdeck/parse";

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = await parseSlackSlashCommandPayload(request, {
      expectedCommand: "/spark"
    });
    const spark = await createSpark(payload.text);
    return createSlackTextResponse(formatSparkCreatedResponse(spark));
  } catch (error) {
    const status =
      error instanceof Error && error.message === "Malformed Slack payload." ? 400 : 200;
    return createSlackTextResponse(formatErrorResponse(error), status);
  }
}
