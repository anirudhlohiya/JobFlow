import { google } from "googleapis";
import { getOAuthClient } from "./auth";

const BOUNDARY = `Boundary_${Date.now()}`;

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  attachments?: { filename: string; content: string | Buffer }[];
  threadId?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<{ messageId: string; threadId: string }> {
  const oauth = await getOAuthClient();
  if (!oauth) throw new Error("Gmail not connected");

  const gmail = google.gmail({ version: "v1", auth: oauth.client });

  const rawParts: string[] = [];

  rawParts.push(`To: ${params.to}`);
  rawParts.push(`Subject: ${encodeHeader(params.subject)}`);
  rawParts.push("MIME-Version: 1.0");
  rawParts.push(`Content-Type: multipart/mixed; boundary="${BOUNDARY}"`);
  rawParts.push("");
  rawParts.push(`--${BOUNDARY}`);
  rawParts.push('Content-Type: text/plain; charset="UTF-8"');
  rawParts.push("Content-Transfer-Encoding: 7bit");
  rawParts.push("");
  rawParts.push(params.body);

  for (const att of params.attachments ?? []) {
    const contentBase64 =
      typeof att.content === "string"
        ? att.content.startsWith("data:")
          ? att.content.split(",")[1].replace(/\s/g, "")
          : att.content
        : att.content.toString("base64");

    rawParts.push(`--${BOUNDARY}`);
    rawParts.push(`Content-Type: application/pdf; name="${att.filename}"`);
    rawParts.push("Content-Transfer-Encoding: base64");
    rawParts.push(`Content-Disposition: attachment; filename="${att.filename}"`);
    rawParts.push("");
    rawParts.push(contentBase64);
  }

  rawParts.push(`--${BOUNDARY}--`);

  const raw = Buffer.from(rawParts.join("\r\n"), "utf8").toString("base64");

  const reqBody: Record<string, unknown> = { raw };
  if (params.threadId) {
    reqBody.threadId = params.threadId;
  }

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: reqBody as never,
  });

  return {
    messageId: res.data.id ?? "",
    threadId: res.data.threadId ?? params.threadId ?? "",
  };
}

function encodeHeader(value: string): string {
  if (/[^\x00-\x7F]/.test(value) || value.length > 60) {
    return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
  }
  return value;
}