import { updateBuildStatus } from "@/lib/sparkdeck/commands";
import {
  createSlackTextResponse,
  formatBuildUpdatedResponse,
  formatErrorResponse
} from "@/lib/sparkdeck/formatters";

export async function GET(request: Request): Promise<Response> {
  try {
    const params = new URL(request.url).searchParams;
    const id = params.get("id") ?? "";
    const status = params.get("status") ?? "";

    const build = await updateBuildStatus(id, status);
    return createSlackTextResponse(formatBuildUpdatedResponse(build));
  } catch (error) {
    return createSlackTextResponse(formatErrorResponse(error));
  }
}
