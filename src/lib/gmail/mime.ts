/**
 * Shared MIME construction for the Gmail API.
 * Used by both immediate send and draft creation so the two stay identical.
 */

export interface MimeAttachment {
  filename: string;
  content: string | Buffer;
}

export function buildMimeMessage(params: {
  to: string;
  subject: string;
  body: string;
  attachments?: MimeAttachment[];
  threadId?: string;
}): { raw: string; threadId?: string } {
  const BOUNDARY = `Boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;

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

  return params.threadId ? { raw, threadId: params.threadId } : { raw };
}

export function encodeHeader(value: string): string {
  if (/[^\x00-\x7F]/.test(value) || value.length > 60) {
    return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
  }
  return value;
}