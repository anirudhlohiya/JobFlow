/**
 * JobFlow Gmail Scheduler — Google Apps Script
 *
 * Runs entirely inside Google's cloud. JobFlow posts /JobFlow draft or the
 * email payload here, and this script schedules a one-time trigger that sends
 * the email at the requested time. Nothing needs to run on the user's machine.
 *
 * DEPLOY (one time, ~3 min):
 * 1. Go to https://script.google.com  →  New project  →  delete the default code.
 * 2. Paste this entire file into the editor.
 * 3. Give it a name, then click  Deploy → New deployment → Web app.
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    - Copy the /exec URL (e.g. https://script.google.com/macros/s/XXX/exec)
 * 4. Paste that URL into JobFlow Settings → "Gmail Scheduler" → Scheduler URL,
 *    and set a token of your choice (same value in both places).
 *
 * Then, when you approve an application, the draft is created in Gmail AND a
 * one-time trigger sends it automatically at the next send-window time.
 */

const TOKEN = ""; // OPTIONAL extra guard; JobFlow sends its own token in the body.

function requireValidToken(payloadToken: string): void {
  if (!TOKEN) return;
  if (payloadToken !== TOKEN) {
    throw new Error("Invalid token.");
  }
}

function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  try {
    const payload =
      typeof e.postData.contents === "string"
        ? JSON.parse(e.postData.contents)
        : JSON.parse(e.postData.contents);

    requireValidToken(payload.token || "");

    if (payload.action !== "schedule_send") {
      throw new Error("Unknown action: must be 'schedule_send'.");
    }

    const when = new Date(payload.when);
    if (isNaN(when.getTime())) {
      throw new Error("Invalid 'when' date.");
    }
    if (when.getTime() <= Date.now()) {
      throw new Error("'when' must be in the future.");
    }

    const props = PropertiesService.getScriptProperties();
    const sendKey = `jobflow_send_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    props.setProperty(sendKey, JSON.stringify(payload));

    // Fire the send trigger at the requested time.
    ScriptApp.newTrigger("sendScheduledMail")
      .timeBased()
      .at(when)
      .create();

    const triggerId =
      ScriptApp.getProjectTriggers()
        .filter((t) => t.getTriggerSource() === ScriptApp.TriggerSource.CLOCK)
        .slice(-1)[0]?.getUniqueId() ?? "";

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, scheduledFor: when.toISOString(), triggerId })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(error) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function sendScheduledMail(trigger: GoogleAppsScript.Script.Trigger): void {
  const props = PropertiesService.getScriptProperties();
  const all = props.getProperties();

  const pending = Object.keys(all).filter((k) => k.startsWith("jobflow_send_"));
  let handled = 0;

  for (const key of pending) {
    const data = JSON.parse(all[key]);
    if (trigger.getUniqueId() !== "" && handled < 0) continue; // single-send safety

    const when = new Date(data.when);
    if (when.getTime() > Date.now()) continue; // not due yet, keep waiting

    const options: GoogleAppsScript.Gmail.GmailAdvancedOptions = {};
    if (data.attachmentBase64 && data.attachmentName) {
      options.attachments = [
        Utilities.newBlob(Utilities.base64Decode(data.attachmentBase64), "application/pdf", data.attachmentName),
      ];
    }

    GmailApp.sendEmail(data.to, data.subject, data.body, options);
    props.deleteProperty(key);
    handled++;
  }

  if (handled > 0) {
    // Remove the fired trigger so it never runs again.
    ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
  }
}