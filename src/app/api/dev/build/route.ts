import { createBuild } from "@/lib/sparkdeck/commands";
import {
  createSlackTextResponse,
  formatBuildCreatedResponse,
  formatErrorResponse
} from "@/lib/sparkdeck/formatters";

export async function GET(request: Request): Promise<Response> {
  try {
    const text = new URL(request.url).searchParams.get("text") ?? "";
    const build = await createBuild(text);
    return createSlackTextResponse(formatBuildCreatedResponse(build));
  } catch (error) {
    return createSlackTextResponse(formatErrorResponse(error));
  }
}
