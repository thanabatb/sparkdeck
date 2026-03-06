import { createSpark } from "@/lib/sparkdeck/commands";
import {
  createSlackTextResponse,
  formatErrorResponse,
  formatSparkCreatedResponse
} from "@/lib/sparkdeck/formatters";

export async function GET(request: Request): Promise<Response> {
  try {
    const text = new URL(request.url).searchParams.get("text") ?? "";
    const spark = await createSpark(text);
    return createSlackTextResponse(formatSparkCreatedResponse(spark));
  } catch (error) {
    return createSlackTextResponse(formatErrorResponse(error));
  }
}
