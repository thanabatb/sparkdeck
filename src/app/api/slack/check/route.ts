import { getItemStatus } from "@/lib/sparkdeck/commands";
import {
  createSlackTextResponse,
  formatBuildStatusResponse,
  formatErrorResponse,
  formatSparkStatusResponse,
  formatTaskStatusResponse
} from "@/lib/sparkdeck/formatters";
import { parseSlackSlashCommandPayload } from "@/lib/sparkdeck/parse";

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = await parseSlackSlashCommandPayload(request, {
      expectedCommand: "/check"
    });
    const itemStatus = await getItemStatus(payload.text);

    if (itemStatus.type === "spark") {
      return createSlackTextResponse(formatSparkStatusResponse(itemStatus));
    }

    if (itemStatus.type === "task") {
      return createSlackTextResponse(formatTaskStatusResponse(itemStatus));
    }

    return createSlackTextResponse(formatBuildStatusResponse(itemStatus));
  } catch (error) {
    const status =
      error instanceof Error && error.message === "Malformed Slack payload." ? 400 : 200;
    return createSlackTextResponse(formatErrorResponse(error), status);
  }
}
