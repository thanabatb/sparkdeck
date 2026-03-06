import { getItemStatus } from "@/lib/sparkdeck/commands";
import {
  createSlackTextResponse,
  formatBuildStatusResponse,
  formatErrorResponse,
  formatSparkStatusResponse,
  formatTaskStatusResponse
} from "@/lib/sparkdeck/formatters";

export async function GET(request: Request): Promise<Response> {
  try {
    const id = new URL(request.url).searchParams.get("id") ?? "";
    const itemStatus = await getItemStatus(id);

    if (itemStatus.type === "spark") {
      return createSlackTextResponse(formatSparkStatusResponse(itemStatus));
    }

    if (itemStatus.type === "task") {
      return createSlackTextResponse(formatTaskStatusResponse(itemStatus));
    }

    return createSlackTextResponse(formatBuildStatusResponse(itemStatus));
  } catch (error) {
    return createSlackTextResponse(formatErrorResponse(error));
  }
}
