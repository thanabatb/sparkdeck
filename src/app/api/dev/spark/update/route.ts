import { updateSparkStatus } from "@/lib/sparkdeck/commands";
import {
  createSlackTextResponse,
  formatErrorResponse,
  formatSparkUpdatedResponse
} from "@/lib/sparkdeck/formatters";

export async function GET(request: Request): Promise<Response> {
  try {
    const params = new URL(request.url).searchParams;
    const id = params.get("id") ?? "";
    const status = params.get("status") ?? "";

    const spark = await updateSparkStatus(id, status);
    return createSlackTextResponse(formatSparkUpdatedResponse(spark));
  } catch (error) {
    return createSlackTextResponse(formatErrorResponse(error));
  }
}
