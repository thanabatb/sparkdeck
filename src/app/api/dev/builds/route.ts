import { createSlackTextResponse, formatBuildsListResponse, formatErrorResponse } from "@/lib/sparkdeck/formatters";
import { readStorage } from "@/lib/sparkdeck/storage";

export async function GET(): Promise<Response> {
  try {
    const storage = await readStorage();
    return createSlackTextResponse(formatBuildsListResponse(storage.builds));
  } catch (error) {
    return createSlackTextResponse(formatErrorResponse(error));
  }
}
