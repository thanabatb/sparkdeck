import { createTaskFromInput } from "@/lib/sparkdeck/commands";
import {
  createSlackTextResponse,
  formatErrorResponse,
  formatTaskCreatedResponse
} from "@/lib/sparkdeck/formatters";

export async function GET(request: Request): Promise<Response> {
  try {
    const text = new URL(request.url).searchParams.get("text") ?? "";
    const task = await createTaskFromInput(text);
    return createSlackTextResponse(formatTaskCreatedResponse(task));
  } catch (error) {
    return createSlackTextResponse(formatErrorResponse(error));
  }
}
