export interface SlackSlashCommandPayload {
  command: string;
  text: string;
  userId: string;
  channelId: string;
  teamId: string;
}

function parsePayloadFromParams(params: URLSearchParams): SlackSlashCommandPayload {
  return {
    command: params.get("command") ?? "",
    text: params.get("text") ?? "",
    userId: params.get("user_id") ?? "",
    channelId: params.get("channel_id") ?? "",
    teamId: params.get("team_id") ?? ""
  };
}

function parsePayloadFromObject(data: Record<string, unknown>): SlackSlashCommandPayload {
  return {
    command: typeof data.command === "string" ? data.command : "",
    text: typeof data.text === "string" ? data.text : "",
    userId: typeof data.user_id === "string" ? data.user_id : "",
    channelId: typeof data.channel_id === "string" ? data.channel_id : "",
    teamId: typeof data.team_id === "string" ? data.team_id : ""
  };
}

export async function parseSlackSlashCommandPayload(
  request: Request
): Promise<SlackSlashCommandPayload> {
  const contentType = request.headers.get("content-type") ?? "";
  const rawBody = await request.text();

  if (!rawBody) {
    return parsePayloadFromParams(new URLSearchParams());
  }

  if (contentType.includes("application/json")) {
    try {
      const jsonPayload = JSON.parse(rawBody) as Record<string, unknown>;
      return parsePayloadFromObject(jsonPayload);
    } catch {
      throw new Error("Malformed Slack payload.");
    }
  }

  return parsePayloadFromParams(new URLSearchParams(rawBody));
}
