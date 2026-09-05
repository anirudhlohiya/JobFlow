import { google } from "googleapis";
import { getOAuthClient } from "./auth";

export async function checkForReply(threadId: string, sentAt: Date): Promise<boolean> {
  const auth = await getOAuthClient();
  if (!auth) return false;
  const gmail = google.gmail({ version: "v1", auth: auth.client });

  try {
    const thread = await gmail.users.threads.get({
      userId: "me",
      id: threadId,
      format: "metadata",
      metadataHeaders: ["From", "Subject"],
    });

    const messages = thread.data.messages ?? [];
    // Check for any message newer than sentAt from someone else
    for (const msg of messages) {
      const dateStr = msg.internalDate;
      if (!dateStr) continue;
      const date = new Date(parseInt(dateStr, 10));
      if (date <= sentAt) continue;
      const headers = msg.payload?.headers ?? [];
      const from = headers.find((h) => h.name === "From")?.value ?? "";
      // "From" header format: "Name <email>" — if there's an email and it's not ours...
      const myEmail = auth.email;
      if (!from.includes(myEmail)) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("[thread] Failed to check reply:", error);
    return false;
  }
}