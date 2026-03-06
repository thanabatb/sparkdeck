import { createBuild } from "@/lib/sparkdeck/commands";
import {
  createSlackTextResponse,
  formatBuildCreatedResponse,
  formatErrorResponse
} from "@/lib/sparkdeck/formatters";
import { parseSlackSlashCommandPayload } from "@/lib/sparkdeck/parse";

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = await parseSlackSlashCommandPayload(request);
    const build = await createBuild(payload.text);
    return createSlackTextResponse(formatBuildCreatedResponse(build));
  } catch (error) {
    return createSlackTextResponse(formatErrorResponse(error));
  }
}
