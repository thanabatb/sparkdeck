import { createBuild } from "@/lib/sparkdeck/commands";
import {
  createSlackTextResponse,
  formatBuildCreatedResponse,
  formatErrorResponse
} from "@/lib/sparkdeck/formatters";
import { parseSlackSlashCommandPayload } from "@/lib/sparkdeck/parse";

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = await parseSlackSlashCommandPayload(request, {
      expectedCommand: "/build"
    });
    const build = await createBuild(payload.text);
    return createSlackTextResponse(formatBuildCreatedResponse(build));
  } catch (error) {
    const status =
      error instanceof Error && error.message === "Malformed Slack payload." ? 400 : 200;
    return createSlackTextResponse(formatErrorResponse(error), status);
  }
}
