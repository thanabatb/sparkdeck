import { updateTaskStatus } from "@/lib/sparkdeck/commands";
import {
  createSlackTextResponse,
  formatErrorResponse,
  formatTaskUpdatedResponse
} from "@/lib/sparkdeck/formatters";

export async function GET(request: Request): Promise<Response> {
  try {
    const params = new URL(request.url).searchParams;
    const id = params.get("id") ?? "";
    const status = params.get("status") ?? "";

    const task = await updateTaskStatus(id, status);
    return createSlackTextResponse(formatTaskUpdatedResponse(task));
  } catch (error) {
    return createSlackTextResponse(formatErrorResponse(error));
  }
}
