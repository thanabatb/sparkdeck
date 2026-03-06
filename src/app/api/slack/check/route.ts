import { getItemStatus } from "@/lib/sparkdeck/commands";
import {
  createSlackTextResponse,
  formatErrorResponse,
  formatItemStatusResponse
} from "@/lib/sparkdeck/formatters";
import { parseSlackSlashCommandPayload } from "@/lib/sparkdeck/parse";

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = await parseSlackSlashCommandPayload(request);
    const itemStatus = await getItemStatus(payload.text);
    return createSlackTextResponse(formatItemStatusResponse(itemStatus));
  } catch (error) {
    return createSlackTextResponse(formatErrorResponse(error));
  }
}
