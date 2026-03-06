import { createSlackTextResponse, formatErrorResponse, formatTasksListResponse } from "@/lib/sparkdeck/formatters";
import { readStorage } from "@/lib/sparkdeck/storage";

export async function GET(): Promise<Response> {
  try {
    const storage = await readStorage();
    return createSlackTextResponse(formatTasksListResponse(storage.tasks));
  } catch (error) {
    return createSlackTextResponse(formatErrorResponse(error));
  }
}
